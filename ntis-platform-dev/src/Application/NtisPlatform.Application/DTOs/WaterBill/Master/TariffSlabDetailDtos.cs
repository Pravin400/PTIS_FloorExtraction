using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master;

public class TariffSlabDetailDto : BaseDtos
{
    public new long Id { get; set; }
    public long TariffId { get; set; }
    public string? TariffName { get; set; }
    public int? GeographyUnitId { get; set; }
    public string? GeographyUnitName { get; set; }
    public decimal? FromUnit { get; set; }
    public decimal? ToUnit { get; set; }
    public decimal? UnitRate { get; set; }
    public decimal FixedCharge { get; set; }
    public decimal MinimumCharge { get; set; }
    public decimal? MaximumCharge { get; set; }
    public decimal? PerConnectionAmount { get; set; }
    public string? FormulaCode { get; set; }
    public int SortOrder { get; set; }
    public new bool IsActive { get; set; }
}

public class CreateTariffSlabDetailDto : CreateBaseDtos
{
    [Required]
    public long TariffId { get; set; }
    public int? GeographyUnitId { get; set; }
    public decimal? FromUnit { get; set; }
    public decimal? ToUnit { get; set; }
    public decimal? UnitRate { get; set; }
    public decimal FixedCharge { get; set; } = 0;
    public decimal MinimumCharge { get; set; } = 0;
    public decimal? MaximumCharge { get; set; }
    public decimal? PerConnectionAmount { get; set; }
    
    [MaxLength(50)]
    public string? FormulaCode { get; set; }
    
    public int SortOrder { get; set; } = 1;
    public new bool IsActive { get; set; } = true;
}

public class UpdateTariffSlabDetailDto : UpdateBaseDtos
{
    [Required]
    public long TariffId { get; set; }
    public int? GeographyUnitId { get; set; }
    public decimal? FromUnit { get; set; }
    public decimal? ToUnit { get; set; }
    public decimal? UnitRate { get; set; }
    public decimal FixedCharge { get; set; }
    public decimal MinimumCharge { get; set; }
    public decimal? MaximumCharge { get; set; }
    public decimal? PerConnectionAmount { get; set; }
    
    [MaxLength(50)]
    public string? FormulaCode { get; set; }
    
    public int SortOrder { get; set; }
    public new bool IsActive { get; set; }
}

public class TariffSlabDetailQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public long? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public long? TariffId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? GeographyUnitId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
