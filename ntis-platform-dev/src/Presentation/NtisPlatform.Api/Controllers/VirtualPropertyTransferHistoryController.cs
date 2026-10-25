using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller for virtual property transfer operations.
/// Supports transferring virtual properties and their sub-properties within the same ward (self-ward)
/// or to another ward (cross-ward).
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class VirtualPropertyTransferHistoryController : ControllerBase
{
    private readonly IVirtualPropertyTransferHistoryService _service;
    private readonly ILogger<VirtualPropertyTransferHistoryController> _logger;

    public VirtualPropertyTransferHistoryController(
        IVirtualPropertyTransferHistoryService service,
        ILogger<VirtualPropertyTransferHistoryController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Transfers a virtual property and its sub-properties to a target property (self-ward or another ward).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<VirtualPropertyTransferHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VirtualPropertyTransferHistoryDto>), StatusCodes.Status400BadRequest)]
    public Task<IActionResult> Create([FromBody] CreateVirtualPropertyTransferHistoryDto createDto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return Task.FromResult<IActionResult>(BadRequest(ModelState));
        }

        return this.ExecuteCreate(_service, createDto, _logger, ct);
    }

    /// <summary>
    /// Transfers multiple virtual properties in batch.
    /// </summary>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(ApiResponse<List<VirtualPropertyTransferHistoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<VirtualPropertyTransferHistoryDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchTransfer([FromBody] BatchTransferRequestDto request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.BatchTransferAsync(request, ct);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Retrieves virtual property transfer history matching filter criteria (WardId, PropertyNo, PartitionNo). Matches WardId and PropertyNo against either source or transferred properties.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<List<VirtualPropertyTransferHistoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetHistory([FromQuery] GetVirtualPropertyTransferHistoryRequestDto request, CancellationToken ct)
    {
        var result = await _service.GetHistoryAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves paged virtual property transfer history records.
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] VirtualPropertyTransferHistoryQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Retrieves a transfer history record by ID.
    /// </summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Deletes a transfer history record by ID.
    /// </summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
