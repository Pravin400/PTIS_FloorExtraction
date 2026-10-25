using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Api.Controllers.Payroll.Master;

/// <summary>
/// Controller for Municipal Payroll Village Master CRUD operations
/// </summary>
[ApiController]
[Route("api/payroll/village-master")]
public class PayrollVillageMasterController : ControllerBase
{
    private readonly IPayrollVillageMasterService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<PayrollVillageMasterController> _logger;

    public PayrollVillageMasterController(
        IPayrollVillageMasterService service,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService,
        ILogger<PayrollVillageMasterController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Payroll Village Masters with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PayrollVillageMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Payroll Village Master by ID
    /// </summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create a new Payroll Village Master
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreatePayrollVillageMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update an existing Payroll Village Master
    /// </summary>
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdatePayrollVillageMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete a Payroll Village Master directly from the database
    /// </summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>
    /// Permanently purge / force delete a Payroll Village Master from the database
    /// </summary>
    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<PayrollVillageMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
}
