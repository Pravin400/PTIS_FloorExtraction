using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Api.Controllers.Payroll.Master;

/// <summary>
/// Controller for Municipal Payroll Blood Group Master CRUD operations
/// </summary>
[ApiController]
[Route("api/payroll/blood-group-master")]
public class PayrollBloodGroupMasterController : ControllerBase
{
    private readonly IPayrollBloodGroupMasterService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<PayrollBloodGroupMasterController> _logger;

    public PayrollBloodGroupMasterController(
        IPayrollBloodGroupMasterService service,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService,
        ILogger<PayrollBloodGroupMasterController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    /// <summary>Get all Payroll Blood Group Masters with filtering, sorting, and pagination</summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PayrollBloodGroupMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>Get Payroll Blood Group Master by ID</summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>Create a new Payroll Blood Group Master</summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreatePayrollBloodGroupMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>Update an existing Payroll Blood Group Master</summary>
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdatePayrollBloodGroupMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete a Payroll Blood Group Master directly from the database
    /// </summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>Permanently purge / force delete a Payroll Blood Group Master from the database</summary>
    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<PayrollBloodGroupMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
}
