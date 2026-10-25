namespace NtisPlatform.Core.Models.Revision;

/// <summary>
/// Output of <c>PTIS.usp_Revision_Begin</c>. <see cref="OldPeriodId"/>/<see cref="NewPeriodId"/>
/// are populated only for a PERIOD_WISE revision (revision_api_rules.txt section 16 example
/// response); both are null for HISTORY_ONLY.
/// </summary>
public class RevisionBeginResult
{
    public long RevisionId { get; set; }
    public int RevisionNo { get; set; }
    public long? OldPeriodId { get; set; }
    public long? NewPeriodId { get; set; }
}
