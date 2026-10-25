using System.ComponentModel.DataAnnotations;
using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Request body for <c>POST /api/properties/{propertyId}/revisions</c>
/// (revision_api_rules.txt section 16).
/// </summary>
public class CreatePropertyRevisionDto : CreateBaseDtos
{
    [Required]
    public int FinanceYearId { get; set; }

    [Required]
    [EnumDataType(typeof(RevisionCalculationType))]
    public RevisionCalculationType CalculationType { get; set; }

    [Required]
    [EnumDataType(typeof(RevisionCalculationScope))]
    public RevisionCalculationScope CalculationScope { get; set; }

    [Required]
    [StringLength(30)]
    public string RevisionType { get; set; } = string.Empty;

    /// <summary>Required when <see cref="CalculationScope"/> is PERIOD_WISE; must be omitted/null for HISTORY_ONLY.</summary>
    public DateTime? EffectiveDate { get; set; }

    [StringLength(1000)]
    public string? RevisionReason { get; set; }
}
