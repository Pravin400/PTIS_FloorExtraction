using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertyCertificate;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller for managing background tax recalculation jobs (Pause, Resume, Cancel/Terminate, and Status).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaxCalculationJobController : ControllerBase
{
    private readonly ITaxCalculationJobCoordinator _coordinator;
    private readonly ITaxCalculationNotifier _notifier;
    private readonly ILogger<TaxCalculationJobController> _logger;

    public TaxCalculationJobController(
        ITaxCalculationJobCoordinator coordinator,
        ITaxCalculationNotifier notifier,
        ILogger<TaxCalculationJobController> logger)
    {
        _coordinator = coordinator;
        _notifier = notifier;
        _logger = logger;
    }

    /// <summary>
    /// Pauses an active background tax recalculation job.
    /// </summary>
    [HttpPost("{jobId}/pause")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PauseJob(string jobId)
    {
        var job = _coordinator.GetJob(jobId);
        if (job == null)
        {
            return NotFound(new { success = false, message = $"Job '{jobId}' not found or already completed." });
        }

        if (!CanAccessJob(job, out var authResult))
        {
            return authResult!;
        }

        var paused = _coordinator.PauseJob(jobId);
        if (!paused)
        {
            return BadRequest(new { success = false, message = $"Failed to pause job '{jobId}'." });
        }

        // Broadcast Paused status to all SignalR subscribers immediately
        await _notifier.NotifyProgressAsync(new TaxCalculationProgressDto
        {
            JobId = jobId,
            EntityType = job.EntityType,
            SocietyDetailId = job.SocietyDetailId,
            WingDetailId = job.WingDetailId,
            TotalUnits = job.TotalUnits,
            ProcessedUnits = job.ProcessedUnits,
            CurrentPropertyId = job.CurrentPropertyId,
            Status = "Paused",
            StatusMessage = "Tax recalculation paused by user."
        });

        _logger.LogInformation("Job {JobId} paused via API", jobId);
        return Ok(new
        {
            success = true,
            jobId,
            status = "Paused",
            message = "Tax calculation paused successfully."
        });
    }

    /// <summary>
    /// Resumes a paused background tax recalculation job.
    /// </summary>
    [HttpPost("{jobId}/resume")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResumeJob(string jobId)
    {
        var job = _coordinator.GetJob(jobId);
        if (job == null)
        {
            return NotFound(new { success = false, message = $"Job '{jobId}' not found or already completed." });
        }

        if (!CanAccessJob(job, out var authResult))
        {
            return authResult!;
        }

        var resumed = _coordinator.ResumeJob(jobId);
        if (!resumed)
        {
            return BadRequest(new { success = false, message = $"Failed to resume job '{jobId}'." });
        }

        // Broadcast Resumed (Processing) status to all SignalR subscribers immediately
        await _notifier.NotifyProgressAsync(new TaxCalculationProgressDto
        {
            JobId = jobId,
            EntityType = job.EntityType,
            SocietyDetailId = job.SocietyDetailId,
            WingDetailId = job.WingDetailId,
            TotalUnits = job.TotalUnits,
            ProcessedUnits = job.ProcessedUnits,
            CurrentPropertyId = job.CurrentPropertyId,
            Status = "Processing",
            StatusMessage = $"Resuming tax calculation for {job.TotalUnits} units..."
        });

        _logger.LogInformation("Job {JobId} resumed via API", jobId);
        return Ok(new
        {
            success = true,
            jobId,
            status = "Processing",
            message = "Tax calculation resumed successfully."
        });
    }

    /// <summary>
    /// Cancels and terminates an active or paused background tax recalculation job.
    /// </summary>
    [HttpPost("{jobId}/cancel")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelJob(string jobId)
    {
        var job = _coordinator.GetJob(jobId);
        if (job == null)
        {
            return NotFound(new { success = false, message = $"Job '{jobId}' not found or already completed." });
        }

        if (!CanAccessJob(job, out var authResult))
        {
            return authResult!;
        }

        var cancelled = _coordinator.CancelJob(jobId);
        if (!cancelled)
        {
            return BadRequest(new { success = false, message = $"Failed to cancel job '{jobId}'." });
        }

        // Broadcast immediate Cancelling progress; background worker emits authoritative NotifyCompletedAsync with final counts
        await _notifier.NotifyProgressAsync(new TaxCalculationProgressDto
        {
            JobId = jobId,
            EntityType = job.EntityType,
            SocietyDetailId = job.SocietyDetailId,
            WingDetailId = job.WingDetailId,
            TotalUnits = job.TotalUnits,
            ProcessedUnits = job.ProcessedUnits,
            CurrentPropertyId = job.CurrentPropertyId,
            Status = "Cancelling",
            StatusMessage = "Cancellation requested by user..."
        });

        _logger.LogInformation("Job {JobId} cancellation requested via API", jobId);
        return Accepted(new
        {
            success = true,
            jobId,
            status = "Cancelling",
            message = "Tax calculation cancellation requested successfully."
        });
    }

    /// <summary>
    /// Gets the current status of a background tax recalculation job.
    /// </summary>
    [HttpGet("{jobId}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetJobStatus(string jobId)
    {
        var job = _coordinator.GetJob(jobId);
        if (job == null)
        {
            return NotFound(new { success = false, message = $"Job '{jobId}' not found or completed." });
        }

        if (!CanAccessJob(job, out var authResult))
        {
            return authResult!;
        }

        return Ok(new
        {
            success = true,
            jobId = job.JobId,
            entityType = job.EntityType,
            societyDetailId = job.SocietyDetailId,
            wingDetailId = job.WingDetailId,
            totalUnits = job.TotalUnits,
            processedUnits = job.ProcessedUnits,
            status = job.Status.ToString(),
            isPaused = job.IsPaused,
            isCancelled = job.IsCancellationRequested
        });
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            throw new UnauthorizedAccessException("Valid user identification is required.");
        return id;
    }

    private bool CanAccessJob(ITaxCalculationJobContext job, out IActionResult? failureResult)
    {
        int userId;
        try
        {
            userId = GetCurrentUserId();
        }
        catch (UnauthorizedAccessException ex)
        {
            failureResult = Unauthorized(new { success = false, message = ex.Message });
            return false;
        }

        // Fail-closed authorization:
        // 1. If CreatedByUserId <= 0 (unassigned or missing ownership), only an Admin can manage/access it.
        // 2. If CreatedByUserId > 0, only the creator or an Admin can manage/access it.
        bool isAdmin = User.IsInRole("Admin");
        if (job.CreatedByUserId <= 0)
        {
            if (!isAdmin)
            {
                failureResult = StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "You do not have permission to access or manage this recalculation job." });
                return false;
            }
        }
        else if (job.CreatedByUserId != userId && !isAdmin)
        {
            failureResult = StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "You do not have permission to access or manage this recalculation job." });
            return false;
        }

        failureResult = null;
        return true;
    }
}
