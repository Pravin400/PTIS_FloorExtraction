using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Application.DTOs.PropertyMedia;

/// <summary>
/// Search/paging parameters for the Detailed Coverage table (GetDetailedCoverageAsync).
/// <see cref="Category"/> is an optional exact-match filter - e.g. the Gap Analysis stat tiles
/// link here with Category=Photo ("Building Photo Missing") or Category=Plan ("Building Plan
/// Missing") so clicking a tile narrows the table to just that category; omitted/null means
/// "All Items". It's applied together (AND) with the inherited SearchTerm (one free-text search
/// box, no separate per-field filters), which separately matches either the computed Category
/// label (Photo/Plan/Document, derived the same way as the Category -> Subtype dropdown in
/// GetPropertySubTypesAsync: Plan from PhotoTypeCode containing "PLAN", Document from
/// PhotoScope == "DOCUMENT", everything else is Photo) or the PhotoTypeName - both live on
/// PropertyPhotoType, but Category isn't a real column, so matching is done manually in the
/// service rather than via [Filterable]/[Searchable].
/// </summary>
public class PropertyMediaCoverageQueryParameters : BaseQueryParameters
{
    /// <summary>
    /// Optional exact-match Category filter (Photo/Plan/Document). Null/omitted returns every
    /// category ("All Items"). See the class summary for how this differs from SearchTerm.
    /// </summary>
    public PropertyMediaCategory? Category { get; set; }
}

/// <summary>
/// Search/paging parameters for the Detailed Coverage "missing properties" drill-down
/// (GetMissingPropertiesByPhotoTypeAsync). ZoneId/WardId/PropertyTypeId/WorkflowStageId are
/// optional exact-match filters - dropdown options for them come from the existing /api/Zone,
/// /api/Ward, /api/PropertyTypeMaster and /api/PropertyWorkflowStageMaster endpoints
/// respectively, not from this module. They combine with AND, and separately with AND against
/// the inherited SearchTerm (one free-text search box, no separate per-field filters), which
/// matches PropertyNo/OwnerName (direct PTIS.PropertyMast columns) as well as
/// ZoneNo/WardNo/PropertyType (joined master-table columns) - all applied manually in the service
/// since FilterExpressionBuilder only supports single-level property lookups and can't reach
/// across joins.
/// </summary>
public class PropertyMediaGapQueryParameters : BaseQueryParameters
{
    /// <summary>Optional exact-match filter on PTIS.Zone.Id (dropdown from /api/Zone).</summary>
    public int? ZoneId { get; set; }

    /// <summary>Optional exact-match filter on PTIS.WardMaster.Id (dropdown from /api/Ward).</summary>
    public int? WardId { get; set; }

    /// <summary>Optional exact-match filter on PropertyTypeMaster.Id (dropdown from /api/PropertyTypeMaster).</summary>
    public int? PropertyTypeId { get; set; }

    /// <summary>
    /// Optional exact-match filter on the property's CURRENT PropertyWorkflowStageMaster.Id
    /// (PropertyWorkflowDetails row where CurrentStatus = 1; dropdown from
    /// /api/PropertyWorkflowStageMaster). A property with no current-stage row never matches.
    /// </summary>
    public int? WorkflowStageId { get; set; }
}
