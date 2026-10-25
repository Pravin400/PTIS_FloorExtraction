using System;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleQueryParameters : BaseQueryParameters
{
    public int? FinancialYearId { get; set; }
    public int? ConnectionCategoryId { get; set; }
    public int? GeographyUnitId { get; set; }
    public int? ChargeHeadId { get; set; }
    public string? PenaltyType { get; set; }
    public bool? IsCurrentBill { get; set; }
    public bool? IsPendingBill { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? EffectiveDate { get; set; }
}
