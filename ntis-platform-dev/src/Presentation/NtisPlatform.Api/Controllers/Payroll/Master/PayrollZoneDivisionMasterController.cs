using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Api.Controllers.Payroll.Master;

/// <summary>
/// Controller for Municipal Payroll Zone Division Master CRUD operations
/// </summary>
[ApiController]
[Route("api/payroll/zone-division-master")]
public class PayrollZoneDivisionMasterController : ControllerBase
{
    private readonly IPayrollZoneDivisionMasterService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<PayrollZoneDivisionMasterController> _logger;

    public PayrollZoneDivisionMasterController(
        IPayrollZoneDivisionMasterService service,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService,
        ILogger<PayrollZoneDivisionMasterController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Payroll Zone Division Masters with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PayrollZoneDivisionMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Payroll Zone Division Master by ID
    /// </summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create a new Payroll Zone Division Master
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreatePayrollZoneDivisionMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update an existing Payroll Zone Division Master
    /// </summary>
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdatePayrollZoneDivisionMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete a Payroll Zone Division Master directly from the database
    /// </summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>
    /// Permanently purge / force delete a Payroll Zone Division Master from the database
    /// </summary>
    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<PayrollZoneDivisionMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
}
