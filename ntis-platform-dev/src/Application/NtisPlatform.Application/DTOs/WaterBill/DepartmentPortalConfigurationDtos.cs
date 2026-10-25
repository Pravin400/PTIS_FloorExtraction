using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill;

/// <summary>
/// Response DTO for DepartmentPortalConfiguration.
/// </summary>
public class DepartmentPortalConfigurationDto : BaseDtos
{
    public int DepartmentId { get; set; }
    public string ConfigJson { get; set; } = string.Empty;
    public int ConfigVersion { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}

/// <summary>
/// Request DTO for creating a new DepartmentPortalConfiguration.
/// Audit fields and initial version are controlled server-side.
/// </summary>
public class CreateDepartmentPortalConfigurationDto
{
    [Required(ErrorMessage = "DepartmentId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "DepartmentId must be greater than zero.")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "ConfigJson is required.")]
    [JsonObject(ErrorMessage = "ConfigJson must be a valid JSON object.")]
    public string ConfigJson { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Request DTO for updating an existing DepartmentPortalConfiguration.
/// DepartmentId is immutable after creation. Optimistic concurrency is enforced via ExpectedVersion.
/// </summary>
public class UpdateDepartmentPortalConfigurationDto
{
    [Required(ErrorMessage = "ConfigJson is required.")]
    [JsonObject(ErrorMessage = "ConfigJson must be a valid JSON object.")]
    public string ConfigJson { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "ExpectedVersion is required for optimistic concurrency.")]
    [Range(1, int.MaxValue, ErrorMessage = "ExpectedVersion must be greater than zero.")]
    public int ExpectedVersion { get; set; }
}

/// <summary>
/// Request model for toggling active status.
/// Audit identity is resolved from server-side authenticated context.
/// </summary>
public class UpdatePortalConfigStatusDto
{
    public bool IsActive { get; set; }
}

/// <summary>
/// Query parameters for listing and filtering DepartmentPortalConfiguration.
/// </summary>
public class DepartmentPortalConfigurationQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? DepartmentId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
