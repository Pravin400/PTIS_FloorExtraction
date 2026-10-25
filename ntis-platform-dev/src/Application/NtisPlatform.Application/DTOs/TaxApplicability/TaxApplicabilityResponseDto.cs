using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.TaxApplicability;

/// <summary>
/// Detail DTO representing individual tax item status and values
/// </summary>
public class TaxApplicabilityDetailDto
{
    public int TaxId { get; set; }
    public string TaxHead { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string? CalculationType { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal TaxAmount { get; set; }
    public bool IsApplicable { get; set; }
    public bool IsActive { get; set; }
    public bool AssessmentStatus { get; set; }
}

/// <summary>
/// DTO representing tax percentage breakdown for a specific Type of Use
/// </summary>
public class TypeOfUseTaxPercentageDto
{
    /// <summary>
    /// Unique identifier for the Type of Use master entry
    /// </summary>
    public int TypeOfUseId { get; set; }

    /// <summary>
    /// Human-readable description of the Type of Use (e.g., दुकान, अनिवासी, खुला भूखंड अनिवासी)
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Property usage category type code (e.g., C for Commercial, R for Residential)
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Applicable tax rate percentage for this specific Type of Use
    /// </summary>
    public decimal TaxPercentage { get; set; }

    /// <summary>
    /// Base value type used for calculation (e.g., ALV, RV, or null)
    /// </summary>
    public string? BaseType { get; set; }
}

/// <summary>
/// DTO representing slab parameters for slab-based taxes (Education Tax, Employment Tax)
/// </summary>
public class SlabDetailDto
{
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public decimal Rate { get; set; }
    public string? Type { get; set; }
    public string? BaseType { get; set; }
}

/// <summary>
/// Response DTO for Tax Applicability Calculation summary based on Rateable Value and Special Tax Percentages
/// </summary>
public class TaxApplicabilityCalculationDto
{
    /// <summary>
    /// Unique identifier for the Tax Master record
    /// </summary>
    public int TaxId { get; set; }

    /// <summary>
    /// Display name of the tax head (e.g., General Tax, Tree Cess)
    /// </summary>
    public string? TaxName { get; set; }

    /// <summary>
    /// Calculation mode identifier (1 = Value Based, 2 = Condition Based, 3 = Master Based)
    /// </summary>
    public int? CalculationModeId { get; set; }

    /// <summary>
    /// Calculation mode classification string
    /// </summary>
    public string? CalculationMode { get; set; }

    /// <summary>
    /// Rule definition ID if linked to custom tax calculation rules
    /// </summary>
    public int? RuleDefinitionId { get; set; }

    /// <summary>
    /// Comma-separated list of applicable TypeOfUse IDs
    /// </summary>
    public string? TypeOfUseIds { get; set; }

    /// <summary>
    /// Comma-separated list of TypeOfUse descriptions
    /// </summary>
    public string? Descriptions { get; set; }

    /// <summary>
    /// Comma-separated list of usage types (R, C, etc.)
    /// </summary>
    public string? Types { get; set; }

    /// <summary>
    /// Comma-separated list of base types (ALV, RV)
    /// </summary>
    public string? BaseTypes { get; set; }

    /// <summary>
    /// Average tax percentage rate across all active usage types rounded to 2 decimal places
    /// </summary>
    public decimal? AverageTaxPercentage { get; set; }

    /// <summary>
    /// Breakdown array of tax percentage per Type of Use
    /// </summary>
    public List<TypeOfUseTaxPercentageDto> TypeOfUseTaxPercentages { get; set; } = new();

    /// <summary>
    /// Breakdown array of matched slab rules for slab-based taxes (Education/Employment Tax)
    /// </summary>
    public List<SlabDetailDto>? SlabDetails { get; set; }

    /// <summary>
    /// Condition-based or Master-based result modes
    /// </summary>
    public string? ResultModes { get; set; }

    /// <summary>
    /// Condition-based or Master-based result bases
    /// </summary>
    public string? ResultBases { get; set; }

    /// <summary>
    /// Condition-based or Master-based result values
    /// </summary>
    public string? ResultValues { get; set; }

    /// <summary>
    /// Custom mapping metadata JSON string if applicable
    /// </summary>
    public string? MappingData { get; set; }

    /// <summary>
    /// Calculated tax amount in currency
    /// </summary>
    public decimal? TaxAmount { get; set; }

    /// <summary>
    /// Indicates whether the tax is applicable to the property (false if exempted in ptis.applytaxmaster)
    /// </summary>
    public bool IsApplicable { get; set; }

    /// <summary>
    /// Status indicating if the tax head is active in Tax Master
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Assessment status flag
    /// </summary>
    public bool AssessmentStatus { get; set; }
}

/// <summary>
/// Header summary DTO representing aggregated property metrics
/// </summary>
public class TaxApplicabilityHeaderSummaryDto
{
    public decimal TotalTax { get; set; }
    public decimal ResidentialRV { get; set; }
    public decimal CommercialRV { get; set; }
    public double Area { get; set; }
    public int Toilets { get; set; }
}

/// <summary>
/// Combined response DTO for calculation endpoint containing property metrics, counts, summary cards, and tax calculation items
/// </summary>
public class TaxApplicabilityCalculationResponseDto
{
    public int PropertyId { get; set; }
    public int AssessmentYearRangeId { get; set; }
    public int TypeOfUseId { get; set; }
    public int ApplicableCount { get; set; }
    public int ExemptedCount { get; set; }

    /// <summary>
    /// Property summary metrics header (Total Tax, Residential RV, Commercial RV, Area, Toilets)
    /// </summary>
    public TaxApplicabilityHeaderSummaryDto Summary { get; set; } = new();

    public List<TaxApplicabilityCalculationDto> TaxCalculations { get; set; } = new();
}

/// <summary>
/// Main response container DTO for tax applicability operations
/// </summary>
public class TaxApplicabilityResponseDto
{
    public int PropertyId { get; set; }
    public int AssessmentYearRangeId { get; set; }
    public int TypeOfUseId { get; set; }
    public int ApplicableCount { get; set; }
    public int ExemptedCount { get; set; }

    /// <summary>
    /// Property summary metrics header (Total Tax, Residential RV, Commercial RV, Area, Toilets)
    /// </summary>
    public TaxApplicabilityHeaderSummaryDto Summary { get; set; } = new();

    public List<TaxApplicabilityDetailDto> ApplicableTaxes { get; set; } = new();
    public List<TaxApplicabilityDetailDto> ExemptedTaxes { get; set; } = new();
    public List<TaxApplicabilityCalculationDto> TaxCalculations { get; set; } = new();
}
