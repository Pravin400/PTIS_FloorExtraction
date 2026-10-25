using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[ApiController]
[Route("api/asset-management/asset-grievance-details")]
[Authorize]
public class AssetGrievanceDetailsController : ControllerBase
{
    private readonly IAssetGrievanceDetailsService _service;
    private readonly ILogger<AssetGrievanceDetailsController> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;

    public AssetGrievanceDetailsController(
        IAssetGrievanceDetailsService service,
        ILogger<AssetGrievanceDetailsController> logger,
        ICurrentUserService currentUserService,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] AssetGrievanceDetailsQueryParameters qp, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllForUserAsync(qp, _currentUserService.GetCurrentUserId(), ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting grievance details");
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while processing your request.");
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetGrievanceDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByIdForUserAsync(id, _currentUserService.GetCurrentUserId(), ct);
            if (result == null)
                return NotFound();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting grievance detail with id {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while processing your request.");
        }
    }

    /// <summary>Dashboard widget: queue counts by workflow stage (total, correction/verification/approval pending, approved, rejected, closed).</summary>
    [HttpGet("dashboard-stats")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var stats = await _service.GetDashboardStatsAsync(_currentUserService.GetCurrentUserId(), ct);
        return Ok(new ApiResponse<AssetGrievanceDashboardStatsDto> { Success = true, Message = "Dashboard stats retrieved successfully", Items = stats });
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status409Conflict)]
    public Task<IActionResult> Create([FromForm] CreateAssetGrievanceDetailsDto dto, CancellationToken ct)
        => this.ExecuteCreate(_service, dto, _logger, ct);

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> Update(int id, [FromForm] UpdateAssetGrievanceDetailsDto dto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, dto, _logger, ct);

    [HttpPost("{id}/correction")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> SubmitCorrection(int id, [FromBody] SubmitAssetGrievanceCorrectionDto dto, CancellationToken ct)
        => RunTransition(() => _service.SubmitCorrectionAsync(id, dto, _currentUserService.GetCurrentUserId(), ct), "Correction submitted successfully");

    [HttpPost("{id}/forward")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Forward(int id, [FromBody] AssetGrievanceWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.ForwardAsync(id, dto, _currentUserService.GetCurrentUserId(), ct), "Forwarded successfully");

    [HttpPost("{id}/verify")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Verify(int id, [FromBody] AssetGrievanceWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.VerifyAsync(id, dto?.Remarks, _currentUserService.GetCurrentUserId(), ct), "Verified successfully");

    [HttpPost("{id}/send-back")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> SendBack(int id, [FromBody] AssetGrievanceReasonActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.SendBackAsync(id, dto.Reason, _currentUserService.GetCurrentUserId(), ct), "Sent back successfully");

    [HttpPost("{id}/approve")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Approve(int id, [FromBody] AssetGrievanceWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.ApproveAsync(id, dto?.Remarks, _currentUserService.GetCurrentUserId(), ct), "Approved successfully");

    [HttpPost("{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Reject(int id, [FromBody] AssetGrievanceReasonActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.RejectAsync(id, dto.Reason, _currentUserService.GetCurrentUserId(), ct), "Rejected successfully");

    [HttpPost("{id}/close")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Close(int id, [FromBody] AssetGrievanceWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.CloseAsync(id, dto?.Remarks, _currentUserService.GetCurrentUserId(), ct), "Closed successfully");

    [HttpPost("{id}/reopen")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Reopen(int id, [FromBody] AssetGrievanceReasonActionDto dto, CancellationToken ct)
        => RunTransition(() => _service.ReopenAsync(id, dto.Reason, _currentUserService.GetCurrentUserId(), ct), "Reopened successfully");

    [HttpGet("{id}/action-history")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetGrievanceActionHistoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActionHistory(int id, CancellationToken ct)
    {
        var history = await _service.GetActionHistoryAsync(id, ct);
        return Ok(new ApiResponse<List<AssetGrievanceActionHistoryDto>> { Success = true, Message = "Action history retrieved successfully", Items = history });
    }

    [HttpGet("{id}/correction-details")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetGrievanceCorrectionDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCorrectionDetails(int id, CancellationToken ct)
    {
        var details = await _service.GetCorrectionDetailsAsync(id, ct);
        return Ok(new ApiResponse<List<AssetGrievanceCorrectionDetailDto>> { Success = true, Message = "Correction details retrieved successfully", Items = details });
    }

    [HttpPost("{id}/media-corrections")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceMediaCorrectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitMediaCorrection(int id, [FromBody] SubmitAssetGrievanceMediaCorrectionDto dto, CancellationToken ct)
    {
        var result = await _service.SubmitMediaCorrectionAsync(id, dto, _currentUserService.GetCurrentUserId(), ct);
        return Ok(new ApiResponse<AssetGrievanceMediaCorrectionDto> { Success = true, Message = "Media correction proposed successfully", Items = result });
    }

    [HttpGet("{id}/media-corrections")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetGrievanceMediaCorrectionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMediaCorrections(int id, CancellationToken ct)
    {
        var items = await _service.GetMediaCorrectionsAsync(id, ct);
        return Ok(new ApiResponse<List<AssetGrievanceMediaCorrectionDto>> { Success = true, Message = "Media corrections retrieved successfully", Items = items });
    }

    [HttpDelete("{id}/media-corrections/{mediaCorrectionId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> WithdrawMediaCorrection(int id, int mediaCorrectionId, CancellationToken ct)
    {
        var ok = await _service.WithdrawMediaCorrectionAsync(id, mediaCorrectionId, _currentUserService.GetCurrentUserId(), ct);
        return ok
            ? Ok(new ApiResponse<object> { Success = true, Message = "Withdrawn successfully" })
            : NotFound();
    }

    [HttpDelete("{id}/purge")]
    public async Task<IActionResult> Purge(int id, CancellationToken ct)
    {
        await _service.PurgeChildrenAsync(id, ct);
        return await this.ExecuteForceDelete<AssetGrievanceDetailsEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
    }

    private async Task<IActionResult> RunTransition(Func<Task<AssetGrievanceDetailsDto?>> action, string successMessage)
    {
        var result = await action();
        if (result == null)
            return NotFound();
        return Ok(new ApiResponse<AssetGrievanceDetailsDto> { Success = true, Message = successMessage, Items = result });
    }
}