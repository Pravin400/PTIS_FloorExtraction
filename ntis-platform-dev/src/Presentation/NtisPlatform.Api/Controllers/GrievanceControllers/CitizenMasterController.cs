using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;
/// <summary>
/// Controller for Citizen Master CRUD and lookup operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CitizenMasterController : ControllerBase
{
    private readonly ICitizenMasterService _service;
    private readonly ILogger<CitizenMasterController> _logger;

    public CitizenMasterController(ICitizenMasterService service, ILogger<CitizenMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Citizens with filtering, sorting, and pagination (Administrative use)
    /// </summary>
    [HttpGet]
    [Authorize]
    public Task<IActionResult> GetAll([FromQuery] CitizenMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Citizen by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Get Citizen by Mobile Number (Allows anonymous lookup during grievance filing)
    /// </summary>
    [HttpGet("by-mobile/{mobileNo}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByMobileNo(string mobileNo, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByMobileNoAsync(mobileNo, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Citizen with mobile number '{mobileNo}' not found." });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get citizen by mobile number {MobileNo}", mobileNo);
            return StatusCode(500, new { message = "An error occurred while retrieving citizen details." });
        }
    }

    /// <summary>
    /// Register a new Citizen (Allows anonymous access during grievance filing before OTP verification)
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public Task<IActionResult> Create([FromBody] CreateCitizenMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update an existing Citizen
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    public Task<IActionResult> Update(int id, [FromBody] UpdateCitizenMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete / Deactivate a Citizen (Administrative use)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
