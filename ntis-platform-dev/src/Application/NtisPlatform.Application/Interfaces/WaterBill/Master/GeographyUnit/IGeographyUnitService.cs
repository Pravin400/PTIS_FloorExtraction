using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyUnit;

public interface IGeographyUnitService
    : ICommonCrudService<GeographyUnitEntity, GeographyUnitDto, CreateGeographyUnitDto, UpdateGeographyUnitDto, GeographyUnitQueryParameters, int>
{
    /// <summary>
    /// Returns the active geography units eligible as ParentGeographyUnitId for a unit being created
    /// under <paramref name="geographyTypeId"/> -- i.e. units belonging to the geography type one
    /// level above it (LevelNo - 1). Empty for a top-level type (LevelNo &lt;= 1) or one with no
    /// type registered at the level above.
    /// </summary>
    Task<IReadOnlyList<GeographyUnitLookupDto>> GetParentCandidatesAsync(int geographyTypeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Builds the full geography hierarchy as a nested tree (each node's Children holds its direct
    /// descendants, recursively) for the family-tree style UI. When <paramref name="rootId"/> is
    /// given, returns only that unit's subtree (as a single-element list); otherwise returns every
    /// top-level unit (ParentGeographyUnitId == null) as a forest. Only active, non-deleted units
    /// are included.
    /// </summary>
    Task<IReadOnlyList<GeographyUnitTreeNodeDto>> GetHierarchyTreeAsync(int? rootId = null, CancellationToken cancellationToken = default);
}
