using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Application.Interfaces.WaterBill;

/// <summary>
/// Service interface for DepartmentPortalConfiguration CRUD operations and custom queries.
/// </summary>
public interface IDepartmentPortalConfigurationService
    : ICommonCrudService<DepartmentPortalConfigurationEntity, DepartmentPortalConfigurationDto, CreateDepartmentPortalConfigurationDto, UpdateDepartmentPortalConfigurationDto, DepartmentPortalConfigurationQueryParameters, int>
{
    /// <summary>
    /// Gets the active portal configuration for a specific department.
    /// </summary>
    Task<DepartmentPortalConfigurationDto?> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the active status (activate/deactivate) of a portal configuration.
    /// Audit identity is resolved server-side; ConfigVersion is not incremented on status toggle.
    /// </summary>
    Task<bool> SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default);
}
