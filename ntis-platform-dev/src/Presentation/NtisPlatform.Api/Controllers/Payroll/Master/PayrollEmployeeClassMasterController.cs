using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Api.Controllers.Payroll.Master;

/// <summary>
/// Controller for Municipal Payroll Employee Class Master CRUD operations
/// </summary>
[ApiController]
[Route("api/payroll/employee-class-master")]
public class PayrollEmployeeClassMasterController : ControllerBase
{
    private readonly IPayrollEmployeeClassMasterService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<PayrollEmployeeClassMasterController> _logger;

    public PayrollEmployeeClassMasterController(
        IPayrollEmployeeClassMasterService service,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService,
        ILogger<PayrollEmployeeClassMasterController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    /// <summary>Get all Payroll Employee Class Masters with filtering, sorting, and pagination</summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PayrollEmployeeClassMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>Get Payroll Employee Class Master by ID</summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>Create a new Payroll Employee Class Master</summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreatePayrollEmployeeClassMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>Update an existing Payroll Employee Class Master</summary>
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdatePayrollEmployeeClassMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>Delete a Payroll Employee Class Master directly from the database</summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>Permanently purge / force delete a Payroll Employee Class Master from the database</summary>
    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<PayrollEmployeeClassMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
}
