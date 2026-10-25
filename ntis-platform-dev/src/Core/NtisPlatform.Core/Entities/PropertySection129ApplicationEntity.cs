using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// One row per property: the officer's one-time "Apply Section 129A" marker that the
/// RateableValueService checks before running the staged-schedule logic in
/// PropertySection129ScheduleEntity. Also carries the three officer-asserted property-change
/// facts (Area, Use, Other Structural / Assessment Change — all officer-selected, not
/// auto-detected) plus an optional start-year override.
/// </summary>
public class PropertySection129ApplicationEntity : BaseEntity, IHardDeletable
{
    public int PropertyId { get; set; }

    public bool IsApplied { get; set; }

    public DateTime? AppliedDate { get; set; }

    public int? AppliedBy { get; set; }

    public int? StartFinanceYearIdOverride { get; set; }

    /// <summary>
    /// Officer-facing checkbox: false (default) = the schedule is anchored to the ward's
    /// WardSection129MasterEntity.Section129AInclusionDate; true = anchored to this property's own
    /// Occupancy Certificate date. Flipping it in either direction wipes and rebuilds the schedule.
    /// </summary>
    public bool UseOcDateBasis { get; set; }

    /// <summary>Officer-selected "Increase in Area" flag — Yes disqualifies Section 129A (full/100% tax applies).</summary>
    public bool AreaChanged { get; set; }

    /// <summary>Officer-selected "Change of Use" flag — Yes disqualifies Section 129A (full/100% tax applies).</summary>
    public bool UseChanged { get; set; }

    public bool OtherStructuralChange { get; set; }

    public DateTime? OtherStructuralChangeEffectiveDate { get; set; }

    /// <summary>Free-text remark covering any of the three property-change flags above (Area, Use, Other Structural/Assessment Change) — not limited to just the "Other" one.</summary>
    public string? ChangeDetailsRemark { get; set; }

    public string? Remark { get; set; }

    public bool MarkedForDeletion { get; set; } = false;

    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual PropertyEntity? PropertyMast { get; set; }

    public virtual YearMasterEntity? StartFinanceYearOverride { get; set; }
}
