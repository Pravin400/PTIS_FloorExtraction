using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// HYBRID strategy configuration (PTIS.TaxHybridConfig), one row per HYBRID tax.
/// Combines the master mapping (PTIS.TaxMasterMapping) with a condition rule fallback;
/// this entity only persists the evaluation strategy — the mapping and rule live in their
/// own tables. Wired into the live RV calculation pipeline by
/// NtisPlatform.Application.Services.TaxEngine.DynamicTax.DynamicTaxAmountResolver.ResolveHybrid.
/// </summary>
[Table("TaxHybridConfig", Schema = "PTIS")]
public class TaxHybridConfigEntity : BaseEntity
{
    /// <summary>FK → PTIS.TaxMaster (unique — one config per tax).</summary>
    [Required]
    public int TaxId { get; set; }

    /// <summary>MASTER_THEN_CONDITION | CONDITION_THEN_MASTER.</summary>
    [Required]
    [Column(TypeName = "nvarchar(30)")]
    public string EvaluationPriority { get; set; } = "MASTER_THEN_CONDITION";

    /// <summary>DEFAULT_ZERO | CONDITION_RULE.</summary>
    [Required]
    [Column(TypeName = "nvarchar(20)")]
    public string FallbackStrategy { get; set; } = "DEFAULT_ZERO";

    /// <summary>NONE | RV | ALV. RV/ALV overrides whichever base the winning strategy's own row
    /// (a TaxMasterMapping or TaxConditionRule) carries for a PERCENT result — the register displays
    /// this combined with the master rule's source as a single "Source/Basis" pair for the tax (e.g.
    /// "PropertyType + RV"), so it must actually drive the amount rather than being read for display
    /// only. Never applies to an OTHER_TAX-based row, which has no RV/ALV base to override. See
    /// DynamicTaxAmountResolver.ResolveHybrid.</summary>
    [Required]
    [Column(TypeName = "nvarchar(10)")]
    public string ResultBase { get; set; } = "NONE";

    // ── Navigation ──────────────────────────────────────────────────────────────
    public TaxMasterEntity? Tax { get; set; }
}
