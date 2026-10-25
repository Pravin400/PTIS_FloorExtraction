using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Tracks each OTP challenge issued to a mobile number for citizen login or transaction authorization.
/// OTP is never stored in plain text — only the hash.
/// Maps [CORE].[CitizenOtpLog].
/// </summary>
public class CitizenOtpLogEntity : BaseEntity
{
    public string MobileNo { get; set; } = string.Empty;
    public int? CitizenId { get; set; }
    public string Purpose { get; set; } = "LOGIN";
    public string? ModuleCode { get; set; }
    public string? ReferenceId { get; set; }
    public string OtpHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public int AttemptCount { get; set; } = 0;
    public string? IpAddress { get; set; }

    public virtual CitizenMasterEntity? Citizen { get; set; }
}
