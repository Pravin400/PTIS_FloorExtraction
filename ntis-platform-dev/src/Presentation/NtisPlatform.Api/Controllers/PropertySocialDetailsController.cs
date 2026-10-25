using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public partial class PropertySocialDetailsController : ControllerBase
{
    private readonly IPropertySocialDetailsService _service;
    private readonly IPropertySocialDetailsBulkService _bulkService;
    private readonly ILogger<PropertySocialDetailsController> _logger;

    public PropertySocialDetailsController(
        ILogger<PropertySocialDetailsController> logger,
        IPropertySocialDetailsService service,
        IPropertySocialDetailsBulkService bulkService)
    {
        _service = service;
        _bulkService = bulkService;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PropertySocialDetailsQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreatePropertySocialDetailsDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPost("Bulk/by-property-ids")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> BulkCreateByPropertyIds([FromBody] BulkCreatePropertySocialDetailsByPropertyIdsDto request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return Task.FromResult<IActionResult>(BadRequest(new ApiResponse<PropertySocialDetailsDto>
            {
                Success = false,
                Message = "Invalid request data"
            }));
        }

        var items = request.ToCreateDtos();
        if (items.Count == 0)
        {
            return Task.FromResult<IActionResult>(BadRequest(new ApiResponse<PropertySocialDetailsDto>
            {
                Success = false,
                Message = "No valid property IDs were provided."
            }));
        }

        return this.ExecuteBulkCreate(_service, items.ToArray(), _logger, ct);
    }

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdatePropertySocialDetailsDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Retrieves property social details filtered by hierarchy parameters and/or attribute id.
    /// Acts as the page-load API for the Property Social Details screen, returning applied attributes
    /// and non-applied master attributes.
    /// </summary>
    /// <param name="societyDetailId">Filter by society detail id.</param>
    /// <param name="wingDetailId">Filter by wing detail id.</param>
    /// <param name="propertyId">Filter by property id.</param>
    /// <param name="socialAttributeId">Filter by social attribute master id.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Applied attributes and non-applied master attributes.</returns>
    [HttpGet("by-filters")]
    [ProducesResponseType(typeof(ApiResponse<PropertySocialDetailsFilterResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetByFilters(
        [FromQuery] int? societyDetailId,
        [FromQuery] int? wingDetailId,
        [FromQuery] int? propertyId,
        [FromQuery] int? socialAttributeId,
        CancellationToken ct)
    {
        if (socialAttributeId is null && societyDetailId is null && wingDetailId is null && propertyId is null)
        {
            return BadRequest(new ApiResponse<PropertySocialDetailsFilterResponseDto>
            {
                Success = false,
                Message = "At least one filter parameter (societyDetailId, wingDetailId, propertyId, or socialAttributeId) must be provided."
            });
        }

        try
        {
            var result = await _service.GetByFiltersAsync(socialAttributeId, societyDetailId, wingDetailId, propertyId, ct);

            return Ok(new ApiResponse<PropertySocialDetailsFilterResponseDto>
            {
                Success = true,
                Message = "Property social details retrieved successfully",
                Items = result
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (NtisPlatform.Application.Exceptions.ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property social details for socialAttributeId: {SocialAttributeId}, societyDetailId: {SocietyDetailId}, wingDetailId: {WingDetailId}, propertyId: {PropertyId}",
                socialAttributeId, societyDetailId, wingDetailId, propertyId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PropertySocialDetailsFilterResponseDto>
            {
                Success = false,
                Message = "An error occurred while retrieving property social details"
            });
        }
    }


    [HttpDelete]
    public async Task<IActionResult> DeleteByPropertyAndAttribute([FromQuery] int propertyId, [FromQuery] int socialAttributeId, CancellationToken ct)
    {
        try
        {
            var result = await _service.DeleteByPropertyAndAttributeAsync(propertyId, socialAttributeId, ct);
            return result ? Ok(new ApiResponse<PropertySocialDetailsDto>
            {
                Success = true,
                Message = "Record marked for deletion"
            }) :
            Ok(new ApiResponse<PropertySocialDetailsDto>
            {
                Success = false,
                Message = "Record not found"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete operation failed for propertyId: {PropertyId}, SocialAttributeId: {SocialAttributeId}", propertyId, socialAttributeId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PropertySocialDetailsDto>
            {
                Success = false,
                Message = "An error occurred while deleting the record"
            });
        }
    }

    /// <summary>
    /// Soft-deletes <see cref="PropertySocialDetailsEntity"/> records matching the EntityType
    /// supplied by the UI and the supplied hierarchy identifiers.
    ///
    /// EntityType and SocialAttributeId are mandatory. The hierarchy scope is:
    /// <list type="bullet">
    ///   <item>No WingDetailId or PropertyIds - society-level rows.</item>
    ///   <item>WingDetailId without PropertyIds - rows for that wing.</item>
    ///   <item>PropertyIds supplied - only those property rows.</item>
    /// </list>
    ///
    /// For property-scoped requests, a related document binding is retained while another active
    /// social-detail row still references it. Other hierarchy scopes deactivate matched bindings directly.
    /// </summary>
    [HttpDelete("by-apartment-wing-unit")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteByHierarchy([FromQuery] SoftDeleteByHierarchyRequest request,CancellationToken ct = default)
    {
        try
        {
            var deletedCount = await _service.SoftDeleteByHierarchyAsync(request, ct);

            return Ok(new ApiResponse<int>
            {
                Success = true,
                Message = $"{deletedCount} record(s) deleted successfully.",
                Items = deletedCount
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "DeleteByHierarchy failed - EntityType: {EntityType}, SocialAttributeId: {SocialAttributeId}, SocietyDetailsId: {SocietyDetailsId}, WingDetailId: {WingDetailId}, DocumentBindingId: {DocumentBindingId}, PropertyIds: [{PropertyIds}]",
                request.EntityType, request.SocialAttributeId, request.SocietyDetailsId, request.WingDetailId, request.DocumentBindingId,
                request.PropertyIds ?? "none");

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<int>
            {
                Success = false,
                Message = "An error occurred while processing the delete request."
            });
        }
    }





    [HttpGet("property/{propertyId}/social-info")]
    [ProducesResponseType(typeof(ApiResponse<PropertySocialInfoResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPropertySocialInfo(int propertyId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetPropertySocialInfoAsync(propertyId, ct);

            return Ok(new ApiResponse<PropertySocialInfoResponseDto>
            {
                Success = true,
                Message = "Property social information retrieved successfully",
                Items = result
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (NtisPlatform.Application.Exceptions.ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving social information for property {PropertyId}", propertyId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ApiResponse<PropertySocialInfoResponseDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving property social information"
                });
        }
    }

    /// <summary>
    /// Upsert (Add/Update/Remove) property social information in a single operation.
    /// This endpoint allows you to add new social attributes, update existing ones, and remove unwanted ones.
    /// </summary>
    /// <param name="dto">Contains the property ID, social attributes to add/update, and IDs of attributes to remove</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Updated list of all active social attributes for the property</returns>
    /// <response code="200">Returns the updated list of property social attributes</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="500">If an error occurs during the operation</response>
    /// <remarks>
    /// Sample request:
    /// 
    ///     PUT /api/PropertySocialDetails/upsert
    ///     {
    ///         "propertyId": 123,
    ///         "updatedBy": 1,
    ///         "socialAttributes": [
    ///             {
    ///                 "id": null,
    ///                 "socialAttributeId": 5,
    ///                 "bitValue": true,
    ///                 "remark": "Solar installed"
    ///             },
    ///             {
    ///                 "id": null,
    ///                 "socialAttributeId": 6,
    ///                 "intValue": 10,
    ///                 "remark": "10 solar units"
    ///             },
    ///             {
    ///                 "id": 10,
    ///                 "socialAttributeId": 3,
    ///                 "decimalValue": 100.5,
    ///                 "remark": "Updated road width"
    ///             }
    ///         ],
    ///         "socialAttributeIdsToRemove": [8, 9]
    ///     }
    ///     
    /// **How it works:**
    /// - **Add**: Set `id` to null or omit it, and provide the social attribute details
    /// - **Update**: Provide existing `id` with updated values
    /// - **Remove**: Add the `socialAttributeId` to `socialAttributeIdsToRemove` array (soft delete - sets IsActive = false)
    /// 
    /// **For parent-child relationships:**
    /// - When adding HAS_SOLAR = true, also add NO_OF_SOLAR with value
    /// - When removing parent, child values are preserved unless explicitly removed
    /// 
    /// All operations are performed in a single transaction for data consistency.
    /// </remarks>
    /// 


    [HttpPut("upsert")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertySocialDetailsDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpsertPropertySocialInfo([FromBody] UpsertPropertySocialInfoDto dto, CancellationToken ct)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _service.UpsertPropertySocialInfoAsync(dto, ct);

            return Ok(new ApiResponse<List<PropertySocialDetailsDto>>
            {
                Success = true,
                Message = "Property social information updated successfully",
                Items = result
            });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (NtisPlatform.Application.Exceptions.ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting property social information for property {PropertyId}", dto.PropertyId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ApiResponse<List<PropertySocialDetailsDto>>
                {
                    Success = false,
                    Message = "An error occurred while updating property social information"
                });
        }
    }
}
