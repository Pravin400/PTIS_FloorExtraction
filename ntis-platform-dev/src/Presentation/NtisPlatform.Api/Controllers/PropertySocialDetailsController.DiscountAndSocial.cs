using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Exceptions;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Api.Controllers;

public partial class PropertySocialDetailsController
{
    /// <summary>
    /// 1st API: Dedicated endpoint for Apartment Society Discount &amp; Social Data Grid
    /// across Apartment Level, Wing Level, and Unit Level hierarchy.
    /// </summary>
    /// <param name="societyDetailId">The ID of the society (SocietyDetailsMast.Id).</param>
    /// <param name="propertyId">Optional property ID context.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Discount &amp; Social grid dataset containing applied/available items and level counts.</response>
    /// <response code="400">Invalid societyDetailId or mismatched propertyId.</response>
    /// <response code="404">Society not found or inactive.</response>
    /// <response code="500">Internal server error.</response>
    [HttpGet("society/{societyDetailId}/discount-and-social-grid")]
    [ProducesResponseType(typeof(ApiResponse<PropertyDiscountAndSocialGridResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetApartmentSocietyDiscountAndSocialGrid(
        [FromRoute] int societyDetailId,
        [FromQuery] int? propertyId,
        CancellationToken ct)
    {
        if (societyDetailId <= 0)
        {
            return BadRequest(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = "A valid societyDetailId is required."
            });
        }

        if (propertyId.HasValue && propertyId.Value <= 0)
        {
            return BadRequest(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = "propertyId must be greater than zero when provided."
            });
        }

        try
        {
            var result = await _service.GetApartmentSocietyDiscountAndSocialGridAsync(societyDetailId, propertyId, ct);

            return Ok(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = true,
                Message = "Apartment Society Discount and Social Data retrieved successfully.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (PropertyValidationException ex)
        {
            return BadRequest(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving apartment discount and social grid data for SocietyDetailId: {SocietyDetailId}, PropertyId: {PropertyId}",
                societyDetailId, propertyId);

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = "An error occurred while retrieving apartment discount and social data grid."
            });
        }
    }

    /// <summary>
    /// 2nd API: Dedicated endpoint for Individual Property Discount &amp; Social Data Grid.
    /// </summary>
    /// <param name="propertyId">The ID of the individual property (PropertyMast.Id).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Discount &amp; Social grid dataset for the individual property.</response>
    /// <response code="400">Invalid propertyId parameter.</response>
    /// <response code="404">Property not found or inactive.</response>
    /// <response code="500">Internal server error.</response>
    [HttpGet("property/{propertyId}/discount-and-social-grid")]
    [ProducesResponseType(typeof(ApiResponse<PropertyDiscountAndSocialGridResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetIndividualPropertyDiscountAndSocialGrid(
        [FromRoute] int propertyId,
        CancellationToken ct)
    {
        if (propertyId <= 0)
        {
            return BadRequest(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = "A valid propertyId is required."
            });
        }

        try
        {
            var result = await _service.GetIndividualPropertyDiscountAndSocialGridAsync(propertyId, ct);

            return Ok(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = true,
                Message = "Individual Property Discount and Social Data retrieved successfully.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (PropertyValidationException ex)
        {
            return BadRequest(new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving individual discount and social grid data for PropertyId: {PropertyId}", propertyId);

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PropertyDiscountAndSocialGridResponseDto>
            {
                Success = false,
                Message = "An error occurred while retrieving individual property discount and social data grid."
            });
        }
    }
}
