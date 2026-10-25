namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Entity representing a grievance type ([GRV].[GrievanceTypeMaster])
/// </summary>
public class GrievanceTypeMasterEntity : BaseEntity
{
    /// <summary>
    /// Foreign key to [GRV].[GrievanceDepartmentMaster]
    /// </summary>
    public int GrievanceDepartmentId { get; set; }

    /// <summary>
    /// Grievance type name (e.g. Potholes, Leakage, Low pressure)
    /// </summary>
    public string? GrievanceType { get; set; }

    /// <summary>
    /// Navigation property to parent GrievanceDepartmentMaster
    /// </summary>
    public virtual GrievanceDepartmentMasterEntity? GrievanceDepartment { get; set; }

    /// <summary>
    /// Navigation property to grievance applications
    /// </summary>
    public virtual ICollection<GrievanceApplicationEntity> GrievanceApplications { get; set; } = new List<GrievanceApplicationEntity>();
}
