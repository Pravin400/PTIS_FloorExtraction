using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

public partial class PropertySocialDetailsController
{
    [HttpGet("social-info-filterby")]
    [ProducesResponseType(typeof(ApiResponse<PropertySocialInfoBulkResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPropertySocialInfoBulk([FromQuery] int? propertyId, [FromQuery] int? societyDetailId, [FromQuery] int? wingDetailId, [FromQuery] string? entityType, CancellationToken ct)
    {
        var result = await _bulkService.GetPropertySocialInfoBulkAsync(propertyId, societyDetailId, wingDetailId, entityType, ct);
        return Ok(new ApiResponse<PropertySocialInfoBulkResponseDto>
        {
            Success = true,
            Message = "Property social information retrieved successfully",
            Items = result
        });
    }
   
    [HttpPut("upsert-filterby")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertySocialDetailsBulkDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpsertPropertySocialInfoBulk([FromBody] UpsertPropertySocialInfoBulkDto dto, CancellationToken ct)
    {
        var result = await _bulkService.UpsertPropertySocialInfoBulkAsync(dto, ct);
        return Ok(new ApiResponse<List<PropertySocialDetailsBulkDto>>
        {
            Success = true,
            Message = "Property social information updated successfully.",
            Items = result
        });
    }
}
