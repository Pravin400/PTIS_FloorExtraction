using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Auth;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Single source of truth for minting an authenticated session, used by both password-only
/// login and post-MFA login completion so refresh-token issuance logic exists in exactly one
/// place.
/// </summary>
public class AuthTokenIssuerService : IAuthTokenIssuerService
{
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IUserAccessRepository _userAccessRepository;
    private readonly IConfiguration _configuration;
    private readonly IRepository<ULBMasterEntity> _ulbRepository;
    private readonly IRepository<UserRoleAllocationEntity> _roleAllocationRepository;
    private readonly IRepository<UserRoleMasterEntity> _roleRepository;

    public AuthTokenIssuerService(
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        IRefreshTokenRepository refreshTokenRepository,
        IUserAccessRepository userAccessRepository,
        IConfiguration configuration,
        IRepository<ULBMasterEntity> ulbRepository,
        IRepository<UserRoleAllocationEntity> roleAllocationRepository,
        IRepository<UserRoleMasterEntity> roleRepository)
    {
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _refreshTokenRepository = refreshTokenRepository;
        _userAccessRepository = userAccessRepository;
        _configuration = configuration;
        _ulbRepository = ulbRepository;
        _roleAllocationRepository = roleAllocationRepository;
        _roleRepository = roleRepository;
    }

    public async Task<string> GenerateAccessTokenAsync(UserEntity user, string authenticationMethod,
        CancellationToken cancellationToken = default)
    {
        var organizationId = await _ulbRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Id)
            .Select(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (organizationId <= 0)
            throw new InvalidOperationException("An active ULB is required before a user session can be issued.");

        var roles = await (
            from allocation in _roleAllocationRepository.GetQueryable().AsNoTracking()
            join role in _roleRepository.GetQueryable().AsNoTracking()
                on allocation.UserRoleId equals role.Id
            where allocation.UserId == user.Id && allocation.IsActive && role.IsActive
            select role.UserRoleName)
            .Distinct()
            .ToListAsync(cancellationToken);

        return _tokenService.GenerateToken(user.Id, user.UserName, authenticationMethod,
            user.SecurityStamp, organizationId, roles);
    }

    public async Task<LoginResponseDto> IssueAsync(UserEntity user, string authenticationMethod, CancellationToken cancellationToken = default)
    {
        // Deliberately DateTime.Now (not TimeProvider/UTC): RefreshTokenEntity.ExpiresAt is
        // compared against DateTime.Now everywhere else in this codebase (RefreshTokenRepository,
        // AuthService.RefreshTokenAsync) — writing a UTC value here while those read it as local
        // time would silently corrupt refresh-token expiry by the server's UTC offset.
        var now = DateTime.Now;

        var token = await GenerateAccessTokenAsync(user, authenticationMethod, cancellationToken);

        var refreshToken = _tokenService.GenerateRefreshToken();
        var refreshTokenExpiryDays = int.TryParse(_configuration["Jwt:RefreshTokenExpiryDays"], out var days) ? days : 7;
        var refreshTokenHash = _passwordHasher.HashPassword(refreshToken);

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Token = refreshTokenHash,
            UserId = user.Id,
            ExpiresAt = now.AddDays(refreshTokenExpiryDays),
            IsRevoked = false,
            CreatedBy = user.Id,
            CreatedDate = now
        };

        await _refreshTokenRepository.AddAsync(refreshTokenEntity, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        var expiresInMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var minutes) ? minutes : 60;

        return new LoginResponseDto
        {
            Success = true,
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Username = user.UserName,
            FirstName = user.FirstName,
            MiddleName = user.MiddleName,
            LastName = user.LastName,
            Message = "Login successful",
            ExpiresAt = now.AddMinutes(expiresInMinutes),
            RequiresTwoFactorSetup = user.TwoFactorRequired && !user.TwoFactorEnabled
        };
    }

    public async Task<LoginV2ResponseDto> IssueV2Async(UserEntity user, string authenticationMethod, CancellationToken cancellationToken = default)
    {
        var baseResponse = await IssueAsync(user, authenticationMethod, cancellationToken);

        var roles = await _userAccessRepository.GetUserRolesAsync(user.Id, cancellationToken);
        var isAdmin = await _userAccessRepository.IsAdminAsync(user.Id, cancellationToken);
        var permissions = await _userAccessRepository.GetUserPermissionsAsync(user.Id, isAdmin, cancellationToken);
        var canAllocateWards = await _userAccessRepository.CanAllocateWardsAsync(user.Id, isAdmin, cancellationToken);

        return new LoginV2ResponseDto
        {
            Success = baseResponse.Success,
            Token = baseResponse.Token,
            RefreshToken = baseResponse.RefreshToken,
            UserId = baseResponse.UserId,
            UserCode = user.UserCode,
            Username = baseResponse.Username,
            FirstName = baseResponse.FirstName,
            MiddleName = baseResponse.MiddleName,
            LastName = baseResponse.LastName,
            Message = baseResponse.Message,
            ExpiresAt = baseResponse.ExpiresAt,
            RequiresTwoFactorSetup = baseResponse.RequiresTwoFactorSetup,
            Roles = roles,
            Permissions = permissions,
            IsAdmin = isAdmin,
            CanAllocateWards = canAllocateWards
        };
    }
}
