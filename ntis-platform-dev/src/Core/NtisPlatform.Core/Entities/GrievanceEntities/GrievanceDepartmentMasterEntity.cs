using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Entity representing a grievance department ([GRV].[GrievanceDepartmentMaster]).
/// May be linked to a <see cref="DepartmentMasterEntity"/> from [CORE].[DepartmentMaster]
/// via <see cref="CoreDepartmentId"/> to enable centralized, cross-module grievance routing.
/// </summary>
public class GrievanceDepartmentMasterEntity : BaseEntity
{
    /// <summary>
    /// Department name (e.g. Public Works Department, Water Supply Department).
    /// Sourced from or synchronized with <see cref="CoreDepartment"/> when linked.
    /// </summary>
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>
    /// Local language department name (e.g. Marathi).
    /// </summary>
    public string? DepartmentNameLocal { get; set; }

    /// <summary>
    /// Optional FK to [CORE].[DepartmentMaster].
    /// When set, this grievance department is mapped to a core platform department,
    /// enabling centralized grievance routing for cross-module complaints (PTIS, WTIS, etc.).
    /// Null indicates a standalone grievance-only department.
    /// </summary>
    public int? CoreDepartmentId { get; set; }

    /// <summary>
    /// Navigation property to the linked [CORE].[DepartmentMaster] record.
    /// </summary>
    [ForeignKey(nameof(CoreDepartmentId))]
    public virtual DepartmentMasterEntity? CoreDepartment { get; set; }

    /// <summary>
    /// Associated grievance types under this department.
    /// </summary>
    public virtual ICollection<GrievanceTypeMasterEntity> GrievanceTypes { get; set; } = new List<GrievanceTypeMasterEntity>();
    public virtual ICollection<GrievanceApplicationEntity> GrievanceApplications { get; set; } = new List<GrievanceApplicationEntity>();
    public virtual ICollection<GrievanceDeptForwardingEntity> Forwardings { get; set; } = new List<GrievanceDeptForwardingEntity>();
}
