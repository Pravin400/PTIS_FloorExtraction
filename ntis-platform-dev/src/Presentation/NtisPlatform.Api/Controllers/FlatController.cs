using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller for managing Flat / Property Unit records, including validating PropertyId, SocietyDetailsId,
/// WingDetailsId, and ensuring unique Flat/Shop numbers before updates.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FlatController : ControllerBase
{
    private readonly IFlatService _service;
    private readonly ILogger<FlatController> _logger;

    public FlatController(IFlatService service, ILogger<FlatController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a specific flat by its Property ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(FlatDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Updates a Flat using input parameters from the request payload (PropertyId, SocietyDetailsId, WingDetailsId, FlatShopNumber).
    /// </summary>
    [HttpPut("update-flat")]
    [ProducesResponseType(typeof(ApiResponse<FlatDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public Task<IActionResult> UpdateFlat([FromBody] UpdateFlatDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, updateDto.PropertyId, updateDto, _logger, ct);
}
