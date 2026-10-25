using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Api.Controllers.WaterBill.Master;

/// <summary>
/// Canonical WaterBill PenaltyRuleMasterController.
/// Uses clean architecture IWaterPenaltyRuleService, standard CrudControllerExtensions,
/// strict [Authorize] protection, and authenticated user identity extraction for audit trails.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PenaltyRuleMasterController : ControllerBase
{
    private readonly IWaterPenaltyRuleService _service;
    private readonly ILogger<PenaltyRuleMasterController> _logger;

    public PenaltyRuleMasterController(
        IWaterPenaltyRuleService service,
        ILogger<PenaltyRuleMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] WaterPenaltyRuleQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(long id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWaterPenaltyRuleDto createDto, CancellationToken ct)
    {
        createDto.CreatedBy = GetUserId();
        return await this.ExecuteCreate(_service, createDto, _logger, ct);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateWaterPenaltyRuleDto updateDto, CancellationToken ct)
    {
        updateDto.UpdatedBy = GetUserId();
        return await this.ExecuteUpdate(_service, id, updateDto, _logger, ct);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] WaterPenaltyRuleStatusDto statusDto, CancellationToken ct)
    {
        var success = await _service.UpdateStatusAsync(id, statusDto.IsActive, GetUserId(), ct);
        if (!success)
            return NotFound(new ApiResponse<bool> { Success = false, Message = $"Penalty rule with ID {id} not found." });

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Items = true,
            Message = $"Penalty rule {(statusDto.IsActive ? "activated" : "deactivated")} successfully."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var userId = GetUserId();
        var success = await _service.DeleteAsync(id, userId, ct);
        if (!success)
            return NotFound(new ApiResponse<bool> { Success = false, Message = $"Penalty rule with ID {id} not found." });

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Items = true,
            Message = "Record marked for deletion"
        });
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] WaterPenaltyRuleValidationRequestDto request, CancellationToken ct)
    {
        var result = await _service.ValidateConflictAsync(request, ct);
        return Ok(new ApiResponse<WaterPenaltyRuleValidationResultDto>
        {
            Success = result.IsValid,
            Items = result,
            Message = result.IsValid ? "Penalty rule configuration is valid." : "Penalty rule has validation errors or conflicts."
        });
    }

    private int GetUserId()
    {
        string[] idClaimTypes = [ClaimTypes.NameIdentifier, "userId", "sub", "id", "uid"];
        foreach (var type in idClaimTypes)
        {
            var value = User.FindFirst(type)?.Value;
            if (!string.IsNullOrEmpty(value) && int.TryParse(value, out var id) && id > 0)
            {
                return id;
            }
        }

        var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(nameClaim) && int.TryParse(nameClaim, out var nameId) && nameId > 0)
        {
            return nameId;
        }

        throw new UnauthorizedAccessException("Valid user identification is required.");
    }

    private string GetCurrentUserName()
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(userName))
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(idClaim))
            {
                userName = idClaim;
            }
            else
            {
                throw new UnauthorizedAccessException("Valid user identity is required.");
            }
        }

        return userName;
    }
}
