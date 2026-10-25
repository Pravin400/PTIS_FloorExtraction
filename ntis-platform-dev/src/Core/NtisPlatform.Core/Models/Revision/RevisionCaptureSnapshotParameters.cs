namespace NtisPlatform.Core.Models.Revision;

/// <summary>
/// Input to <c>PTIS.usp_Revision_CaptureSnapshot</c>
/// (<see cref="Interfaces.IRevisionRepository.CaptureSnapshotAsync"/>). Write-once per
/// (RevisionMastId, RevisionPeriodId): the SP throws error 51007 "Snapshot already exists for
/// this revision/period" on a second call for the same pair.
/// </summary>
public class RevisionCaptureSnapshotParameters
{
    public long RevisionMastId { get; set; }

    /// <summary>Null for HISTORY_ONLY; required for PERIOD_WISE (the NEW period being captured).</summary>
    public long? RevisionPeriodId { get; set; }

    public int? CreatedBy { get; set; }

    /// <summary>Defaults to "DAY_WISE" - the only proration method the SP currently supports.</summary>
    public string ProrationMethod { get; set; } = "DAY_WISE";
}
