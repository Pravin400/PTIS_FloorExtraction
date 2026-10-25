namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Stores citizen identity for citizen-facing portals & apps across all modules.
/// Citizens are identified by their mobile number (unique).
/// Authentication is OTP-based — no password stored here.
/// Maps [CORE].[CitizenMaster].
/// </summary>
public class CitizenMasterEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;
    public int FailedOtpCount { get; set; } = 0;
    public DateTime? LockedUntilAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public virtual ICollection<CitizenOtpLogEntity> OtpLogs { get; set; } = new List<CitizenOtpLogEntity>();
}
