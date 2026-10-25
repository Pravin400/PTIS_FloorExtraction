using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Core.Entities.WaterBill.Master;

[Table("WaterPenaltyRuleMaster", Schema = "WTIS")]
public class WaterPenaltyRuleMasterEntity
{
    [Key]
    public long PenaltyRuleId { get; set; }

    public int FinancialYearId { get; set; }

    public int? ConnectionCategoryId { get; set; }

    public int? GeographyUnitId { get; set; }

    public int? ChargeHeadId { get; set; }

    [Required]
    [MaxLength(30)]
    public string PenaltyType { get; set; } = string.Empty;

    public int? FromDay { get; set; }

    public int? ToDay { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? PercentageRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? FlatAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaximumAmount { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public bool IsCurrentBill { get; set; }

    public bool IsPendingBill { get; set; }

    public bool IsActive { get; set; } = true;

    public int? CreatedBy { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public int? UpdatedBy { get; set; }

    public DateTime? UpdatedDate { get; set; }

    [ForeignKey(nameof(FinancialYearId))]
    public virtual YearMasterEntity? FinancialYear { get; set; }

    [ForeignKey(nameof(ConnectionCategoryId))]
    public virtual ConnectionCategoryMasterEntity? ConnectionCategory { get; set; }

    [ForeignKey(nameof(GeographyUnitId))]
    public virtual GeographyUnitEntity? GeographyUnit { get; set; }

    [ForeignKey(nameof(ChargeHeadId))]
    public virtual ChargeHeadMasterEntity? ChargeHead { get; set; }
}
