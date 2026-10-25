using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Row in the paged history returned by <c>GET /api/properties/{propertyId}/revisions</c>.
/// </summary>
public class PropertyRevisionSummaryDto : LongBaseDto
{
    public long RevisionId { get; set; }
    public int PropertyId { get; set; }
    public int RevisionNo { get; set; }
    public int FinanceYearId { get; set; }
    public string FinanceYear { get; set; } = string.Empty;
    public RevisionCalculationType CalculationType { get; set; }
    public RevisionCalculationScope CalculationScope { get; set; }
    public string RevisionType { get; set; } = string.Empty;
    public string? RevisionReason { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public RevisionStatus RevisionStatus { get; set; }
    public bool IsCurrent { get; set; }
}

