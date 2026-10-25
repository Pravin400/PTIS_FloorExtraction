using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master;

public class BillingPeriodDto : BaseDtos
{
    public string BillingPeriodCode { get; set; } = string.Empty;
    public int FinancialYearId { get; set; }
    public string? FinancialYearCode { get; set; }
    public string? FinancialYear { get; set; }
    public int BillingFrequencyId { get; set; }
    public string? BillingFrequencyCode { get; set; }
    public string? BillingFrequency { get; set; }
    public int SequenceNo { get; set; }
    public DateTime PeriodFromDate { get; set; }
    public DateTime PeriodToDate { get; set; }
    public DateTime? BillGenerationDate { get; set; }
    public DateTime? DueDate { get; set; }
    public int GraceDays { get; set; }
    public DateTime? CurrentPenaltyStartDate { get; set; }
    public DateTime? CurrentPenaltyEndDate { get; set; }
    public DateTime? PendingPenaltyStartDate { get; set; }
    public DateTime? PendingPenaltyEndDate { get; set; }
}

public class CreateBillingPeriodDto : CreateBaseDtos
{
    [Required]
    [MaxLength(30)]
    public string BillingPeriodCode { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "FinancialYearId must be greater than 0.")]
    public int FinancialYearId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "BillingFrequencyId must be greater than 0.")]
    public int BillingFrequencyId { get; set; }

    public int? SequenceNo { get; set; }

    [Required]
    public DateTime PeriodFromDate { get; set; }

    [Required]
    public DateTime PeriodToDate { get; set; }

    public DateTime? BillGenerationDate { get; set; }

    public DateTime? DueDate { get; set; }

    [Range(0, int.MaxValue)]
    public int GraceDays { get; set; }

    public DateTime? CurrentPenaltyStartDate { get; set; }

    public DateTime? CurrentPenaltyEndDate { get; set; }

    public DateTime? PendingPenaltyStartDate { get; set; }

    public DateTime? PendingPenaltyEndDate { get; set; }
}

public class UpdateBillingPeriodDto : UpdateBaseDtos
{
    [Required]
    [MaxLength(30)]
    public string BillingPeriodCode { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "FinancialYearId must be greater than 0.")]
    public int FinancialYearId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "BillingFrequencyId must be greater than 0.")]
    public int BillingFrequencyId { get; set; }

    public int? SequenceNo { get; set; }

    [Required]
    public DateTime PeriodFromDate { get; set; }

    [Required]
    public DateTime PeriodToDate { get; set; }

    public DateTime? BillGenerationDate { get; set; }

    public DateTime? DueDate { get; set; }

    [Range(0, int.MaxValue)]
    public int GraceDays { get; set; }

    public DateTime? CurrentPenaltyStartDate { get; set; }

    public DateTime? CurrentPenaltyEndDate { get; set; }

    public DateTime? PendingPenaltyStartDate { get; set; }

    public DateTime? PendingPenaltyEndDate { get; set; }
}

public class BillingPeriodQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? FinancialYearId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? BillingFrequencyId { get; set; }
}
