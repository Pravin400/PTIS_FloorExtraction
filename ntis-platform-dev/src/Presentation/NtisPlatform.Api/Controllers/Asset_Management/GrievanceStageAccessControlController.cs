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
    /// <summary>CRUD and check endpoints for stage-level access control.</summary>
    [ApiController]
    [Route("api/asset-management/grievance-stage-access-control")]
    public class GrievanceStageAccessControlController : ControllerBase
    {
        private readonly IGrievanceStageAccessControlService _service;
        private readonly IHardDeleteCleanupService _cleanupService;
        private readonly IReferenceValidationService _referenceValidationService;
        private readonly ILogger<GrievanceStageAccessControlController> _logger;

        public GrievanceStageAccessControlController(
            IGrievanceStageAccessControlService service,
            IHardDeleteCleanupService cleanupService,
            IReferenceValidationService referenceValidationService,
            ILogger<GrievanceStageAccessControlController> logger)
        {
            _service = service;
            _cleanupService = cleanupService;
            _referenceValidationService = referenceValidationService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<GrievanceStageAccessControlDto>), StatusCodes.Status200OK)]
        public Task<IActionResult> GetAll([FromQuery] GrievanceStageAccessControlQueryParameters queryParameters, CancellationToken cancellationToken)
            => this.ExecuteGetAllPaged(_service, queryParameters, _logger, cancellationToken);

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(GrievanceStageAccessControlDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
            => this.ExecuteGetById(_service, id, _logger, cancellationToken);

        [HttpGet("check-access")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CheckAccess([FromQuery] int stageId, [FromQuery] int? userId, CancellationToken cancellationToken)
        {
            if (stageId <= 0)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid Stage ID provided."));
            }

            try
            {
                var effectiveUserId = userId ?? GetUserId();
                if (effectiveUserId <= 0)
                {
                    return Unauthorized(ApiResponse<bool>.ErrorResponse("Valid user identification is required."));
                }

                var hasAccess = await _service.HasAccessToStageAsync(stageId, effectiveUserId, cancellationToken);
                return Ok(ApiResponse<bool>.SuccessResponse(hasAccess));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckAccess failed for StageId: {StageId}, UserId: {UserId}", stageId, userId);
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    ApiResponse<bool>.ErrorResponse("An error occurred while checking stage access."));
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<GrievanceStageAccessControlDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<GrievanceStageAccessControlDto>), StatusCodes.Status409Conflict)]
        public Task<IActionResult> Create([FromBody] CreateGrievanceStageAccessControlDto createDto, CancellationToken cancellationToken)
            => this.ExecuteCreate(_service, createDto, _logger, cancellationToken);

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<GrievanceStageAccessControlDto>), StatusCodes.Status200OK)]
        public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceStageAccessControlDto updateDto, CancellationToken cancellationToken)
            => this.ExecuteUpdate(_service, id, updateDto, _logger, cancellationToken);

        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse<GrievanceStageAccessControlDto>), StatusCodes.Status200OK)]
        public Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
            => this.ExecuteDelete(_service, id, _logger, cancellationToken);

        [Authorize]
        [HttpDelete("{id}/purge")]
        public Task<IActionResult> Purge(int id, CancellationToken cancellationToken)
            => this.ExecuteForceDelete<GrievanceStageAccessControlEntity, int>(_cleanupService, _referenceValidationService, id, _logger, cancellationToken);

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            {
                return 1;
            }
            return id;
        }
    }
}