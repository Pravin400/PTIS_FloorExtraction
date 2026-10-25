using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Api.Controllers.Asset_Management
{
    /// <summary>CRUD and query endpoints for dynamic grievance workflow stages.</summary>
    [ApiController]
    [Route("api/asset-management/grievance-workflow-stage")]
    public class GrievanceWorkflowStageMasterController : ControllerBase
    {
        private readonly IGrievanceWorkflowStageMasterService _service;
        private readonly IHardDeleteCleanupService _cleanupService;
        private readonly IReferenceValidationService _referenceValidationService;
        private readonly ILogger<GrievanceWorkflowStageMasterController> _logger;

        public GrievanceWorkflowStageMasterController(
            IGrievanceWorkflowStageMasterService service,
            IHardDeleteCleanupService cleanupService,
            IReferenceValidationService referenceValidationService,
            ILogger<GrievanceWorkflowStageMasterController> logger)
        {
            _service = service;
            _cleanupService = cleanupService;
            _referenceValidationService = referenceValidationService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<GrievanceWorkflowStageMasterDto>), StatusCodes.Status200OK)]
        public Task<IActionResult> GetAll([FromQuery] GrievanceWorkflowStageQueryParameters queryParameters, CancellationToken cancellationToken)
            => this.ExecuteGetAllPaged(_service, queryParameters, _logger, cancellationToken);

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status404NotFound)]
        public Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
            => this.ExecuteGetById(_service, id, _logger, cancellationToken);

        [HttpGet("by-ulb-type/{ulbTypeId}")]
        [ProducesResponseType(typeof(ApiResponse<List<GrievanceWorkflowStageMasterDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<GrievanceWorkflowStageMasterDto>>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetStagesByUlbType(int ulbTypeId, CancellationToken cancellationToken)
        {
            try
            {
                if (ulbTypeId <= 0)
                {
                    return BadRequest(ApiResponse<List<GrievanceWorkflowStageMasterDto>>.ErrorResponse("Invalid ULB Type ID provided."));
                }

                var stages = await _service.GetStagesByUlbTypeAsync(ulbTypeId, cancellationToken);
                return Ok(ApiResponse<List<GrievanceWorkflowStageMasterDto>>.SuccessResponse(stages));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching grievance workflow stages for ULB type {UlbTypeId}", ulbTypeId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<List<GrievanceWorkflowStageMasterDto>>.ErrorResponse("An error occurred while fetching stages."));
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status400BadRequest)]
        public Task<IActionResult> Create([FromBody] CreateGrievanceWorkflowStageMasterDto createDto, CancellationToken cancellationToken)
            => this.ExecuteCreate(_service, createDto, _logger, cancellationToken);

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<GrievanceWorkflowStageMasterDto>), StatusCodes.Status400BadRequest)]
        public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceWorkflowStageMasterDto updateDto, CancellationToken cancellationToken)
            => this.ExecuteUpdate(_service, id, updateDto, _logger, cancellationToken);

        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        public Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
            => this.ExecuteDelete(_service, id, _logger, cancellationToken);

        [HttpDelete("{id}/purge")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        public Task<IActionResult> ForceHardDelete(int id, CancellationToken cancellationToken)
            => this.ExecuteForceDelete<GrievanceWorkflowStageMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, cancellationToken);
    }
}