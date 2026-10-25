using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master;

public class BillingFrequencyMasterDto : BaseDtos
{
    public string BillingFrequencyCode { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public int PeriodsPerYear { get; set; }
    public int? SequenceNo { get; set; }
    public string? Description { get; set; }
}

public class CreateBillingFrequencyMasterDto : CreateBaseDtos
{
    [Required]
    [MaxLength(30)]
    public string BillingFrequencyCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BillingFrequency { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue)]
    public int PeriodsPerYear { get; set; }

    public int? SequenceNo { get; set; }

    [MaxLength(300)]
    public string? Description { get; set; }
}

public class UpdateBillingFrequencyMasterDto : UpdateBaseDtos
{
    [Required]
    [MaxLength(30)]
    public string BillingFrequencyCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BillingFrequency { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue)]
    public int PeriodsPerYear { get; set; }

    public int? SequenceNo { get; set; }

    [MaxLength(300)]
    public string? Description { get; set; }
}

public class BillingFrequencyMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }
}
