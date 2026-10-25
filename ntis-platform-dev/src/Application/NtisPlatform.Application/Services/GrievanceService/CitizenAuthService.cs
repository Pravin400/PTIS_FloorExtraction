using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;
using NtisPlatform.Application.DTOs.Sms;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace NtisPlatform.Application.Services.GrievanceService;

/// <summary>
/// Service providing passwordless Mobile + OTP login, verification, lockout protection,
/// and citizen profile management for the Grievance Portal.
/// </summary>
public class CitizenAuthService : ICitizenAuthService
{
    private readonly IRepository<CitizenMasterEntity, int> _citizenRepository;
    private readonly IRepository<CitizenOtpLogEntity, int> _otpLogRepository;
    private readonly IRepository<GrievanceApplicationEntity, int> _applicationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly ISmsService _smsService;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<CitizenAuthService> _logger;

    private const int MaxFailedAttempts = 5;
    private const int MaxOtpVerificationAttempts = 3;
    private const int LockoutDurationMinutes = 15;
    private const int OtpExpiryMinutes = 10;
    private const int MaxOtpRequestsPerWindow = 5;
    private const int OtpRequestWindowMinutes = 15;
    private const int MinSecondsBetweenOtpRequests = 30;

    public CitizenAuthService(
        IRepository<CitizenMasterEntity, int> citizenRepository,
        IRepository<CitizenOtpLogEntity, int> otpLogRepository,
        IRepository<GrievanceApplicationEntity, int> applicationRepository,
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        ISmsService smsService,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<CitizenAuthService> logger)
    {
        _citizenRepository = citizenRepository;
        _otpLogRepository = otpLogRepository;
        _applicationRepository = applicationRepository;
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _smsService = smsService;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<SendCitizenOtpResponseDto> SendOtpAsync(
        SendCitizenOtpRequestDto request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var mobileNo = request.MobileNo.Trim();
        var purpose = string.IsNullOrWhiteSpace(request.Purpose) ? "LOGIN" : request.Purpose.Trim().ToUpperInvariant();
        var moduleCode = string.IsNullOrWhiteSpace(request.ModuleCode) ? "GRV" : request.ModuleCode.Trim().ToUpperInvariant();
        var referenceId = request.ReferenceId?.Trim();

        // 1. Check if Citizen exists and check lockout status
        var citizenQuery = _citizenRepository.GetQueryable();
        var citizen = citizenQuery.Provider is IAsyncQueryProvider
            ? await citizenQuery.FirstOrDefaultAsync(c => c.MobileNo == mobileNo && c.IsActive, cancellationToken)
            : citizenQuery.FirstOrDefault(c => c.MobileNo == mobileNo && c.IsActive);

        if (citizen != null && citizen.LockedUntilAt.HasValue && citizen.LockedUntilAt.Value > DateTime.Now)
        {
            var remaining = Math.Ceiling((citizen.LockedUntilAt.Value - DateTime.Now).TotalMinutes);
            throw new ValidationException(
                nameof(request.MobileNo),
                $"Account is temporarily locked due to multiple failed OTP attempts. Please try again after {remaining} minute(s).",
                OperationType.Create);
        }

        // 2. Challenge Quota & Throttling: Max 5 OTPs per 15-minute window for this mobile (mobile-wide SMS-abuse protection)
        var otpQuery = _otpLogRepository.GetQueryable();
        var windowThreshold = DateTime.Now.AddMinutes(-(OtpRequestWindowMinutes - OtpExpiryMinutes));
        var recentOtpsQuery = otpQuery.Where(o => o.MobileNo == mobileNo && o.ExpiresAt > windowThreshold);
        var recentOtps = recentOtpsQuery.Provider is IAsyncQueryProvider
            ? await recentOtpsQuery.OrderByDescending(o => o.Id).Take(MaxOtpRequestsPerWindow).ToListAsync(cancellationToken)
            : recentOtpsQuery.OrderByDescending(o => o.Id).Take(MaxOtpRequestsPerWindow).ToList();

        if (recentOtps.Count >= MaxOtpRequestsPerWindow)
        {
            var oldestRecentOtp = recentOtps.Last();
            var windowExpiry = oldestRecentOtp.ExpiresAt.AddMinutes(OtpRequestWindowMinutes - OtpExpiryMinutes);
            var remainingMinutes = (int)Math.Ceiling((windowExpiry - DateTime.Now).TotalMinutes);

            if (remainingMinutes > 0)
            {
                throw new ValidationException(
                    nameof(request.MobileNo),
                    $"Too many OTP requests. Please wait {remainingMinutes} minute(s) before requesting another OTP.",
                    OperationType.Create);
            }
        }

        // 3. Consecutive request cooldown (must wait 30 seconds between requests for this mobile)
        var lastOtp = otpQuery.Provider is IAsyncQueryProvider
            ? await otpQuery.OrderByDescending(o => o.Id).FirstOrDefaultAsync(o => o.MobileNo == mobileNo, cancellationToken)
            : otpQuery.OrderByDescending(o => o.Id).FirstOrDefault(o => o.MobileNo == mobileNo);

        if (lastOtp != null && lastOtp.ExpiresAt > DateTime.Now)
        {
            var secondsSinceIssued = (OtpExpiryMinutes * 60) - (int)(lastOtp.ExpiresAt - DateTime.Now).TotalSeconds;
            if (secondsSinceIssued >= 0 && secondsSinceIssued < MinSecondsBetweenOtpRequests)
            {
                var remainingWaitSeconds = MinSecondsBetweenOtpRequests - secondsSinceIssued;
                if (remainingWaitSeconds > 0 && remainingWaitSeconds <= MinSecondsBetweenOtpRequests)
                {
                    throw new ValidationException(
                        nameof(request.MobileNo),
                        $"Please wait {remainingWaitSeconds} second(s) before requesting another OTP.",
                        OperationType.Create);
                }
            }
        }

        // 4. Invalidate previous active unverified OTPs for this mobile and purpose
        var previousActiveOtps = otpQuery.Provider is IAsyncQueryProvider
            ? await otpQuery.Where(o => o.MobileNo == mobileNo && o.Purpose == purpose && o.IsActive && !o.IsUsed).ToListAsync(cancellationToken)
            : otpQuery.Where(o => o.MobileNo == mobileNo && o.Purpose == purpose && o.IsActive && !o.IsUsed).ToList();

        foreach (var oldOtp in previousActiveOtps)
        {
            oldOtp.IsActive = false;
            oldOtp.UpdatedDate = DateTime.Now;
            await _otpLogRepository.UpdateAsync(oldOtp, cancellationToken);
        }

        // 4. Generate a secure 6-digit numeric OTP
        var rawOtp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var otpHash = HashOtpWithRandomSalt(mobileNo, rawOtp);

        // 5. Deliver OTP via SMS Service
        try
        {
            await _smsService.SendSmsAsync(new SmsRequest
            {
                PhoneNumber = mobileNo,
                Message = $"Your NTIS Platform Grievance verification code is {rawOtp}. It expires in {OtpExpiryMinutes} minutes."
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deliver OTP SMS to mobile {MobileNo}", MaskMobile(mobileNo));
        }

        // 6. Create and save CitizenOtpLogEntity
        var otpLog = new CitizenOtpLogEntity
        {
            MobileNo = mobileNo,
            CitizenId = citizen?.Id,
            Purpose = purpose,
            ModuleCode = moduleCode,
            ReferenceId = referenceId,
            OtpHash = otpHash,
            ExpiresAt = DateTime.Now.AddMinutes(OtpExpiryMinutes),
            IsUsed = false,
            AttemptCount = 0,
            IpAddress = ipAddress,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        await _otpLogRepository.AddAsync(otpLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Issued OTP challenge ({Purpose}) for mobile {MobileNo} (CitizenId: {CitizenId})", purpose, MaskMobile(mobileNo), citizen?.Id);

        // 7. Build response (DebugOtp enabled for production & development until requested to remove)
        return new SendCitizenOtpResponseDto
        {
            Success = true,
            Message = "OTP has been sent to your registered mobile number.",
            MaskedMobileNo = MaskMobile(mobileNo),
            ExpiresInSeconds = OtpExpiryMinutes * 60,
            OtpExpiryMinutes = OtpExpiryMinutes,
            ResendInSeconds = MinSecondsBetweenOtpRequests,
            IsRegisteredCitizen = citizen != null,
            DebugOtp = rawOtp
        };
    }

    public async Task<CitizenAuthResponseDto> VerifyOtpAsync(
        VerifyCitizenOtpRequestDto request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var mobileNo = request.MobileNo.Trim();
        var inputOtp = request.Otp.Trim();
        var purpose = string.IsNullOrWhiteSpace(request.Purpose) ? "LOGIN" : request.Purpose.Trim().ToUpperInvariant();
        var moduleCode = string.IsNullOrWhiteSpace(request.ModuleCode) ? null : request.ModuleCode.Trim().ToUpperInvariant();
        var referenceId = string.IsNullOrWhiteSpace(request.ReferenceId) ? null : request.ReferenceId.Trim();

        // 1. Fetch Citizen (if registered)
        var citizenQuery = _citizenRepository.GetQueryable();
        var citizen = citizenQuery.Provider is IAsyncQueryProvider
            ? await citizenQuery.FirstOrDefaultAsync(c => c.MobileNo == mobileNo && c.IsActive, cancellationToken)
            : citizenQuery.FirstOrDefault(c => c.MobileNo == mobileNo && c.IsActive);

        // 2. Check Lockout
        if (citizen != null && citizen.LockedUntilAt.HasValue && citizen.LockedUntilAt.Value > DateTime.Now)
        {
            var remaining = Math.Ceiling((citizen.LockedUntilAt.Value - DateTime.Now).TotalMinutes);
            throw new ValidationException(
                nameof(request.MobileNo),
                $"Account is temporarily locked. Please try again after {remaining} minute(s).",
                OperationType.Create);
        }

        // 3. Find latest active, non-expired OTP challenge matching mobile, purpose, and optionally module/reference
        var now = DateTime.Now;
        var otpQuery = _otpLogRepository.GetQueryable()
            .Where(o => o.MobileNo == mobileNo && o.Purpose == purpose && o.IsActive && !o.IsUsed && o.ExpiresAt > now);

        if (moduleCode != null)
        {
            otpQuery = otpQuery.Where(o => o.ModuleCode == moduleCode);
        }

        if (referenceId != null)
        {
            otpQuery = otpQuery.Where(o => o.ReferenceId == referenceId);
        }

        var latestOtp = otpQuery.Provider is IAsyncQueryProvider
            ? await otpQuery.OrderByDescending(o => o.Id).FirstOrDefaultAsync(cancellationToken)
            : otpQuery.OrderByDescending(o => o.Id).FirstOrDefault();

        if (latestOtp == null)
        {
            throw new ValidationException(nameof(request.Otp), "OTP has expired or is invalid. Please request a new OTP.", OperationType.Create);
        }

        // 4. Verify Attempt Count Limit on this OTP challenge
        if (latestOtp.AttemptCount >= MaxOtpVerificationAttempts)
        {
            latestOtp.IsActive = false;
            latestOtp.UpdatedDate = DateTime.Now;
            await _otpLogRepository.UpdateAsync(latestOtp, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new ValidationException(nameof(request.Otp), "Maximum verification attempts exceeded. Please request a new OTP.", OperationType.Create);
        }

        // 5. Validate OTP Hash
        var isMatch = VerifyOtpHash(mobileNo, inputOtp, latestOtp.OtpHash);

        if (!isMatch)
        {
            latestOtp.AttemptCount++;
            latestOtp.UpdatedDate = DateTime.Now;
            await _otpLogRepository.UpdateAsync(latestOtp, cancellationToken);

            if (citizen != null)
            {
                citizen.FailedOtpCount++;
                if (citizen.FailedOtpCount >= MaxFailedAttempts)
                {
                    citizen.LockedUntilAt = DateTime.Now.AddMinutes(LockoutDurationMinutes);
                    _logger.LogWarning("Citizen {CitizenId} locked out due to {FailedAttempts} failed attempts.", citizen.Id, citizen.FailedOtpCount);
                }
                await _citizenRepository.UpdateAsync(citizen, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var remainingAttempts = MaxOtpVerificationAttempts - latestOtp.AttemptCount;
            var errorMsg = remainingAttempts > 0
                ? $"Invalid OTP. You have {remainingAttempts} attempt(s) remaining."
                : "Invalid OTP. Maximum attempts exceeded. Please request a new OTP.";

            throw new ValidationException(nameof(request.Otp), errorMsg, OperationType.Create);
        }

        // 6. OTP is Valid -> Atomically mark used and persist immediately to prevent concurrent replay race conditions
        latestOtp.IsUsed = true;
        latestOtp.UpdatedDate = DateTime.Now;
        await _otpLogRepository.UpdateAsync(latestOtp, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var isNewUser = false;
        if (citizen != null)
        {
            citizen.FailedOtpCount = 0;
            citizen.LockedUntilAt = null;
            citizen.IsVerified = true;
            citizen.LastLoginAt = DateTime.Now;

            if (!string.IsNullOrWhiteSpace(request.Name) && string.IsNullOrWhiteSpace(citizen.Name))
            {
                citizen.Name = request.Name.Trim();
            }

            await _citizenRepository.UpdateAsync(citizen, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Auto-register new citizen on first OTP verification (with race-condition safeguard)
            isNewUser = true;
            var defaultName = !string.IsNullOrWhiteSpace(request.Name)
                ? request.Name.Trim()
                : $"Citizen_{mobileNo[^Math.Min(4, mobileNo.Length)..]}";

            // Check again in case a concurrent request already created the citizen
            var existingCitizen = citizenQuery.Provider is IAsyncQueryProvider
                ? await citizenQuery.FirstOrDefaultAsync(c => c.MobileNo == mobileNo, cancellationToken)
                : citizenQuery.FirstOrDefault(c => c.MobileNo == mobileNo);

            if (existingCitizen != null)
            {
                citizen = existingCitizen;
                citizen.IsVerified = true;
                citizen.LastLoginAt = DateTime.Now;
                await _citizenRepository.UpdateAsync(citizen, cancellationToken);
            }
            else
            {
                citizen = new CitizenMasterEntity
                {
                    Name = defaultName,
                    MobileNo = mobileNo,
                    IsVerified = true,
                    IsActive = true,
                    FailedOtpCount = 0,
                    LastLoginAt = DateTime.Now,
                    CreatedDate = DateTime.Now
                };

                await _citizenRepository.AddAsync(citizen, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            latestOtp.CitizenId = citizen.Id;
            await _otpLogRepository.UpdateAsync(latestOtp, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // 7. Generate Citizen-scoped JWT Token (claims: Role=Citizen, scope=citizen-portal, user_type=citizen)
        var token = _tokenService.GenerateCitizenToken(citizen.Id, citizen.MobileNo, citizen.Name);
        var expiresInMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var minutes) ? minutes : 1440;

        _logger.LogInformation("Citizen authenticated successfully. (Id: {CitizenId}, Mobile: {MobileNo}, IsNew: {IsNew})",
            citizen.Id, MaskMobile(citizen.MobileNo), isNewUser);

        return new CitizenAuthResponseDto
        {
            Success = true,
            Message = isNewUser ? "Registration and login successful" : "Login successful",
            Token = token,
            RefreshToken = null, // Citizen authentication is OTP-based; refresh tokens are not stored in CORE.RefreshToken
            ExpiresAt = DateTime.Now.AddMinutes(expiresInMinutes),
            IsNewUser = isNewUser,
            CitizenId = citizen.Id,
            Name = citizen.Name,
            MobileNo = citizen.MobileNo,
            IsVerified = citizen.IsVerified,
            LastLoginAt = citizen.LastLoginAt
        };
    }

    public async Task<CitizenProfileDto?> GetProfileAsync(int citizenId, CancellationToken cancellationToken = default)
    {
        var citizen = await _citizenRepository.GetByIdAsync(citizenId, cancellationToken);
        if (citizen == null || !citizen.IsActive)
            return null;

        var appQuery = _applicationRepository.GetQueryable();
        var totalCount = appQuery.Provider is IAsyncQueryProvider
            ? await appQuery.CountAsync(a => a.CitizenId == citizenId && a.IsActive, cancellationToken)
            : appQuery.Count(a => a.CitizenId == citizenId && a.IsActive);

        var activeCount = appQuery.Provider is IAsyncQueryProvider
            ? await appQuery.CountAsync(a => a.CitizenId == citizenId && a.IsActive && a.ClosedDate == null, cancellationToken)
            : appQuery.Count(a => a.CitizenId == citizenId && a.IsActive && a.ClosedDate == null);

        return new CitizenProfileDto
        {
            Id = citizen.Id,
            Name = citizen.Name,
            MobileNo = citizen.MobileNo,
            IsVerified = citizen.IsVerified,
            LastLoginAt = citizen.LastLoginAt,
            CreatedDate = citizen.CreatedDate ?? DateTime.Now,
            TotalGrievancesCount = totalCount,
            ActiveGrievancesCount = activeCount
        };
    }

    public async Task<CitizenProfileDto?> UpdateProfileAsync(int citizenId, string name, CancellationToken cancellationToken = default)
    {
        var citizen = await _citizenRepository.GetByIdAsync(citizenId, cancellationToken);
        if (citizen == null || !citizen.IsActive)
            return null;

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException(nameof(name), "Name cannot be empty.", OperationType.Update);
        }

        citizen.Name = name.Trim();
        citizen.UpdatedDate = DateTime.Now;

        await _citizenRepository.UpdateAsync(citizen, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetProfileAsync(citizenId, cancellationToken);
    }

    private string GetOtpPepper()
    {
        return _configuration["Otp:Pepper"]
            ?? _configuration["Jwt:SecretKey"]
            ?? "ntis-citizen-otp-secure-pepper-key-2026";
    }

    private string HashOtpWithRandomSalt(string mobileNo, string otp)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var saltHex = Convert.ToHexString(saltBytes);
        var pepper = GetOtpPepper();
        var hash = ComputeOtpHash(mobileNo, otp, saltHex, pepper);
        return $"{saltHex}:{hash}";
    }

    private bool VerifyOtpHash(string mobileNo, string providedOtp, string storedOtpHash)
    {
        if (string.IsNullOrEmpty(storedOtpHash))
            return false;

        var pepper = GetOtpPepper();
        var parts = storedOtpHash.Split(':');
        if (parts.Length == 2)
        {
            var saltHex = parts[0];
            var expectedHash = parts[1];
            var actualHash = ComputeOtpHash(mobileNo, providedOtp, saltHex, pepper);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(actualHash),
                Encoding.UTF8.GetBytes(expectedHash));
        }

        // Backward-compatible fallback for legacy single-string hashes
        using var sha256 = SHA256.Create();
        var legacySalt = "ntis-citizen-otp-salt-v1";
        var legacyBytes = Encoding.UTF8.GetBytes($"{mobileNo}:{providedOtp}:{legacySalt}");
        var legacyHash = Convert.ToHexString(sha256.ComputeHash(legacyBytes));
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(legacyHash),
            Encoding.UTF8.GetBytes(storedOtpHash));
    }

    private static string ComputeOtpHash(string mobileNo, string otp, string saltHex, string pepper)
    {
        var key = Encoding.UTF8.GetBytes(pepper);
        using var hmac = new HMACSHA256(key);
        var payload = Encoding.UTF8.GetBytes($"{mobileNo}:{otp}:{saltHex}");
        return Convert.ToHexString(hmac.ComputeHash(payload));
    }

    private static string MaskMobile(string mobileNo)
    {
        if (string.IsNullOrEmpty(mobileNo) || mobileNo.Length < 4)
            return "****";

        var visible = mobileNo[^4..];
        var masked = new string('*', mobileNo.Length - 4);
        return $"{masked}{visible}";
    }
}
