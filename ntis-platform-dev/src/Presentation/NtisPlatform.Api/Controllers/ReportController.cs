using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IReportDefinitionService _service;
    private readonly ReportDefinitionCacheService _cache;
    private readonly ReportDefinitionCacheWarmupService _cacheWarmup;
    private readonly ITokenService _tokenService;
    private readonly ILogger<ReportController> _logger;

    public ReportController(
        IReportDefinitionService service,
        ReportDefinitionCacheService cache,
        ReportDefinitionCacheWarmupService cacheWarmup,
        ITokenService tokenService,
        ILogger<ReportController> logger)
    {
        _service = service;
        _cache = cache;
        _cacheWarmup = cacheWarmup;
        _tokenService = tokenService;
        _logger = logger;
    }

    // ─── Report Definition CRUD & Admin Catalog ─────────────────────────────────

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] ReportDefinitionQueryParameters qp, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, qp, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpGet("admin/catalog")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAdminCatalog(
        [FromServices] IReportingRepository<ReportDefinitionEntity, int> reportDefRepo,
        [FromServices] IReportingRepository<ReportModuleEntity, int> moduleRepo,
        [FromServices] IReportingRepository<TenantEntity, int> tenantRepo,
        [FromServices] IReportingRepository<HtmlReportTemplateEntity, long> templateRepo,
        CancellationToken ct)
    {
        var definitions = await reportDefRepo.GetQueryable().AsNoTracking()
            .OrderBy(r => r.TenantId)
            .ThenBy(r => r.SortOrder)
            .ThenBy(r => r.ReportName)
            .ToListAsync(ct);

        var modules = await moduleRepo.GetQueryable().AsNoTracking().ToDictionaryAsync(m => m.Id, m => m.Name, ct);
        var tenants = await tenantRepo.GetQueryable().AsNoTracking().ToDictionaryAsync(t => t.OrganizationId, t => t.Name, ct);
        var templates = await templateRepo.GetQueryable().AsNoTracking()
            .Include(t => t.Versions)
            .ToListAsync(ct);

        var templateByDef = templates.GroupBy(t => t.ReportDefinitionId)
            .ToDictionary(g => g.Key, g => g.First());

        var result = definitions.Select(d =>
        {
            templateByDef.TryGetValue(d.Id, out var tmpl);
            var publishedVer = tmpl?.Versions.FirstOrDefault(v => v.Status == "Published");
            var draftVer = tmpl?.Versions.OrderByDescending(v => v.VersionNo).FirstOrDefault(v => v.Status == "Draft");

            string status = "No Template";
            if (publishedVer != null) status = $"Published (v{publishedVer.VersionNo})";
            else if (draftVer != null) status = $"Draft (v{draftVer.VersionNo})";

            return new
            {
                Id = d.Id,
                ReportCode = d.ReportCode,
                ReportName = d.ReportName,
                TenantId = d.TenantId,
                TenantName = d.TenantId.HasValue && tenants.TryGetValue(d.TenantId.Value, out var tName) ? tName : "Unassigned / Global",
                ModuleId = d.ModuleId,
                ModuleName = d.ModuleId.HasValue && modules.TryGetValue(d.ModuleId.Value, out var mName) ? mName : "General",
                DataProviderCode = d.DataProviderCode,
                TemplateFile = d.TemplateFile,
                Description = d.Description,
                IsActive = d.IsActive,
                SortOrder = d.SortOrder,
                HtmlTemplateId = tmpl?.Id,
                TemplateStatus = status,
                PublishedVersionId = publishedVer?.Id,
                DraftVersionId = draftVer?.Id
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ReportAdmin,SuperAdmin")]
    public async Task<IActionResult> Create(
        [FromServices] IReportingRepository<ReportDefinitionEntity, int> reportDefRepo,
        [FromServices] IReportingUnitOfWork uow,
        [FromBody] CreateReportDefinitionDto dto,
        CancellationToken ct)
    {
        var exists = await reportDefRepo.GetQueryable().AnyAsync(r => r.ReportCode == dto.ReportCode && r.TenantId == dto.TenantId, ct);
        if (exists) return Conflict(new { message = $"Report with code '{dto.ReportCode}' already exists for this tenant." });

        var entity = new ReportDefinitionEntity
        {
            ReportCode = dto.ReportCode.Trim(),
            ReportName = dto.ReportName.Trim(),
            TenantId = dto.TenantId,
            ModuleId = dto.ModuleId,
            Description = dto.Description ?? string.Empty,
            TemplateFile = string.IsNullOrWhiteSpace(dto.TemplateFile) ? $"{dto.ReportCode.Trim()}.html" : dto.TemplateFile.Trim(),
            DataProviderCode = string.IsNullOrWhiteSpace(dto.DataProviderCode) ? "UnassignedReportDataProvider" : dto.DataProviderCode.Trim(),
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive,
            CreatedDate = DateTime.UtcNow
        };

        await reportDefRepo.AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        _cache.Invalidate();

        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,ReportAdmin,SuperAdmin")]
    public async Task<IActionResult> Update(
        int id,
        [FromServices] IReportingRepository<ReportDefinitionEntity, int> reportDefRepo,
        [FromServices] IReportingUnitOfWork uow,
        [FromBody] UpdateReportDefinitionDto dto,
        CancellationToken ct)
    {
        var entity = await reportDefRepo.GetQueryable().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity == null) return NotFound();

        entity.ReportName = dto.ReportName.Trim();
        entity.TenantId = dto.TenantId;
        entity.ModuleId = dto.ModuleId;
        entity.Description = dto.Description ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(dto.DataProviderCode))
            entity.DataProviderCode = dto.DataProviderCode.Trim();
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedDate = DateTime.UtcNow;

        await reportDefRepo.UpdateAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        _cache.Invalidate();

        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,ReportAdmin,SuperAdmin")]
    public async Task<IActionResult> Delete(
        int id,
        [FromServices] IReportingRepository<ReportDefinitionEntity, int> reportDefRepo,
        [FromServices] IReportingUnitOfWork uow,
        CancellationToken ct)
    {
        var entity = await reportDefRepo.GetQueryable().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity == null) return NotFound();

        entity.IsActive = false;
        entity.UpdatedDate = DateTime.UtcNow;
        await reportDefRepo.UpdateAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        _cache.Invalidate();

        return Ok(new { message = "Report deactivated." });
    }


    // ─── SignalR Hub Token ───────────────────────────────────────────────────────

    /// <summary>
    /// Issues a short-lived (5 min) hub-only JWT (scope="report-hub") for the SignalR WebSocket handshake.
    /// Same signing key/issuer/audience as every token; the scope claim is what the ReportHub policy checks.
    /// </summary>
    [HttpGet("hub-token")]
    public IActionResult HubToken()
    {
        var hubToken = _tokenService.GenerateHubToken(GetUserId(), expiresInMinutes: 5);
        return Ok(new { hubToken });
    }

    // ─── Cache Management ────────────────────────────────────────────────────────

    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    [HttpPost("cache/invalidate")]
    public async Task<IActionResult> InvalidateCache(CancellationToken ct)
    {
        _cache.Invalidate();
        await _cacheWarmup.WarmUpAsync(ct);
        return Ok(new { message = "Report definition cache reloaded." });
    }


    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
        {
            throw new UnauthorizedAccessException("Valid user identification is required.");
        }
        return id;
    }
}
