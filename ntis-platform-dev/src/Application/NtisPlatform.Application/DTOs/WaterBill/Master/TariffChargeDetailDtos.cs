using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master;

public class TariffChargeDetailDto : BaseDtos
{
    public new long Id { get; set; }
    public long TariffId { get; set; }
    public string? TariffName { get; set; }
    public int ChargeHeadId { get; set; }
    public string? ChargeHeadName { get; set; }
    public int? GeographyUnitId { get; set; }
    public string? GeographyUnitName { get; set; }
    public decimal Amount { get; set; }
    public bool IsDynamic { get; set; }
    public bool IsMandatory { get; set; }
    public int SequenceNo { get; set; }
    public new bool IsActive { get; set; }
}

public class CreateTariffChargeDetailDto : CreateBaseDtos
{
    [Required]
    public long TariffId { get; set; }
    
    [Required]
    public int ChargeHeadId { get; set; }
    
    public int? GeographyUnitId { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Amount must be greater than or equal to 0.")]
    public decimal Amount { get; set; } = 0;
    
    public bool IsDynamic { get; set; } = false;
    
    public bool IsMandatory { get; set; } = true;
    
    [Range(0, int.MaxValue, ErrorMessage = "SequenceNo must be greater than or equal to 0.")]
    public int? SequenceNo { get; set; }
    
    public new bool IsActive { get; set; } = true;
}

public class UpdateTariffChargeDetailDto : UpdateBaseDtos
{
    [Required]
    public long TariffId { get; set; }
    
    [Required]
    public int ChargeHeadId { get; set; }
    
    public int? GeographyUnitId { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Amount must be greater than or equal to 0.")]
    public decimal Amount { get; set; }
    
    public bool IsDynamic { get; set; }
    
    public bool IsMandatory { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "SequenceNo must be greater than 0.")]
    public int SequenceNo { get; set; }
    
    public new bool IsActive { get; set; }
}

public class TariffChargeDetailQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public long? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public long? TariffId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ChargeHeadId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? GeographyUnitId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
