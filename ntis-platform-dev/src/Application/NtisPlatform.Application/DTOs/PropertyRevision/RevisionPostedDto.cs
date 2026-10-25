using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Response of <c>POST api/property-revisions/{revisionId}/post</c>. On success
/// <see cref="RevisionStatus"/> is always <c>POSTED</c> and the revision is now immutable and
/// IsCurrent for its property + finance year.
/// </summary>
public class RevisionPostedDto
{
    public long RevisionId { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public RevisionCalculationScope CalculationScope { get; set; }
    public RevisionCalculationType CalculationType { get; set; }
    public RevisionStatus RevisionStatus { get; set; }
}
