namespace NtisPlatform.Application.DTOs.Section129;

/// <summary>
/// Header + year-wise schedule for the Section 129A single-assessment screen. One call
/// returns everything the screen needs once a property is picked (header fields, case-level
/// facts, and the schedule table rows — persisted years plus a computed-not-persisted
/// preview for any remaining years up to the current finance year).
/// </summary>
public class Section129ScheduleDto
{
    public int PropertyId { get; set; }

    /// <summary>
    /// The property's ward id (PTIS.WardMaster.Id) — lets the caller pre-select the Ward/Property No
    /// dropdowns to match this property regardless of which search path resolved it (UPIC, Old GP
    /// Number, or the dropdowns themselves), instead of re-deriving it from the formatted
    /// <see cref="Zone"/> display string.
    /// </summary>
    public int WardId { get; set; }

    /// <summary>
    /// The ULB's current finance year (CORE.YearMaster.IsActive = 1), formatted e.g. "2026-27".
    /// Always populated regardless of whether this property has any schedule rows yet — the KPI
    /// card must not depend on a "Current" row existing in <see cref="Rows"/>.
    /// </summary>
    public string? CurrentFinancialYear { get; set; }

    /// <summary>The active base tax code — "GEN" or "TaxTotal" — from PolicyConfiguration SECTION129_STAGE_BASE_TAXCODE.</summary>
    public string BaseTaxCode { get; set; } = "GEN";

    /// <summary>
    /// The base tax code the EXISTING schedule was actually built against (frozen per row at write
    /// time) — may differ from <see cref="BaseTaxCode"/> when SECTION129_STAGE_BASE_TAXCODE was
    /// changed after this property was already applied. Null when no schedule rows exist yet.
    /// </summary>
    public string? AppliedBaseTaxCode { get; set; }

    // ── Header block ──────────────────────────────────────────────────────────
    public string Upic { get; set; } = string.Empty;
    public string? OldGpNo { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string UseType { get; set; } = string.Empty;
    public string Zone { get; set; } = string.Empty;

    // ── Case-level facts (from PropertySection129Application — defaults when never applied) ──
    public bool IsApplied { get; set; }
    public string? AssessmentYear { get; set; }
    public DateTime? AppliedDate { get; set; }

    /// <summary>Ward-wide Area Inclusion Date auto-fetched from WardSection129Master by this
    /// property's ward — read-only, not officer-entered.</summary>
    public DateTime? AreaInclusionDate { get; set; }

    /// <summary>This property's own Occupancy Certificate date (earliest active OC IssueDate) —
    /// read-only. Only populated once Section 129A has been applied (<see cref="IsApplied"/>); null
    /// on the very first Apply screen.</summary>
    public DateTime? OcDate { get; set; }

    /// <summary>The "use OC Date as the basis" checkbox: false = the schedule is anchored to the
    /// ward's <see cref="AreaInclusionDate"/>; true = anchored to this property's <see cref="OcDate"/>.</summary>
    public bool UseOcDateBasis { get; set; }

    public decimal OldTax { get; set; }
    public decimal FullGeneralTax { get; set; }

    /// <summary>PTIS.TransMast.CalculationValue (the RV) for the current year's base-tax row — "Taxable Value (₹)" on the screen.</summary>
    public decimal TaxableValue { get; set; }

    /// <summary>PTIS.TaxPercentageMasterRV.TaxPercentage for the base tax, the property's TypeOfUseId, and its assessment-year range — "General Tax Rate (%)" on the screen.</summary>
    public decimal GeneralTaxRate { get; set; }
    public bool AreaChanged { get; set; }
    public bool UseChanged { get; set; }
    public bool OtherStructuralChange { get; set; }
    public DateTime? OtherStructuralChangeEffectiveDate { get; set; }
    /// <summary>Free-text remark covering any of the three property-change flags (Area, Use, Other Structural/Assessment Change) — not limited to just the "Other" one.</summary>
    public string? ChangeDetailsRemark { get; set; }
    public string CaseStatus { get; set; } = "NotApplied";
    public string? Remarks { get; set; }

    public List<Section129ScheduleRowDto> Rows { get; set; } = new();
    public List<Section129StageDto> Stages { get; set; } = new();

    /// <summary>
    /// Set by RecalculateAsync when it skipped recalculation entirely (no writes) instead of doing
    /// new work — a machine-readable reason code, not display text (the frontend owns the actual
    /// i18n'd message via its own translation files, same as every other message on this screen).
    /// Current values: "BasisNotCalculated" (no municipal-tax/NETTAX figure exists yet for the
    /// current finance year, so there is no basis to stage a percentage of) and
    /// "BaseTaxCodeChanged" (SECTION129_STAGE_BASE_TAXCODE no longer matches <see cref="AppliedBaseTaxCode"/> —
    /// see that property for what the existing schedule is actually staged under). Null on every
    /// other call (GetScheduleAsync, ApplyAsync, or a RecalculateAsync that genuinely did new work).
    /// </summary>
    public string? RecalculateBlockedReason { get; set; }
}

public class Section129StageDto
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsCompleted { get; set; }
}

public class Section129ScheduleRowDto
{
    public int SrNo { get; set; }
    public int FinanceYearId { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public decimal? MunicipalPct { get; set; }
    public decimal StageTax { get; set; }
    public decimal OldGpTax { get; set; }
    public decimal ApplicableTax { get; set; }
    public decimal TotalDemand { get; set; }
    public decimal DifferenceFrom100 { get; set; }
    public string RuleApplied { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
