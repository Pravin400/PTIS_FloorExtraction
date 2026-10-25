using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master.WaterBill;

public class TariffMasterDto : BaseDtos
{
    public new long Id { get; set; }
    public string TariffCode { get; set; } = string.Empty;
    public string TariffName { get; set; } = string.Empty;
    public int FinancialYearId { get; set; }
    public string? FinancialYear { get; set; }
    public int ConnectionTypeId { get; set; }
    public string? ConnectionTypeName { get; set; }
    public string? ConnectionTypeCode { get; set; }
    public int ConnectionCategoryId { get; set; }
    public string? ConnectionCategoryName { get; set; }
    public string? ConnectionCategoryCode { get; set; }
    public int TapSizeId { get; set; }
    public string? TapSizeName { get; set; }
    public string? TapSizeCode { get; set; }
    public string? YearCode { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? Description { get; set; }
    public int SlabsCount { get; set; } = 0;
    public new bool IsActive { get; set; }
}

public class CreateTariffMasterDto : CreateBaseDtos
{
    [Required]
    public int FinancialYearId { get; set; }

    [Required]
    public int ConnectionTypeId { get; set; }

    [Required]
    public int ConnectionCategoryId { get; set; }

    [Required]
    public int TapSizeId { get; set; }

    [Required]
    [MaxLength(60)]
    [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Tariff Code can only contain uppercase alphanumeric characters, hyphen (-), and underscore (_).")]
    public string TariffCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string TariffName { get; set; } = string.Empty;

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public new bool IsActive { get; set; } = true;
}

public class UpdateTariffMasterDto : UpdateBaseDtos
{
    [Required]
    public int FinancialYearId { get; set; }
   
    [Required]
    public int ConnectionTypeId { get; set; }

    [Required]
    public int ConnectionCategoryId { get; set; }

    [Required]
    public int TapSizeId { get; set; }

    [Required]
    [MaxLength(60)]
    [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Tariff Code can only contain uppercase alphanumeric characters, hyphen (-), and underscore (_).")]
    public string TariffCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string TariffName { get; set; } = string.Empty;

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public new bool IsActive { get; set; }
}

public class TariffMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public long? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? FinancialYearId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? FinancialYear { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ConnectionTypeId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ConnectionTypeCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ConnectionTypeName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ConnectionCategoryId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ConnectionCategoryCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ConnectionCategoryName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? TapSizeId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? TapSizeCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? TapSizeName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TariffCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TariffName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public DateTime? EffectiveFrom { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public DateTime? EffectiveTo { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? Description { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
