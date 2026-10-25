using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services;

/// <inheritdoc cref="ICurrentUserService"/>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.IsInRole("Citizen") == true || user?.FindFirst("userType")?.Value == "Citizen")
        {
            throw new UnauthorizedAccessException("Citizen accounts cannot access staff services.");
        }

        var claim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user?.FindFirst(ClaimTypes.Name)?.Value
                 ?? user?.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
        {
            throw new UnauthorizedAccessException("Valid user identification is required.");
        }

        return id;
    }
}

public sealed class CurrentTenantService(
    IHttpContextAccessor httpContextAccessor) : ICurrentTenantService
{
    public int? TryGetCurrentTenantId()
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user?.IsInRole("Citizen") == true || user?.FindFirst("userType")?.Value == "Citizen")
        {
            return null;
        }

        var raw = user?.FindFirst("organizationId")?.Value
            ?? user?.FindFirst("organization_id")?.Value
            ?? user?.FindFirst("tenantId")?.Value
            ?? user?.FindFirst("tenant_id")?.Value;

        return (int.TryParse(raw, out var claimTenantId) && claimTenantId > 0)
            ? claimTenantId
            : null;
    }

    public int GetCurrentTenantId()
    {
        return TryGetCurrentTenantId() ?? throw new UnauthorizedAccessException(
            "The authenticated session does not contain a valid tenant claim. Sign in again.");
    }
}
