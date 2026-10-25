using System;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleDto
{
    public long PenaltyRuleId { get; set; }
    public int FinancialYearId { get; set; }
    public string? FinancialYearName { get; set; }
    public int? ConnectionCategoryId { get; set; }
    public string? ConnectionCategoryName { get; set; }
    public int? GeographyUnitId { get; set; }
    public string? GeographyName { get; set; }
    public int? ChargeHeadId { get; set; }
    public string? ChargeHeadName { get; set; }
    public string PenaltyType { get; set; } = string.Empty;
    public int? FromDay { get; set; }
    public int? ToDay { get; set; }
    public decimal? PercentageRate { get; set; }
    public decimal? FlatAmount { get; set; }
    public decimal? MaximumAmount { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsCurrentBill { get; set; }
    public bool IsPendingBill { get; set; }
    public bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public string? UpdatedByName { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
