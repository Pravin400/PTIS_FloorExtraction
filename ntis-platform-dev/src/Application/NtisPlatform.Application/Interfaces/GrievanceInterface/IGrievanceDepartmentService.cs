using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Department Master CRUD operations.
/// Supports linking grievance departments to CORE.DepartmentMaster records
/// for centralized cross-module grievance routing.
/// </summary>
public interface IGrievanceDepartmentService : ICommonCrudService<
    GrievanceDepartmentMasterEntity,
    GrievanceDepartmentDto,
    CreateGrievanceDepartmentDto,
    UpdateGrievanceDepartmentDto,
    GrievanceDepartmentQueryParameters,
    int>
{
    /// <summary>
    /// Returns all CORE.DepartmentMaster records that are not yet linked to any GRV.GrievanceDepartmentMaster.
    /// Used by admin UI to show which core departments can still be provisioned for grievances.
    /// </summary>
    Task<List<CoreDepartmentInfoDto>> GetAvailableCoreDepartmentsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Provisions a new GRV.GrievanceDepartmentMaster record linked to the given CORE.DepartmentMaster.
    /// Department name and local name are inherited from the core department.
    /// </summary>
    /// <param name="coreDepartmentId">The ID of the CORE.DepartmentMaster to link.</param>
    /// <param name="createdBy">User performing the provisioning.</param>
    Task<GrievanceDepartmentDto> ProvisionFromCoreDepartmentAsync(int coreDepartmentId, int? createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves grievance departments mapped to the departments allocated to a specific user (staff) in CORE.UserDepartmentAllocation.
    /// Matches CORE.UserDepartmentAllocation.DepartmentId to GRV.GrievanceDepartmentMaster.CoreDepartmentId.
    /// </summary>
    /// <param name="userId">The ID of the user (from CORE.UserMaster).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<List<GrievanceDepartmentDto>> GetGrievanceDepartmentsByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves the list of users (staff/officers) allocated to a grievance department.
    /// Resolves the grievance department's linked CoreDepartmentId and queries CORE.UserDepartmentAllocation.
    /// </summary>
    /// <param name="grievanceDepartmentId">The Grievance Department ID (PK of GRV.GrievanceDepartmentMaster).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<List<GrievanceDepartmentUserDto>> GetAllocatedUsersByGrievanceDepartmentIdAsync(int grievanceDepartmentId, CancellationToken cancellationToken = default);
}
