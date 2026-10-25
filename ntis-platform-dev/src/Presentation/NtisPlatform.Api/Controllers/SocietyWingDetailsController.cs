using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master.SocietyWingDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SocietyWingDetailsController : ControllerBase
{
    private readonly ISocietyWingDetailsService _service;
    private readonly ILogger<SocietyWingDetailsController> _logger;

    public SocietyWingDetailsController(ISocietyWingDetailsService service, ILogger<SocietyWingDetailsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] SocietyWingDetailsQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Retrieves properties by SocietyDetailId and PropertyNo from PropertyMast.
    /// Returns PropertyID, SocietyDetailId, concatenated PropertyNo-PartitionNo, OwnerName, OccupierName.
    /// </summary>
    [HttpGet("PropertyDetails")]
    [ProducesResponseType(typeof(PagedResult<WingPropertyDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPropertyDetails([FromQuery] WingPropertyDetailsQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllAsync(queryParameters, ct);
            return Ok(result);
        }
        catch (NtisPlatform.Application.Exceptions.FilterValidationException ex)
        {
            _logger.LogWarning(ex, "Filter validation failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property details by SocietyDetailId and PropertyNo");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<WingPropertyDetailsDto>
            {
                Success = false,
                Message = "An error occurred while processing your request."
            });
        }
    }

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateSocietyWingDetailsDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateSocietyWingDetailsDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
