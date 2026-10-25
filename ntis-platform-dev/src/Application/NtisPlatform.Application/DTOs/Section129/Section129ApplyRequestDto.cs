namespace NtisPlatform.Application.DTOs.Section129;

/// <summary>
/// Body for POST /Property/{propertyId}/section129a-apply — the officer's one-time
/// "Apply Section 129A" action plus the three officer-selected property-change facts
/// (Area, Use, Other Structural / Assessment Change — all officer-entered, not auto-detected).
/// </summary>
public class Section129ApplyRequestDto
{
    /// <summary>Officer-selected "Increase in Area" — Yes disqualifies Section 129A (full/100% tax applies).</summary>
    public bool AreaChanged { get; set; }

    /// <summary>Officer-selected "Change of Use" — Yes disqualifies Section 129A (full/100% tax applies).</summary>
    public bool UseChanged { get; set; }

    /// <summary>Only needed when PropertyDetails.AssessmentYear can't be resolved to a FinanceYearId
    /// and the ward has no WardSection129Master row configured either.</summary>
    public int? StartFinanceYearIdOverride { get; set; }

    /// <summary>
    /// false (default) = anchor the schedule to the ward's Area Inclusion Date (auto-fetched from
    /// WardSection129Master); true = anchor it to this property's own Occupancy Certificate date.
    /// </summary>
    public bool UseOcDateBasis { get; set; }

    public bool OtherStructuralChange { get; set; }
    public DateTime? OtherStructuralChangeEffectiveDate { get; set; }
    /// <summary>Free-text remark covering any of the three property-change flags (Area, Use, Other Structural/Assessment Change) — not limited to just the "Other" one.</summary>
    public string? ChangeDetailsRemark { get; set; }
    public string? Remarks { get; set; }
}
