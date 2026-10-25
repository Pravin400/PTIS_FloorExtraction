using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller for managing GSMS ApplicationSettings using Generic Common CRUD Service
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApplicationSettingController : ControllerBase
{
    private readonly IApplicationSettingService _service;
    private readonly ILogger<ApplicationSettingController> _logger;

    public ApplicationSettingController(IApplicationSettingService service, ILogger<ApplicationSettingController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Gets application settings grouped by module with dynamic key-value properties.
    /// Supports optional filtering by moduleId.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? moduleId, CancellationToken ct)
    {
        var result = await _service.GetSettingsAsync(moduleId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Gets paginated application settings.
    /// </summary>
    [HttpGet("paged")]
    public Task<IActionResult> GetAllPaged([FromQuery] ApplicationSettingQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateApplicationSettingDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateApplicationSettingDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
