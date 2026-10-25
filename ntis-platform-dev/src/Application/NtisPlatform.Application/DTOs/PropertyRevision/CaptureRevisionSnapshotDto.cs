namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Request body for <c>POST api/property-revisions/{revisionId}/capture-snapshot</c>.
///
/// Call this AFTER editing the live PropertyMast/PropertyDetails through the normal property API
/// and re-running RV/CV calculation with forceRecalculate=true - this endpoint copies that
/// (now-updated) live state into the revision snapshot tables via
/// <c>PTIS.usp_Revision_CaptureSnapshot</c>. It is write-once per revision/period: calling it a
/// second time for the same pair fails with a conflict.
/// </summary>
public class CaptureRevisionSnapshotDto
{
    /// <summary>
    /// Required for a PERIOD_WISE revision (the NEW period being captured); when omitted for a
    /// PERIOD_WISE revision the latest period on the revision is used automatically. Must be
    /// omitted for a HISTORY_ONLY revision.
    /// </summary>
    public long? RevisionPeriodId { get; set; }

    /// <summary>Defaults to "DAY_WISE" - the only proration method currently supported by the SP.</summary>
    public string? ProrationMethod { get; set; }
}
