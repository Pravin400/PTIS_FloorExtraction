using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.PropertyTaxOperations;

/// <summary>Request to compute how many properties a scope yields (total + eligible).</summary>
public class EligibleCountRequestDto
{
    [Required(ErrorMessage = "FinanceYearId_Required")]
    public int FinanceYearId { get; set; }

    [Required(ErrorMessage = "ScopeType_Required")]
    public string ScopeType { get; set; } = string.Empty;

    public OperationScopeDto Scope { get; set; } = new();

    [Required(ErrorMessage = "Operation_Required")]
    public string Operation { get; set; } = string.Empty;
}

public class EligibleCountResponseDto
{
    public int Eligible { get; set; }
    public int Total { get; set; }
    public int Skipped { get; set; }

    /// <summary>Properties already taxed for the selected finance year (excluded from both Eligible and Skipped).</summary>
    public int AlreadyTaxed { get; set; }

    /// <summary>Distinct reasons the Skipped properties were excluded, with a per-reason count.</summary>
    public List<SkipReasonSummaryDto> SkipReasons { get; set; } = new();
}

public class SkipReasonSummaryDto
{
    public string Code { get; set; } = string.Empty;
    public int Count { get; set; }
}

/// <summary>Request for a bounded preview of the records a scope would process.</summary>
public class OperationPreviewRequestDto : BaseQueryParameters
{
    [Required(ErrorMessage = "FinanceYearId_Required")]
    public int FinanceYearId { get; set; }

    [Required(ErrorMessage = "ScopeType_Required")]
    public string ScopeType { get; set; } = string.Empty;

    public OperationScopeDto Scope { get; set; } = new();

    [Required(ErrorMessage = "Operation_Required")]
    public string Operation { get; set; } = string.Empty;
}

public class PropertyTypeBreakdownDto
{
    public int PropertyTypeId { get; set; }
    public int Count { get; set; }
}

public class OperationPreviewResponseDto
{
    public int TotalSelected { get; set; }
    public int Eligible { get; set; }
    public int Skipped { get; set; }

    /// <summary>Properties already taxed for the selected finance year (excluded from both Eligible and Skipped).</summary>
    public int AlreadyTaxed { get; set; }
    public int RequiresApproval { get; set; }
    public List<JobPropertyPreviewDto> Records { get; set; } = new();
    public List<SkippedReasonDto> SkippedReasons { get; set; } = new();
    public List<PropertyTypeBreakdownDto> EligibleBreakdown { get; set; } = new();
}

public class JobPropertyPreviewDto
{
    public int PropertyId { get; set; }
    public string Zone { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string PropertyNo { get; set; } = string.Empty;
    public string PartitionNo { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public int? PropertyTypeId { get; set; }
    public bool IsEligible { get; set; }

    /// <summary>Localization key / message; null when eligible.</summary>
    public string? SkipReason { get; set; }

    /// <summary>Machine-readable code, e.g. "AlreadyProcessed", "PropertyLocked", "RateNotFound", "TaxPercentageMissing", "DetailsMissing".</summary>
    public string? SkipReasonCode { get; set; }

    /// <summary>Keys for missing detail fields when SkipReasonCode is "DetailsMissing".</summary>
    public List<string> MissingFieldKeys { get; set; } = new();
}

public class ImportTemplateColumnDto
{
    public string Key { get; set; } = string.Empty;
    public string Header { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool Required { get; set; }
}

public class ScopeCategoryOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ScopeType { get; set; } = string.Empty;
    public List<string> RequiredColumns { get; set; } = new();
}

public class ImportTemplateDto
{
    public List<ImportTemplateColumnDto> Columns { get; set; } = new();
    public List<ScopeCategoryOptionDto> ScopeCategories { get; set; } = new();
}

