using System.ComponentModel.DataAnnotations;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Core.Entities.WaterBill;

/// <summary>
/// Entity representing portal configuration for a department.
/// Maps to [CORE].[DepartmentPortalConfiguration] table.
/// </summary>
public class DepartmentPortalConfigurationEntity : BaseEntity
{
    /// <summary>
    /// Foreign key referencing CORE.DepartmentMaster(Id).
    /// Enforces unique constraint (one configuration per department) and is immutable after creation.
    /// </summary>
    public int DepartmentId { get; set; }

    /// <summary>
    /// Complete department-wise portal configuration stored as JSON string.
    /// Validated against SQL Server CHECK (ISJSON([ConfigJson]) = 1) constraint and application-level JSON object rules.
    /// </summary>
    public string ConfigJson { get; set; } = string.Empty;

    /// <summary>
    /// Incremental version tracking and optimistic concurrency token for configuration content changes (initial: 1).
    /// </summary>
    [ConcurrencyCheck]
    public int ConfigVersion { get; set; } = 1;

    /// <summary>
    /// Navigation property to the associated DepartmentMaster.
    /// </summary>
    public virtual DepartmentMasterEntity? Department { get; set; }
}
