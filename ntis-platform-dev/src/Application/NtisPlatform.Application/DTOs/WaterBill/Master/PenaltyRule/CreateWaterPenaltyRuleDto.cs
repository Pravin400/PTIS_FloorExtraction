using System;
using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;

public class CreateWaterPenaltyRuleDto
{
    [Required(ErrorMessage = "FinancialYearId is required.")]
    public int FinancialYearId { get; set; }

    public int? ConnectionCategoryId { get; set; }
    public int? GeographyUnitId { get; set; }
    public int? ChargeHeadId { get; set; }

    [Required(ErrorMessage = "PenaltyType is required.")]
    [MaxLength(30)]
    public string PenaltyType { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "FromDay cannot be negative.")]
    public int? FromDay { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "ToDay cannot be negative.")]
    public int? ToDay { get; set; }

    [Range(0.01, 100.0, ErrorMessage = "PercentageRate must be between 0.01 and 100.")]
    public decimal? PercentageRate { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "FlatAmount must be greater than 0.")]
    public decimal? FlatAmount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "MaximumAmount cannot be negative.")]
    public decimal? MaximumAmount { get; set; }

    [Required(ErrorMessage = "EffectiveFrom is required.")]
    public DateTime? EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public bool IsCurrentBill { get; set; }
    public bool IsPendingBill { get; set; }
    public bool IsActive { get; set; } = true;
    public int? CreatedBy { get; set; }
}
