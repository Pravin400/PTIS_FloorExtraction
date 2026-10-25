using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Response of <c>POST /api/properties/{propertyId}/revisions</c>
/// (revision_api_rules.txt section 16). <see cref="OldPeriodId"/>/<see cref="NewPeriodId"/> are
/// only populated for PERIOD_WISE revisions.
/// </summary>
public class PropertyRevisionCreatedDto
{
    public long RevisionId { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public int RevisionNo { get; set; }
    public RevisionCalculationType CalculationType { get; set; }
    public RevisionCalculationScope CalculationScope { get; set; }
    public RevisionStatus RevisionStatus { get; set; }
    public long? OldPeriodId { get; set; }
    public long? NewPeriodId { get; set; }
}
