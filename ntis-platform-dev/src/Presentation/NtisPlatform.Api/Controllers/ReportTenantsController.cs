using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportTenantsController : ControllerBase
{
    private readonly IReportingRepository<TenantEntity, int> _tenantRepo;
    private readonly IReportingRepository<ReportDefinitionEntity, int> _reportDefRepo;
    private readonly IReportingRepository<HtmlReportTemplateEntity, long> _templateRepo;
    private readonly IReportingUnitOfWork _uow;

    public ReportTenantsController(
        IReportingRepository<TenantEntity, int> tenantRepo,
        IReportingRepository<ReportDefinitionEntity, int> reportDefRepo,
        IReportingRepository<HtmlReportTemplateEntity, long> templateRepo,
        IReportingUnitOfWork uow)
    {
        _tenantRepo = tenantRepo;
        _reportDefRepo = reportDefRepo;
        _templateRepo = templateRepo;
        _uow = uow;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ReportTenantDto>>> GetAll(CancellationToken ct)
    {
        var tenants = await _tenantRepo.GetQueryable().AsNoTracking()
            .OrderBy(t => t.OrganizationId)
            .ToListAsync(ct);

        var reportCounts = await _reportDefRepo.GetQueryable().AsNoTracking()
            .Where(r => r.TenantId != null)
            .GroupBy(r => r.TenantId!.Value)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, ct);

        var result = tenants.Select(t => new ReportTenantDto
        {
            OrganizationId = t.OrganizationId,
            Name = t.Name,
            IsActive = t.IsActive,
            ReportsCount = reportCounts.TryGetValue(t.OrganizationId, out var count) ? count : 0,
            CreatedDate = t.CreatedDate,
            UpdatedDate = t.UpdatedDate
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{organizationId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ReportTenantDto>> GetById(int organizationId, CancellationToken ct)
    {
        var tenant = await _tenantRepo.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(t => t.OrganizationId == organizationId, ct);

        if (tenant == null) return NotFound();

        var reportsCount = await _reportDefRepo.GetQueryable().AsNoTracking()
            .CountAsync(r => r.TenantId == organizationId, ct);

        return Ok(new ReportTenantDto
        {
            OrganizationId = tenant.OrganizationId,
            Name = tenant.Name,
            IsActive = tenant.IsActive,
            ReportsCount = reportsCount,
            CreatedDate = tenant.CreatedDate,
            UpdatedDate = tenant.UpdatedDate
        });
    }

    [HttpPost]
    public async Task<ActionResult<ReportTenantDto>> Create([FromBody] CreateReportTenantDto request, CancellationToken ct)
    {
        if (request.OrganizationId <= 0)
        {
            return BadRequest(new { message = "OrganizationId must be a positive integer." });
        }

        if (await _tenantRepo.GetQueryable().AnyAsync(t => t.OrganizationId == request.OrganizationId, ct))
        {
            return Conflict(new { message = $"Tenant with OrganizationId {request.OrganizationId} already exists." });
        }

        var tenant = new TenantEntity
        {
            OrganizationId = request.OrganizationId,
            Name = request.Name.Trim(),
            IsActive = request.IsActive,
            CreatedDate = DateTime.UtcNow
        };

        await _tenantRepo.AddAsync(tenant, ct);
        await _uow.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { organizationId = tenant.OrganizationId }, new ReportTenantDto
        {
            OrganizationId = tenant.OrganizationId,
            Name = tenant.Name,
            IsActive = tenant.IsActive,
            ReportsCount = 0,
            CreatedDate = tenant.CreatedDate,
            UpdatedDate = tenant.UpdatedDate
        });
    }

    [HttpPut("{organizationId:int}")]
    public async Task<ActionResult<ReportTenantDto>> Update(int organizationId, [FromBody] UpdateReportTenantDto request, CancellationToken ct)
    {
        var tenant = await _tenantRepo.GetQueryable().FirstOrDefaultAsync(t => t.OrganizationId == organizationId, ct);
        if (tenant == null) return NotFound();

        tenant.Name = request.Name.Trim();
        tenant.IsActive = request.IsActive;
        tenant.UpdatedDate = DateTime.UtcNow;

        await _tenantRepo.UpdateAsync(tenant, ct);
        await _uow.SaveChangesAsync(ct);

        var count = await _reportDefRepo.GetQueryable().AsNoTracking().CountAsync(r => r.TenantId == organizationId, ct);

        return Ok(new ReportTenantDto
        {
            OrganizationId = tenant.OrganizationId,
            Name = tenant.Name,
            IsActive = tenant.IsActive,
            ReportsCount = count,
            CreatedDate = tenant.CreatedDate,
            UpdatedDate = tenant.UpdatedDate
        });
    }

    [HttpDelete("{organizationId:int}")]
    public async Task<IActionResult> Delete(int organizationId, CancellationToken ct)
    {
        var tenant = await _tenantRepo.GetQueryable().FirstOrDefaultAsync(t => t.OrganizationId == organizationId, ct);
        if (tenant == null) return NotFound();

        var hasTemplates = await _templateRepo.GetQueryable().AnyAsync(t => t.OrganizationId == organizationId, ct);
        var hasReports = await _reportDefRepo.GetQueryable().AnyAsync(r => r.TenantId == organizationId, ct);

        if (hasTemplates || hasReports)
        {
            // Soft-deactivate if reports exist
            tenant.IsActive = false;
            tenant.UpdatedDate = DateTime.UtcNow;
            await _tenantRepo.UpdateAsync(tenant, ct);
            await _uow.SaveChangesAsync(ct);
            return Ok(new { message = "Tenant has existing reports/templates; status has been set to Inactive." });
        }

        await _tenantRepo.DeleteAsync(tenant, ct);
        await _uow.SaveChangesAsync(ct);
        return NoContent();
    }
}
