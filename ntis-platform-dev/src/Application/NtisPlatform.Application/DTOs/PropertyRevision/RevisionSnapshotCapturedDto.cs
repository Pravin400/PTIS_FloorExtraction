using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>Response of <c>POST api/property-revisions/{revisionId}/capture-snapshot</c>.</summary>
public class RevisionSnapshotCapturedDto
{
    public long RevisionId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int PropertyId { get; set; }
    public RevisionCalculationScope CalculationScope { get; set; }
    public RevisionCalculationType CalculationType { get; set; }
    public int? PeriodDays { get; set; }
    public int? YearDays { get; set; }
    public decimal? ProrationFactor { get; set; }
}
