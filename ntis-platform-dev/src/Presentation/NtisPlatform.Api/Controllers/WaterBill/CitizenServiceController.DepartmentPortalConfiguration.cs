using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers.WaterBill;

/// <summary>
/// Department portal configuration partial API for administrative CRUD operations and departmental portal queries.
/// Administrative endpoints require authorization; the runtime department portal query is explicitly anonymous.
/// Exposed under /api/citizen/portal-configuration and grouped under CitizenService in Swagger.
/// </summary>
public partial class CitizenServiceController
{
    /// <summary>
    /// Get all department portal configurations with filtering, sorting, and pagination.
    /// </summary>
    [Authorize]
    [HttpGet("/api/citizen/department-portal-configuration")]
    public Task<IActionResult> GetAllDepartmentPortalConfigurations(
        [FromQuery] DepartmentPortalConfigurationQueryParameters queryParameters,
        CancellationToken ct)
        => this.ExecuteGetAllPaged(_departmentPortalConfigService, queryParameters, _logger, ct);

    /// <summary>
    /// Get department portal configuration by Id.
    /// </summary>
    [Authorize]
    [HttpGet("/api/citizen/department-portal-configuration/{id}")]
    public Task<IActionResult> GetDepartmentPortalConfigurationById(int id, CancellationToken ct)
        => this.ExecuteGetById(_departmentPortalConfigService, id, _logger, ct);

    /// <summary>
    /// Get active department portal configuration for citizen / department portal runtime lookup.
    /// Explicitly allows anonymous read-only access.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("/api/citizen/department-portal-configuration/department/{departmentId}")]
    public async Task<IActionResult> GetDepartmentPortalConfigurationByDepartmentId(int departmentId, CancellationToken ct)
    {
        var result = await _departmentPortalConfigService.GetByDepartmentIdAsync(departmentId, ct);
        if (result == null)
        {
            return NotFound(new ApiResponse<DepartmentPortalConfigurationDto>
            {
                Success = false,
                Message = $"Portal configuration not found for Department Id {departmentId}."
            });
        }

        return Ok(new ApiResponse<DepartmentPortalConfigurationDto>
        {
            Success = true,
            Items = result
        });
    }

    /// <summary>
    /// Create a new department portal configuration.
    /// </summary>
    [Authorize]
    [HttpPost("/api/citizen/department-portal-configuration")]
    public Task<IActionResult> CreateDepartmentPortalConfiguration(
        [FromBody] CreateDepartmentPortalConfigurationDto createDto,
        CancellationToken ct)
        => this.ExecuteCreate(_departmentPortalConfigService, createDto, _logger, ct);

    /// <summary>
    /// Update an existing department portal configuration with optimistic concurrency enforcement.
    /// </summary>
    [Authorize]
    [HttpPut("/api/citizen/department-portal-configuration/{id}")]
    public Task<IActionResult> UpdateDepartmentPortalConfiguration(
        int id,
        [FromBody] UpdateDepartmentPortalConfigurationDto updateDto,
        CancellationToken ct)
        => this.ExecuteUpdate(_departmentPortalConfigService, id, updateDto, _logger, ct);

    /// <summary>
    /// Soft delete / deactivate department portal configuration.
    /// </summary>
    [Authorize]
    [HttpDelete("/api/citizen/department-portal-configuration/{id}")]
    public Task<IActionResult> DeleteDepartmentPortalConfiguration(int id, CancellationToken ct)
        => this.ExecuteDelete(_departmentPortalConfigService, id, _logger, ct);

    /// <summary>
    /// Activate or deactivate a department portal configuration.
    /// </summary>
    [Authorize]
    [HttpPatch("/api/citizen/department-portal-configuration/{id}/status")]
    public async Task<IActionResult> UpdateDepartmentPortalConfigurationStatus(
        int id,
        [FromBody] UpdatePortalConfigStatusDto dto,
        CancellationToken ct)
    {
        var success = await _departmentPortalConfigService.SetActiveStatusAsync(id, dto.IsActive, ct);
        if (!success)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal configuration with Id {id} not found."
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"Portal configuration {(dto.IsActive ? "activated" : "deactivated")} successfully."
        });
    }
}
