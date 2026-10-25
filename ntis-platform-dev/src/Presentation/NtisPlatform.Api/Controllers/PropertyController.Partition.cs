using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

public partial class PropertyController
{
    [HttpPost("generate-missing-partition")]
    [ProducesResponseType(typeof(ApiResponse<GenerateMissingPartitionResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GenerateMissingPartition([FromBody] GenerateMissingPartitionRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _propertyService.GenerateMissingPartition(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating missing partitions. UserId: {UserId}, WardNo: {WardNo}, MainPropertyNo: {MainPropertyNo}, ModuleId: {ModuleId}", 
                request.UserId,
                request.WardId,
                request.MainPropertyNo,
                request.ModuleId);

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<GenerateMissingPartitionResponseDto>
            {
                Success = false,
                Message = "An unexpected error occurred while generating missing partition properties."
            });
        }
    }

    // Create New Partition API
    [HttpPost("new-partition-property")]
    [ProducesResponseType(typeof(ApiResponse<CreateNewPartitionResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateNewPartitionProperty([FromBody] CreateNewPartitionRequestDto request, CancellationToken cancellationToken) 
    {
        try
        {
            var result = await _propertyService.CreateNewPartitionPropertysAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating new partition property. UserId: {UserId}, WardId: {WardId}, MainPropertyNo: {MainPropertyNo}", 
                request.UserId,
                request.WardId,
                request.MainPropertyNo);

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<CreateNewPartitionResponseDto>
            {
                Success = false,
                Message = "An unexpected error occurred while creating new partition property."
            });
        }
    }        
}
