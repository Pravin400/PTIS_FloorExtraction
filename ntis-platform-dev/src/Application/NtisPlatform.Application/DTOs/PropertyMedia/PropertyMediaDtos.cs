namespace NtisPlatform.Application.DTOs.PropertyMedia;

/// <summary>
/// A generic {Id, Name} dropdown entry, shared by the Division, Ward, Property Type, and
/// PropertySubType dropdowns in the Upload/Download drawer.
/// </summary>
public class PropertyMediaDropdownOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// PTIS.PropertyMast counts, all scoped to the same base filter: IsActive = 1 AND MarkedForDeletion = 0.
/// Structures and Units are independent counts (not complementary) - a row with both PropertyNo and
/// PartitionNo populated is counted in both, so Structures + Units does not necessarily equal Total.
/// </summary>
public class PropertyCountBreakdownDto
{
    /// <summary>COUNT(Id) WHERE IsActive = 1 AND MarkedForDeletion = 0.</summary>
    public int Total { get; set; }

    /// <summary>COUNT(Id) WHERE IsActive = 1 AND MarkedForDeletion = 0 AND PropertyNo IS NOT NULL AND PropertyNo &lt;&gt; ''.</summary>
    public int Structures { get; set; }

    /// <summary>COUNT(Id) WHERE IsActive = 1 AND MarkedForDeletion = 0 AND PartitionNo IS NOT NULL AND PartitionNo &lt;&gt; ''.</summary>
    public int Units { get; set; }
}

/// <summary>
/// A Gap Analysis overview card: how many properties the requirement applies to (Applicable),
/// how many already satisfy it (Available), and the shortfall (Missing = Applicable - Available).
/// </summary>
public class GapCountDto
{
    public int Applicable { get; set; }
    public int Available { get; set; }
    public int Missing { get; set; }
}

/// <summary>
/// Dashboard statistics for the Property Media &amp; Document Center screen.
/// </summary>
public class PropertyMediaDashboardStatsDto
{
    /// <summary>
    /// Total registered properties in PTIS.PropertyMast, broken down by Structure/Unit.
    /// </summary>
    public PropertyCountBreakdownDto TotalProperties { get; set; } = new();

    /// <summary>
    /// Properties with at least one active, non-deleted PTIS.PropertyPhoto row whose
    /// PropertyPhotoType.PhotoTypeName is 'Property Photo' or 'Building Photo' (combined -
    /// a property with either or both types is counted once), broken down by Structure/Unit.
    /// </summary>
    public PropertyCountBreakdownDto BuildingPhotoAvailable { get; set; } = new();

    /// <summary>
    /// Row-level count (not de-duplicated by property) of active, non-deleted PTIS.PropertyPhoto
    /// rows whose PropertyPhotoType.PhotoTypeName = 'Photo Plan', broken down by Structure/Unit.
    /// </summary>
    public PropertyCountBreakdownDto BuildingPlanAvailable { get; set; } = new();

    /// <summary>
    /// Gap Analysis "Building Photo Missing" card: Applicable = TotalProperties.Total,
    /// Available = BuildingPhotoAvailable.Total, Missing = Applicable - Available.
    /// </summary>
    public GapCountDto BuildingPhotoMissing { get; set; } = new();

    /// <summary>
    /// Gap Analysis "Building Plan Missing" card: Applicable = TotalProperties.Total,
    /// Available = BuildingPlanAvailable.Total, Missing = Applicable - Available.
    /// </summary>
    public GapCountDto BuildingPlanMissing { get; set; } = new();
}

/// <summary>
/// All Property Filter data for the Upload/Download drawer, combined into one response:
/// Ward and Property Type dropdown options, plus the Property No. From/To range's
/// matching-property count (that field is a free-text filter, not a dropdown).
/// </summary>
public class PropertyMediaFilterOptionsDto
{
    public List<PropertyMediaDropdownOptionDto> Wards { get; set; } = new();
    public List<PropertyMediaDropdownOptionDto> PropertyTypes { get; set; } = new();
    public PropertyCountBreakdownDto PropertyNoRangeCount { get; set; } = new();
}

/// <summary>
/// One row in the "Detailed Coverage" table, per active PTIS.PropertyPhotoType.
/// Applicable = total active, non-deleted properties.
/// Available = row-level count of active, non-deleted PropertyPhoto rows of this PhotoType
/// (a property with 2 photos of the same type is counted twice). Missing = Applicable - Available.
/// CoveragePercentage = Available / Applicable * 100 (0 when Applicable is 0), rounded to 2 dp.
/// </summary>
public class PropertyMediaCoverageRowDto
{
    public string Category { get; set; } = "Photo";
    public int PhotoTypeId { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;

    /// <summary>"Mandatory" for the fixed set of core photo/plan types, "Conditional" for every other PhotoTypeName.</summary>
    public string Requirement { get; set; } = string.Empty;
    public int Applicable { get; set; }
    public int Available { get; set; }
    public int Missing { get; set; }

    /// <summary>
    /// Available / Applicable expressed as a percentage string with a trailing "%" (e.g. "0.03%").
    /// Rounded to 2 decimal places. Returns "0%" when Applicable is 0.
    /// </summary>
    public string CoveragePercentage { get; set; } = "0%";
}

/// <summary>
/// One row in the "View" drill-down grid on a Detailed Coverage row: an active, non-deleted
/// property that is missing the selected PropertyPhotoType (no active PropertyPhoto row of
/// that type).
/// </summary>
public class PropertyMediaGapRowDto
{
    public int PropertyId { get; set; }
    public string? PropertyNo { get; set; }
    public string? ZoneNo { get; set; }
    public string? WardNo { get; set; }
    public string? OwnerName { get; set; }
    public string? PropertyType { get; set; }

    /// <summary>The property's current PTIS.PropertyWorkflowStageMaster stage name, if any (from
    /// PropertyWorkflowDetails where CurrentStatus = 1); null if it has no current stage row.</summary>
    public string? StageName { get; set; }
    public string MissingType { get; set; } = string.Empty;

    /// <summary>The property's UpdatedDate formatted "dd-MM-yyyy", or "Never" if it has none.</summary>
    public string UpdatedDate { get; set; } = "Never";
}

/// <summary>
/// Response payload for the missing-properties drill-down: the selected PropertyPhotoType,
/// the total gap count (all matching rows), and the current page of rows.
/// </summary>
public class PropertyMediaGapListDto
{
    public int PhotoTypeId { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public int GapRecords { get; set; }
    public List<PropertyMediaGapRowDto> Items { get; set; } = new();
}
