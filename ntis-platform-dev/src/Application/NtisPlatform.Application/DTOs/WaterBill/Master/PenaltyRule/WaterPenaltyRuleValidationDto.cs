using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleValidationRequestDto
{
    public long? PenaltyRuleId { get; set; }

    [Required]
    public int FinancialYearId { get; set; }

    public int? ConnectionCategoryId { get; set; }
    public int? GeographyUnitId { get; set; }
    public int? ChargeHeadId { get; set; }

    [Required]
    public string PenaltyType { get; set; } = string.Empty;

    public int? FromDay { get; set; }
    public int? ToDay { get; set; }
    public decimal? PercentageRate { get; set; }
    public decimal? FlatAmount { get; set; }
    public decimal? MaximumAmount { get; set; }

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }
    public bool IsCurrentBill { get; set; }
    public bool IsPendingBill { get; set; }
}

public class WaterPenaltyRuleValidationResultDto
{
    public bool IsValid => Errors.Count == 0 && Conflicts.Count == 0;
    public bool HasConflict => Conflicts.Count > 0;

    public List<string> Errors { get; set; } = new();
    public List<string> Conflicts { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
