namespace NtisPlatform.Core.Models.AutomationDashboard;

// ─────────────────────────────────────────────────────────────────────────────
//  Missing Details — shared zone-summary building block
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// One row in the Missing Details zone grid.
/// Carries a single "missing count" figure so the same shape covers every
/// Missing Details category (MobileNo, OwnerName, Address, …).
/// </summary>
public class MissingDetailsZoneSummaryDto
{
    public int ZoneId { get; set; }
    public string ZoneNo { get; set; } = string.Empty;
    public string ZoneName { get; set; } = string.Empty;
    public int MissingCount { get; set; }
}

/// <summary>
/// Top-level response for a single Missing Details category.
/// Contains the grand total and a per-zone breakdown list.
/// </summary>
public class MissingDetailsSummaryResponseDto
{
    /// <summary>Sum of all zone-level MissingCount values.</summary>
    public int TotalMissing { get; set; }

    /// <summary>
    /// Per-zone rows ordered by ZoneNo for a consistent display order.
    /// </summary>
    public List<MissingDetailsZoneSummaryDto> Zones { get; set; } = new();
}

// ─────────────────────────────────────────────────────────────────────────────
//  MissingDetailsDto — common parent / umbrella DTO
//  Each category-specific DTO is a nullable child so the consumer can request
//  any combination in a future combined endpoint, and the Photo/Plan child
//  can be wired up in Phase 2 without breaking the existing structure.
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Umbrella DTO that groups all Missing Details category responses.
/// Used when a single endpoint needs to return multiple categories at once.
/// Individual category endpoints return the inner type directly.
/// </summary>
public class MissingDetailsDto
{
    /// <summary>Missing Mobile Number statistics (PropertyMast-based).</summary>
    public MissingDetailsSummaryResponseDto? MissingMobileNo { get; set; }

    /// <summary>Missing Owner Name statistics (PropertyMast-based).</summary>
    public MissingDetailsSummaryResponseDto? MissingOwnerName { get; set; }

    /// <summary>Missing Address statistics (PropertyMast-based).</summary>
    public MissingDetailsSummaryResponseDto? MissingAddress { get; set; }

    /// <summary>Missing Occupier Name statistics (PropertyMast-based).</summary>
    public MissingDetailsSummaryResponseDto? MissingOccupierName { get; set; }

    /// <summary>Missing Shop/Flat Name statistics (PropertyMast-based).</summary>
    public MissingDetailsSummaryResponseDto? MissingShopName { get; set; }

    /// <summary>Registered Property Data statistics (PropertyMastOld &amp; PropertyMapDetail based).</summary>
    public RegisteredPropertySummaryResponseDto? RegisteredPropertyData { get; set; }

    /// <summary>
    /// Backward-compatible alias for Registered Property Data.
    /// </summary>
    public RegisteredPropertySummaryResponseDto? MissingRegisteredPropertyData
    {
        get => RegisteredPropertyData;
        set => RegisteredPropertyData = value;
    }

    /// <summary>
    /// Photo and Plan missing statistics.
    /// Phase 2 — implementation details will be provided separately.
    /// This property is intentionally kept as a placeholder to maintain a
    /// stable contract without affecting existing PropertyMast-based categories.
    /// </summary>
    public MissingPhotoPlanDto? MissingPhotoPlan { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Registered Property Data DTOs (PropertyMastOld & PropertyMapDetail)
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// One row in the Registered Property Data zone grid.
/// Displays total old properties, merged properties, and the calculated gap.
/// </summary>
public class RegisteredPropertyZoneSummaryDto
{
    public int ZoneId { get; set; }
    public string ZoneNo { get; set; } = string.Empty;
    public string ZoneName { get; set; } = string.Empty;
    public int TotalOldPropertyCount { get; set; }
    public int MergeOldPropertyCount { get; set; }
    public int TotalMergedProperties => MergeOldPropertyCount;
    public int MissingOldPropertyCount => Math.Max(0, TotalOldPropertyCount - MergeOldPropertyCount);
    public int TotalMissingOldPropertyCount => MissingOldPropertyCount;
}

/// <summary>
/// Top-level response for Registered Property Data.
/// Contains the summary cards (Total Old, Merged, and Missing) and per-zone breakdown.
/// </summary>
public class RegisteredPropertySummaryResponseDto
{
    public int TotalOldPropertyCount { get; set; }
    public int TotalMergedProperties { get; set; }
    public int MergeOldPropertyCount => TotalMergedProperties;
    public int TotalMissingOldPropertyCount => Math.Max(0, TotalOldPropertyCount - TotalMergedProperties);
    public int MissingOldPropertyCount => TotalMissingOldPropertyCount;

    public List<RegisteredPropertyZoneSummaryDto> Zones { get; set; } = new();
}

// ─────────────────────────────────────────────────────────────────────────────
//  MissingPhotoPlanDto — Phase 2 placeholder
//  Kept here so the parent DTO and controller stub compile without issue.
//  Business logic and grid columns will be filled in the next prompt.
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// DTO for Photo and Plan missing data.
/// Phase 2 placeholder — business logic to be implemented separately.
/// </summary>
public class MissingPhotoPlanDto
{
    /// <summary>Total properties missing a property photo.</summary>
    public int TotalPhotoMissing { get; set; }

    /// <summary>Total properties missing a building plan document.</summary>
    public int TotalPlanMissing { get; set; }

    /// <summary>Combined total gap fields (photo + plan).</summary>
    public int TotalGapFields { get; set; }

    /// <summary>
    /// Per-zone breakdown with both photo-missing and plan-missing counts.
    /// Populated in Phase 2.
    /// </summary>
    public List<MissingPhotoPlanZoneSummaryDto> Zones { get; set; } = new();
}

/// <summary>
/// One row in the Photo &amp; Plan missing zone grid.
/// Phase 2 placeholder — columns confirmed by UI: Zone, PhotoMissing, PlanMissing, TotalMissing.
/// </summary>
public class MissingPhotoPlanZoneSummaryDto
{
    public int ZoneId { get; set; }
    public string ZoneNo { get; set; } = string.Empty;
    public string ZoneName { get; set; } = string.Empty;
    public int PhotoMissing { get; set; }
    public int PlanMissing { get; set; }
    public int TotalMissing => PhotoMissing + PlanMissing;
}
