using System.Security.Cryptography;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Options;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using Ntis.Reporting.Rendering.Html;
using Ntis.Reporting.Rendering.Pdf;

namespace NtisPlatform.Infrastructure.Reporting.Html;

public sealed class HtmlReportService(
    ReportingDbContext db,
    ICurrentUserService currentUser,
    ICurrentTenantService currentTenant,
    IOptions<ReportingOptions> reportingOptions,
    IHtmlReportTemplateValidator validator,
    IReportDataExecutor executor,
    IHtmlReportDataAdapterRegistry adapters,
    ITokenService tokens,
    IDocumentApplicationService documents,
    IPdfRenderer? pdfRenderer = null,
    IHtmlTemplateRenderer? htmlRenderer = null,
    Microsoft.AspNetCore.Http.IHttpContextAccessor? httpContextAccessor = null) : IHtmlReportService
{
    private readonly ReportingOptions _options = reportingOptions.Value;
    private int OrganizationId => currentTenant.GetCurrentTenantId();

    private bool IsReportAdmin()
    {
        var user = httpContextAccessor?.HttpContext?.User;
        if (user is null) return false;
        return user.IsInRole("Admin") ||
               user.IsInRole("ReportAdmin") ||
               user.IsInRole("SuperAdmin") ||
               user.HasClaim(c => (c.Type == "scope" || c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role") &&
                   (c.Value.Equals("report-admin", StringComparison.OrdinalIgnoreCase) ||
                    c.Value.Equals("admin", StringComparison.OrdinalIgnoreCase) ||
                    c.Value.Equals("superadmin", StringComparison.OrdinalIgnoreCase)));
    }

    public async Task<IReadOnlyList<HtmlReportTemplateSummaryDto>> GetTemplatesAsync(CancellationToken ct = default)
    {
        var org = OrganizationId;
        var isReportAdmin = IsReportAdmin();
        var visibleDefinitions = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.IsActive && (x.TenantId == null || x.TenantId == org))
            .ToListAsync(ct);
        var definitionIds = visibleDefinitions.Select(x => x.Id).ToList();
        var definitions = visibleDefinitions.ToDictionary(x => x.Id);
        var candidateRows = await db.HtmlReportTemplates.AsNoTracking()
            .Where(x => x.IsActive
                && (x.OrganizationId == org || (x.OrganizationId == null && isReportAdmin))
                && definitionIds.Contains(x.ReportDefinitionId))
            .OrderBy(x => x.TemplateName).ToListAsync(ct);
        var candidateIds = candidateRows.Select(x => x.Id).ToList();
        var currentVersions = await db.HtmlReportTemplateVersions.AsNoTracking()
            .Where(x => candidateIds.Contains(x.TemplateId)
                && (x.Status == "Draft" || x.Status == "Published"))
            .Select(x => new { x.TemplateId, x.Id, x.VersionNo, x.Status })
            .ToListAsync(ct);
        var versionsByTemplate = currentVersions.ToLookup(x => x.TemplateId);
        var rows = candidateRows
            .GroupBy(x => ComparableCode(definitions[x.ReportDefinitionId].ReportCode))
            .Select(group => group
                .OrderByDescending(x => definitions[x.ReportDefinitionId].TenantId == org)
                .ThenByDescending(x => definitions[x.ReportDefinitionId].TenantId == null
                    && x.OrganizationId == null)
                .ThenByDescending(x => x.OrganizationId == org)
                .First())
            .OrderBy(x => definitions[x.ReportDefinitionId].SortOrder)
            .ThenBy(x => x.TemplateName)
            .ToList();
        var moduleIds = definitions.Values.Where(x => x.ModuleId.HasValue).Select(x => x.ModuleId!.Value).Distinct().ToList();
        var modules = await db.ReportModules.AsNoTracking().Where(x => moduleIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.Name, ct);
        return rows.Select(x =>
        {
            var definition = definitions[x.ReportDefinitionId];
            var versions = versionsByTemplate[x.Id];
            var published = versions.SingleOrDefault(v => v.Status == "Published");
            var draft = versions.Where(v => v.Status == "Draft").OrderByDescending(v => v.VersionNo).FirstOrDefault();
            return new HtmlReportTemplateSummaryDto(x.Id, definition.Id, definition.ReportCode, x.TemplateName,
                definition.ModuleId,
                definition.ModuleId.HasValue && modules.TryGetValue(definition.ModuleId.Value, out var module) ? module : "Unassigned",
                definition.TenantId, definition.IsActive && x.IsActive, x.DataSourceCode,
                published?.Id, published?.VersionNo, draft?.Id, draft?.VersionNo)
            {
                DataProviderCode = definition.DataProviderCode,
                SortOrder = definition.SortOrder,
                CanDelete = CanArchiveTemplate(x, definition, org, isReportAdmin)
            };
        }).ToList();
    }

    public async Task<HtmlReportTemplateDetailDto?> GetTemplateAsync(long id, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var template = await db.HtmlReportTemplates.AsNoTracking().Include(x => x.Versions)
            .SingleOrDefaultAsync(x => x.Id == id && (x.OrganizationId == org || x.OrganizationId == null), ct);
        if (template is null) return null;
        var definition = await db.ReportDefinitions.AsNoTracking().SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (definition.TenantId is not null && definition.TenantId != org) return null;
        var module = definition.ModuleId is null ? null : await db.ReportModules.AsNoTracking().SingleOrDefaultAsync(x => x.Id == definition.ModuleId, ct);
        var parameters = await LoadParametersAsync(definition.Id, ct);
        return MapDetail(template, definition, module?.Name ?? "Unassigned", parameters);
    }

    public async Task<HtmlReportTemplateDetailDto?> GetCurrentTemplateAsync(long id, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var template = await db.HtmlReportTemplates.AsNoTracking()
            .Include(x => x.Versions.Where(v => v.Status == "Draft" || v.Status == "Published"))
            .SingleOrDefaultAsync(x => x.Id == id && (x.OrganizationId == org || x.OrganizationId == null), ct);
        if (template is null) return null;
        var definition = await db.ReportDefinitions.AsNoTracking()
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (definition.TenantId is not null && definition.TenantId != org) return null;
        var module = definition.ModuleId is null
            ? null
            : await db.ReportModules.AsNoTracking().SingleOrDefaultAsync(x => x.Id == definition.ModuleId, ct);
        var parameters = await LoadParametersAsync(definition.Id, ct);
        return MapDetail(template, definition, module?.Name ?? "Unassigned", parameters);
    }

    public async Task<HtmlReportSettingsDto?> GetSettingsAsync(long templateId, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var template = await db.HtmlReportTemplates.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == templateId && (x.OrganizationId == org || x.OrganizationId == null), ct);
        if (template is null) return null;
        var definition = await db.ReportDefinitions.AsNoTracking()
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (definition.TenantId is not null && definition.TenantId != org) return null;
        var moduleName = definition.ModuleId is null
            ? "Unassigned"
            : await db.ReportModules.AsNoTracking()
                .Where(x => x.Id == definition.ModuleId)
                .Select(x => x.Name)
                .SingleOrDefaultAsync(ct) ?? "Unassigned";
        return MapSettings(template, definition, moduleName,
            await LoadParametersAsync(definition.Id, ct), org);
    }

    public async Task<HtmlReportSettingsOptionsDto> GetSettingsOptionsAsync(CancellationToken ct = default)
    {
        var modules = await db.ReportModules.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new HtmlReportModuleOptionDto(x.Id, x.Name)).ToListAsync(ct);
        var providers = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.DataProviderCode != "")
            .Select(x => x.DataProviderCode).Distinct().OrderBy(x => x).ToListAsync(ct);
        if (!providers.Contains("UnassignedReportDataProvider", StringComparer.OrdinalIgnoreCase))
            providers.Insert(0, "UnassignedReportDataProvider");
        return new(OrganizationId, modules, providers);
    }

    public async Task<HtmlReportTemplateDetailDto> CreateTemplateAsync(CreateHtmlTemplateRequest request, CancellationToken ct = default)
    {
        var userId = currentUser.GetCurrentUserId();
        var org = OrganizationId;
        var validation = validator.Validate(request.TemplateJson);
        if (!validation.IsValid) throw new ArgumentException(JsonSerializer.Serialize(validation));
        var code = NormalizeCode(request.ReportCode);
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("A report code is required.", nameof(request));
        var targetTenantId = ResolveTenantId(request.TenantScope, request.TenantId, org, IsReportAdmin());
        var templateOrganizationId = targetTenantId;
        var moduleId = await ResolveModuleIdAsync(request.ModuleId, request.ModuleCode, ct);
        var definition = await db.ReportDefinitions
            .Where(x => x.TenantId == targetTenantId
                && x.ReportCode.ToUpper() == code.ToUpper())
            .FirstOrDefaultAsync(ct);
        var existingTemplate = await db.HtmlReportTemplates
            .Include(x => x.Versions)
            .SingleOrDefaultAsync(
                x => x.OrganizationId == templateOrganizationId && x.TemplateCode == code, ct);
        if (existingTemplate?.IsActive == true)
            throw new InvalidOperationException($"Template '{code}' already exists for the selected tenant scope.");

        var now = DateTime.UtcNow;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        if (definition is null)
        {
            // A blank designer report intentionally starts without a database
            // provider. Create its tenant-scoped catalogue entry on first save;
            // a provider/data source can be attached later without losing the
            // saved layout or its version history.
            definition = new ReportDefinitionEntity
            {
                ReportCode = code,
                ReportName = request.ReportName.Trim(),
                TenantId = targetTenantId,
                ModuleId = moduleId,
                Description = "Created from the blank HTML report designer.",
                TemplateFile = $"{code}.html",
                TemplateVersion = 1,
                DataProviderCode = ResolveProviderCode(request.DataProviderCode, request.DataSourceCode),
                SupportedPageSizesJson = "[\"A4\",\"A5\",\"A6\",\"Letter\",\"Legal\",\"Custom\"]",
                SortOrder = 0,
                IsActive = request.IsActive,
                CreatedBy = userId,
                CreatedDate = now
            };
            db.ReportDefinitions.Add(definition);
            await db.SaveChangesAsync(ct);
        }
        else
        {
            definition.ReportName = request.ReportName.Trim();
            definition.ModuleId = moduleId ?? definition.ModuleId;
            definition.IsActive = request.IsActive;
            if (!string.IsNullOrWhiteSpace(request.DataProviderCode))
                definition.DataProviderCode = ResolveProviderCode(request.DataProviderCode, request.DataSourceCode);
            definition.UpdatedBy = userId;
            definition.UpdatedDate = now;
        }

        if (request.Parameters is not null)
            await SyncParametersAsync(definition.Id, request.Parameters, userId, now, ct);

        HtmlReportTemplateEntity template;
        if (existingTemplate is null)
        {
            template = new HtmlReportTemplateEntity
            {
                ReportDefinitionId = definition.Id, OrganizationId = templateOrganizationId, TemplateCode = code,
                TemplateName = request.ReportName.Trim(), DataSourceCode = request.DataSourceCode.Trim(),
                IsActive = request.IsActive, CreatedBy = userId, CreatedDate = now
            };
            template.Versions.Add(NewVersion(template, 1, request.TemplateJson, validation, userId, now));
            db.HtmlReportTemplates.Add(template);
        }
        else
        {
            // An archived tenant report keeps its history. Reusing the same report
            // code reactivates it with a fresh draft instead of failing the unique
            // template-code constraint or silently overwriting an old version.
            template = existingTemplate;
            template.ReportDefinitionId = definition.Id;
            template.TemplateName = request.ReportName.Trim();
            template.DataSourceCode = request.DataSourceCode.Trim();
            template.IsActive = request.IsActive;
            template.UpdatedBy = userId;
            template.UpdatedDate = now;
            var nextVersion = template.Versions.Select(x => x.VersionNo).DefaultIfEmpty().Max() + 1;
            template.Versions.Add(NewVersion(template, nextVersion, request.TemplateJson, validation, userId, now));
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        var moduleName = moduleId is null ? "Unassigned" : await db.ReportModules.AsNoTracking()
            .Where(x => x.Id == moduleId).Select(x => x.Name).SingleOrDefaultAsync(ct) ?? "Unassigned";
        return MapDetail(template, definition, moduleName, await LoadParametersAsync(definition.Id, ct));
    }

    public async Task ArchiveTemplateAsync(long templateId, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var userId = currentUser.GetCurrentUserId();
        var isReportAdmin = IsReportAdmin();
        var template = await db.HtmlReportTemplates
            .SingleOrDefaultAsync(x => x.Id == templateId && (x.OrganizationId == org || (x.OrganizationId == null && isReportAdmin)), ct)
            ?? throw new KeyNotFoundException("The custom report template was not found.");
        var definition = await db.ReportDefinitions
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);

        if (!CanArchiveTemplate(template, definition, org, isReportAdmin))
            throw new UnauthorizedAccessException("Built-in and global reports cannot be deleted.");

        var now = DateTime.UtcNow;
        template.IsActive = false;
        template.UpdatedBy = userId;
        template.UpdatedDate = now;

        var hasAnotherActiveTemplate = await db.HtmlReportTemplates.AnyAsync(x =>
            x.Id != template.Id
            && x.ReportDefinitionId == definition.Id
            && x.IsActive, ct);
        if (!hasAnotherActiveTemplate)
        {
            definition.IsActive = false;
            definition.UpdatedBy = userId;
            definition.UpdatedDate = now;
        }

        await db.SaveChangesAsync(ct);
    }

    private static bool CanArchiveTemplate(HtmlReportTemplateEntity template,
        ReportDefinitionEntity definition, int organizationId, bool isReportAdmin) =>
        !definition.IsBuiltIn
        && (template.OrganizationId == organizationId || (template.OrganizationId == null && isReportAdmin))
        && (definition.TenantId == organizationId || isReportAdmin);

    public async Task<HtmlReportSettingsDto> UpdateSettingsAsync(long templateId,
        UpdateHtmlReportSettingsRequest request, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var userId = currentUser.GetCurrentUserId();
        var isReportAdmin = IsReportAdmin();
        var template = await db.HtmlReportTemplates
            .SingleOrDefaultAsync(x => x.Id == templateId && (x.OrganizationId == org || (x.OrganizationId == null && isReportAdmin)), ct)
            ?? throw new KeyNotFoundException("HTML report template was not found.");
        var definition = await db.ReportDefinitions
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (definition.TenantId is not null && definition.TenantId != org && !isReportAdmin)
            throw new UnauthorizedAccessException("The report belongs to a different tenant.");
        var targetTenantId = ResolveTenantId(request.TenantScope, request.TenantId, org, isReportAdmin);
        var targetTemplateOrganizationId = targetTenantId;
        if (await db.ReportDefinitions.AnyAsync(x => x.Id != definition.Id
            && x.TenantId == targetTenantId && x.ReportCode == definition.ReportCode, ct))
            throw new InvalidOperationException(
                $"Report '{definition.ReportCode}' already exists for the selected tenant scope.");
        if (await db.HtmlReportTemplates.AnyAsync(x => x.Id != template.Id
            && x.OrganizationId == targetTemplateOrganizationId
            && x.TemplateCode == template.TemplateCode, ct))
            throw new InvalidOperationException(
                $"Template '{template.TemplateCode}' already exists for the selected tenant scope.");
        var moduleId = await ResolveModuleIdAsync(request.ModuleId, null, ct);
        var now = DateTime.UtcNow;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        definition.ReportName = RequireText(request.ReportName, "A report name is required.");
        definition.ModuleId = moduleId;
        definition.TenantId = targetTenantId;
        definition.DataProviderCode = ResolveProviderCode(request.DataProviderCode, request.DataSourceCode);
        definition.IsActive = request.IsActive;
        definition.UpdatedBy = userId;
        definition.UpdatedDate = now;
        template.TemplateName = definition.ReportName;
        template.OrganizationId = targetTemplateOrganizationId;
        template.DataSourceCode = RequireText(request.DataSourceCode, "A data source code is required.");
        template.IsActive = request.IsActive;
        template.UpdatedBy = userId;
        template.UpdatedDate = now;
        await SyncParametersAsync(definition.Id, request.Parameters, userId, now, ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var moduleName = moduleId is null ? "Unassigned" : await db.ReportModules.AsNoTracking()
            .Where(x => x.Id == moduleId).Select(x => x.Name).SingleOrDefaultAsync(ct) ?? "Unassigned";
        return MapSettings(template, definition, moduleName,
            await LoadParametersAsync(definition.Id, ct), org);
    }

    public async Task<IReadOnlyList<HtmlReportParameterDto>> GetParametersAsync(
        string reportCode, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var normalized = NormalizeCode(reportCode);
        var definitions = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.IsActive && (x.TenantId == null || x.TenantId == org))
            .ToListAsync(ct);
        var definition = definitions
            .Where(x => ComparableCode(x.ReportCode) == ComparableCode(normalized))
            .OrderByDescending(x => x.TenantId == org)
            .FirstOrDefault();
        return definition is null ? [] : await LoadParametersAsync(definition.Id, ct);
    }

    public async Task<SaveHtmlTemplateResult> SaveDraftAsync(long templateId, SaveHtmlTemplateDraftRequest request, CancellationToken ct = default)
    {
        var templateJson = UlbReportBranding.Normalize(request.TemplateJson);
        var validation = validator.Validate(templateJson);
        if (!validation.IsValid) throw new ArgumentException(JsonSerializer.Serialize(validation));
        var contentHash = Hash(templateJson);

        // The classic designer can be open in more than one tab, and older clients also allowed
        // a rapid double-click to submit two saves with the same rowversion. The first request wins;
        // the second must re-read the current draft instead of surfacing EF's optimistic-concurrency
        // exception to the user. Re-running the whole operation is important because the draft may
        // have been published between attempts, in which case a new draft version is required.
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                return await SaveDraftAttemptAsync(
                    templateId, templateJson, contentHash, validation, ct);
            }
            catch (DbUpdateConcurrencyException) when (attempt < 2)
            {
                db.ChangeTracker.Clear();
            }
        }
    }

    private async Task<SaveHtmlTemplateResult> SaveDraftAttemptAsync(
        long templateId,
        string templateJson,
        byte[] contentHash,
        HtmlReportValidationResult validation,
        CancellationToken ct)
    {
        var org = OrganizationId;
        var isReportAdmin = IsReportAdmin();
        var template = await db.HtmlReportTemplates.Include(x => x.Versions)
            .SingleOrDefaultAsync(x => x.Id == templateId && (x.OrganizationId == org || (x.OrganizationId == null && isReportAdmin)), ct)
            ?? throw new KeyNotFoundException("HTML report template was not found.");
        var definition = await db.ReportDefinitions.AsNoTracking()
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (definition.TenantId is not null && definition.TenantId != org && !isReportAdmin)
            throw new UnauthorizedAccessException("The report belongs to a different tenant.");
        var userId = currentUser.GetCurrentUserId();
        var draft = template.Versions.OrderByDescending(x => x.VersionNo).FirstOrDefault(x => x.Status == "Draft");
        if (draft is not null && draft.ContentHash.AsSpan().SequenceEqual(contentHash))
            return new(draft.Id, draft.VersionNo, draft.Status);

        var now = DateTime.UtcNow;
        if (draft is null)
        {
            draft = NewVersion(template, template.Versions.Select(x => x.VersionNo).DefaultIfEmpty().Max() + 1,
                templateJson, validation, userId, now);
            template.Versions.Add(draft);
        }
        else
        {
            draft.TemplateJson = templateJson;
            draft.SchemaVersion = validation.SchemaVersion;
            draft.ContentHash = contentHash;
            draft.ValidationJson = JsonSerializer.Serialize(validation);
        }
        template.UpdatedBy = userId; template.UpdatedDate = now;
        await db.SaveChangesAsync(ct);
        return new(draft.Id, draft.VersionNo, draft.Status);
    }

    public async Task PublishAsync(long templateId, long versionId, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var isReportAdmin = IsReportAdmin();
        var template = await db.HtmlReportTemplates.Include(x => x.Versions)
            .SingleOrDefaultAsync(x => x.Id == templateId && (x.OrganizationId == org || (x.OrganizationId == null && isReportAdmin)), ct)
            ?? throw new KeyNotFoundException("HTML report template was not found.");
        var scopedDefinition = await db.ReportDefinitions.AsNoTracking()
            .SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        if (scopedDefinition.TenantId is not null && scopedDefinition.TenantId != org && !isReportAdmin)
            throw new UnauthorizedAccessException("The report belongs to a different tenant.");
        var version = template.Versions.SingleOrDefault(x => x.Id == versionId)
            ?? throw new KeyNotFoundException("HTML report template version was not found.");
        if (version.Status == "Published") return;
        if (version.Status != "Draft") throw new InvalidOperationException("Only a draft can be published.");
        var validation = validator.Validate(version.TemplateJson);
        if (!validation.IsValid) throw new ArgumentException(JsonSerializer.Serialize(validation));
        var userId = currentUser.GetCurrentUserId();
        foreach (var prior in template.Versions.Where(x => x.Status == "Published"))
        {
            prior.Status = "Archived"; prior.ArchivedBy = userId; prior.ArchivedDate = DateTime.UtcNow;
        }
        await PinFragmentsAsync(version, org, ct);
        version.Status = "Published"; version.PublishedBy = userId; version.PublishedDate = DateTime.UtcNow;
        version.ValidationJson = JsonSerializer.Serialize(validation);
        var definition = await db.ReportDefinitions.SingleAsync(x => x.Id == template.ReportDefinitionId, ct);
        definition.DefaultHtmlTemplateVersionId = version.Id;
        await db.SaveChangesAsync(ct);
    }

    public async Task<CreateHtmlReportJobResult> CreateJobAsync(CreateHtmlReportJobRequest request, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var userId = currentUser.GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(_options.PlatformBaseUrl)) throw new InvalidOperationException("Reporting:PlatformBaseUrl must be configured.");
        var definition = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.ReportCode == request.ReportCode
                && x.IsActive
                && (x.TenantId == null || x.TenantId == org))
            .OrderByDescending(x => x.TenantId == org)
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Report '{request.ReportCode}' was not found.");
        var parameterDefinitions = await db.ReportParameterDefinitions.AsNoTracking()
            .Where(x => x.ReportDefinitionId == definition.Id && x.IsActive)
            .OrderBy(x => x.SortOrder).ToListAsync(ct);
        foreach (var parameter in parameterDefinitions.Where(x => x.IsRequired))
        {
            if (!request.Parameters.TryGetValue(parameter.ParameterKey, out var value)
                || string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"Parameter '{parameter.Label}' is required.", nameof(request));
        }
        var templateOrganizationId = definition.TenantId;
        var version = await db.HtmlReportTemplateVersions.AsNoTracking()
            .Where(x => x.Template.ReportDefinitionId == definition.Id
                && x.Template.OrganizationId == templateOrganizationId && x.Status == "Published")
            .OrderByDescending(x => x.VersionNo).FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("A published tenant-scoped HTML template is required before queueing a job.");
        var scopedKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey.Trim();
        if (scopedKey is not null)
        {
            var existing = await db.HtmlReportJobs.AsNoTracking().SingleOrDefaultAsync(x => x.OrganizationId == org && x.IdempotencyKey == scopedKey, ct);
            if (existing is not null) return new(existing.Id, existing.Status, existing.TotalRecords);
        }
        var parameters = new Dictionary<string, string>(request.Parameters, StringComparer.OrdinalIgnoreCase) { ["userId"] = userId.ToString() };
        var keys = ExtractRecordKeys(parameters);
        var jobType = ResolveJobType(request.JobType, parameters, keys);
        const int batchSize = 250;
        var outputMode = jobType == HtmlReportJobTypes.Bulk
            ? "Merged"
            : NormalizeOutputMode(request.OutputMode);
        var now = DateTime.UtcNow;
        var job = new HtmlReportJobEntity
        {
            Id = Guid.NewGuid(), OrganizationId = org, PlatformBaseUrl = _options.PlatformBaseUrl.TrimEnd('/'),
            ReportDefinitionId = definition.Id, ReportCode = definition.ReportCode, TemplateVersionId = version.Id,
            DataProviderCode = definition.DataProviderCode, JobType = jobType,
            OutputMode = outputMode, ParametersJson = JsonSerializer.Serialize(parameters),
            Status = "Queued", Stage = "Queued", TotalRecords = keys.Count, BatchSize = batchSize,
            TotalBatches = jobType == HtmlReportJobTypes.Bulk ? 0 : outputMode switch
            {
                "Separate" => keys.Count,
                "Batch" => (int)Math.Ceiling(keys.Count / (double)batchSize),
                _ => 1
            }, RequestedByUserId = userId,
            MaxAttemptCount = Math.Max(1, _options.HtmlMaxAttemptCount), IdempotencyKey = scopedKey,
            CreatedDate = now, ExpiryDate = null
        };
        job.ShortLivedToken = tokens.GenerateHtmlReportShortLivedToken(job.Id, userId, org, _options.SltMinutes);
        job.SltExpiresAt = now.AddMinutes(_options.SltMinutes);
        // Bulk progress/recovery is tracked per bounded HtmlReportChunk. Avoid materializing and
        // inserting one job-item entity per requested property (20,000 IDs must remain cheap).
        if (jobType == HtmlReportJobTypes.Single)
            for (var i = 0; i < keys.Count; i++) job.Items.Add(new HtmlReportJobItemEntity
            {
                RecordKey = keys[i],
                BatchNumber = 1,
                Status = "Queued", CreatedDate = now
            });

        // Instant In-Memory Render for Single Reports:
        // When a single record is requested and renderers are present, avoid the background worker queue delay.
        if (jobType == HtmlReportJobTypes.Single && pdfRenderer is not null && htmlRenderer is not null)
        {
            try
            {
                var envelope = await executor.ExecuteAsync(job.Id, job.DataProviderCode, parameters, 100, ct);
                var adaptedSingle = adapters.Adapt(job.DataProviderCode, envelope);
                var adaptedSingleNode = JsonSerializer.SerializeToNode(adaptedSingle);
                await InlineDocumentImagesAsync(adaptedSingleNode, ct);
                using var adaptedDoc = JsonDocument.Parse(adaptedSingleNode?.ToJsonString() ?? "{}");

                var fragments = await db.HtmlReportTemplateFragments.AsNoTracking()
                    .Where(x => x.TemplateVersionId == version.Id)
                    .ToDictionaryAsync(x => x.FragmentCode, x => x.FragmentVersion.FragmentJson, StringComparer.OrdinalIgnoreCase, ct);

                var html = htmlRenderer.Render(version.TemplateJson, adaptedDoc.RootElement, fragments);
                var pdfBytes = await pdfRenderer.RenderAsync(html, ct, tagged: true);

                var friendlyFileName = GetFriendlyReportFileName(
                    definition.ReportName,
                    job.ReportCode,
                    job.ParametersJson,
                    keys.Count > 0 ? keys[0] : null,
                    "pdf");

                using var pdfStream = new MemoryStream(pdfBytes);
                var uploaded = await documents.UploadDocumentAsync(
                    pdfStream,
                    friendlyFileName,
                    "application/pdf",
                    pdfBytes.Length,
                    new DocumentUploadDto { OwnerUserId = userId, DocumentType = "HtmlReport" },
                    userId,
                    ct);

                job.Status = "Completed";
                job.Stage = "Completed";
                job.StartedDate = now;
                job.CompletedDate = DateTime.UtcNow;
                job.ProcessedRecords = 1;
                foreach (var item in job.Items)
                {
                    item.Status = "Completed";
                    item.CompletedDate = DateTime.UtcNow;
                }

                db.HtmlReportFiles.Add(new HtmlReportFileEntity
                {
                    Id = Guid.NewGuid(),
                    JobId = job.Id,
                    BatchNumber = 1,
                    DocumentGuid = uploaded.DocumentGuid,
                    FileName = friendlyFileName,
                    ContentType = "application/pdf",
                    FileSizeBytes = pdfBytes.Length,
                    CreatedDate = DateTime.UtcNow,
                    ExpiryDate = job.ExpiryDate
                });
            }
            catch
            {
                // In-memory render failed or timed out; fall back to background worker
            }
        }

        db.HtmlReportJobs.Add(job);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return new(job.Id, job.Status, job.TotalRecords);
    }

    public async Task<HtmlReportJobStatusDto?> GetJobAsync(Guid jobId, CancellationToken ct = default)
    {
        var org = OrganizationId; var user = currentUser.GetCurrentUserId();
        var job = await db.HtmlReportJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId && x.OrganizationId == org && x.RequestedByUserId == user, ct);
        return job is null ? null : MapJob(job);
    }

    public async Task<IReadOnlyList<HtmlReportJobStatusDto>> GetMyJobsAsync(int take, CancellationToken ct = default)
    {
        var org = OrganizationId;
        var user = currentUser.GetCurrentUserId();
        var clampedTake = take < 1 ? 25 : Math.Min(take, 100);
        var jobs = await db.HtmlReportJobs.AsNoTracking()
            .Where(x => x.OrganizationId == org && x.RequestedByUserId == user)
            .OrderByDescending(x => x.CreatedDate)
            .Take(clampedTake)
            .ToListAsync(ct);
        return jobs.Select(MapJob).ToList();
    }

    public async Task<bool> CancelAsync(Guid jobId, CancellationToken ct = default)
    {
        var org = OrganizationId; var user = currentUser.GetCurrentUserId();
        var job = await db.HtmlReportJobs.SingleOrDefaultAsync(x => x.Id == jobId && x.OrganizationId == org && x.RequestedByUserId == user, ct);
        if (job is null || job.Status is "Completed" or "Failed" or "Cancelled") return false;
        job.CancellationRequested = true;
        if (job.Status == "Queued") { job.Status = "Cancelled"; job.Stage = "Cancelled"; job.CompletedDate = DateTime.UtcNow; }
        await db.SaveChangesAsync(ct); return true;
    }

    public async Task<(Stream Stream, string FileName, string ContentType)?> DownloadAsync(Guid jobId, CancellationToken ct = default)
    {
        var org = OrganizationId; var user = currentUser.GetCurrentUserId();
        var files = await db.HtmlReportFiles.AsNoTracking().Where(x => x.JobId == jobId && x.Job.OrganizationId == org && x.Job.RequestedByUserId == user && (x.Job.Status == "Completed" || x.Job.Status == "PartiallyCompleted"))
            .OrderBy(x => x.BatchNumber).ThenBy(x => x.CreatedDate).ToListAsync(ct);
        if (files.Count == 0) return null;

        var job = await db.HtmlReportJobs
            .Include(x => x.Items)
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == jobId && x.OrganizationId == org && x.RequestedByUserId == user, ct);

        string? reportName = null;
        if (job is not null)
        {
            reportName = await db.ReportDefinitions
                .Where(x => x.Id == job.ReportDefinitionId)
                .Select(x => x.ReportName)
                .FirstOrDefaultAsync(ct);
        }

        if (files.Count == 1)
        {
            var download = await documents.DownloadDocumentAsync(files[0].DocumentGuid, user, ct);
            if (download.FileStream is null) return null;

            var fileName = job is not null
                ? GetFriendlyReportFileName(reportName, job.ReportCode, job.ParametersJson, job.Items.FirstOrDefault()?.RecordKey, "pdf")
                : files[0].FileName;

            return (download.FileStream, fileName, files[0].ContentType);
        }

        var archiveStream = new MemoryStream();
        using (var archive = new ZipArchive(archiveStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var file in files)
            {
                var download = await documents.DownloadDocumentAsync(file.DocumentGuid, user, ct);
                if (download.FileStream is null) continue;
                await using var source = download.FileStream;
                await using var target = archive.CreateEntry(file.FileName, CompressionLevel.Fastest).Open();
                await source.CopyToAsync(target, ct);
            }
        }
        archiveStream.Position = 0;
        var zipName = job is not null
            ? GetFriendlyReportFileName(reportName, job.ReportCode, job.ParametersJson, null, "zip")
            : $"{files[0].JobId:N}.zip";
        return (archiveStream, zipName, "application/zip");
    }

    public async Task<(Stream Stream, string FileName, string ContentType)?> RenderDirectAsync(
        CreateHtmlReportJobRequest request,
        CancellationToken ct = default)
    {
        if (pdfRenderer is null || htmlRenderer is null)
            throw new InvalidOperationException("In-memory rendering is not available.");

        var org = OrganizationId;
        var userId = currentUser.GetCurrentUserId();
        var definition = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.ReportCode == request.ReportCode
                && x.IsActive
                && (x.TenantId == null || x.TenantId == org))
            .OrderByDescending(x => x.TenantId == org)
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Report '{request.ReportCode}' was not found.");

        var parameterDefinitions = await db.ReportParameterDefinitions.AsNoTracking()
            .Where(x => x.ReportDefinitionId == definition.Id && x.IsActive)
            .OrderBy(x => x.SortOrder).ToListAsync(ct);
        foreach (var parameter in parameterDefinitions.Where(x => x.IsRequired))
        {
            if (!request.Parameters.TryGetValue(parameter.ParameterKey, out var value)
                || string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"Parameter '{parameter.Label}' is required.", nameof(request));
        }

        var templateOrganizationId = definition.TenantId;
        var version = await db.HtmlReportTemplateVersions.AsNoTracking()
            .Where(x => x.Template.ReportDefinitionId == definition.Id
                && x.Template.OrganizationId == templateOrganizationId && x.Status == "Published")
            .OrderByDescending(x => x.VersionNo).FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("A published tenant-scoped HTML template is required.");

        var parameters = new Dictionary<string, string>(request.Parameters, StringComparer.OrdinalIgnoreCase) { ["userId"] = userId.ToString() };
        var keys = ExtractRecordKeys(parameters);

        var envelope = await executor.ExecuteAsync(Guid.NewGuid(), definition.DataProviderCode, parameters, 100, ct);
        var adapted = adapters.Adapt(definition.DataProviderCode, envelope);
        var adaptedNode = JsonSerializer.SerializeToNode(adapted);
        await InlineDocumentImagesAsync(adaptedNode, ct);
        using var adaptedDoc = JsonDocument.Parse(adaptedNode?.ToJsonString() ?? "{}");

        var fragments = await db.HtmlReportTemplateFragments.AsNoTracking()
            .Where(x => x.TemplateVersionId == version.Id)
            .ToDictionaryAsync(x => x.FragmentCode, x => x.FragmentVersion.FragmentJson, StringComparer.OrdinalIgnoreCase, ct);

        var html = htmlRenderer.Render(version.TemplateJson, adaptedDoc.RootElement, fragments);
        var pdfBytes = await pdfRenderer.RenderAsync(html, ct, tagged: true);

        var friendlyFileName = GetFriendlyReportFileName(
            definition.ReportName,
            definition.ReportCode,
            JsonSerializer.Serialize(parameters),
            keys.Count > 0 ? keys[0] : null,
            "pdf");

        return (new MemoryStream(pdfBytes), friendlyFileName, "application/pdf");
    }

    public async Task ProcessQueuedJobAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await db.HtmlReportJobs
            .Include(x => x.Items)
            .SingleOrDefaultAsync(x => x.Id == jobId, ct)
            ?? throw new KeyNotFoundException($"Job {jobId} was not found.");

        if (job.CancellationRequested)
        {
            job.Status = "Cancelled";
            job.Stage = "Cancelled";
            await db.SaveChangesAsync(ct);
            return;
        }

        if (pdfRenderer is null || htmlRenderer is null)
            throw new InvalidOperationException("In-memory rendering is not available (IPdfRenderer and IHtmlTemplateRenderer must be registered).");

        var org = job.OrganizationId;
        var userId = job.RequestedByUserId;

        var definition = await db.ReportDefinitions.AsNoTracking()
            .Where(x => x.ReportCode == job.ReportCode && x.IsActive && (x.TenantId == null || x.TenantId == org))
            .OrderByDescending(x => x.TenantId == org)
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Report '{job.ReportCode}' was not found.");

        var templateOrgId = definition.TenantId;
        var version = await db.HtmlReportTemplateVersions.AsNoTracking()
            .Where(x => x.Template.ReportDefinitionId == definition.Id
                && x.Template.OrganizationId == templateOrgId && x.Status == "Published")
            .OrderByDescending(x => x.VersionNo).FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"A published tenant-scoped HTML template is required for '{job.ReportCode}'.");

        var parameters = string.IsNullOrWhiteSpace(job.ParametersJson)
            ? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            : JsonSerializer.Deserialize<Dictionary<string, string>>(job.ParametersJson) ?? new(StringComparer.OrdinalIgnoreCase);

        parameters["userId"] = userId.ToString();
        var keys = ExtractRecordKeys(parameters);

        var envelope = await executor.ExecuteAsync(job.Id, job.DataProviderCode, parameters, 100, ct);
        var adapted = adapters.Adapt(job.DataProviderCode, envelope);
        var adaptedNode = JsonSerializer.SerializeToNode(adapted);
        await InlineDocumentImagesAsync(adaptedNode, ct);
        using var adaptedDoc = JsonDocument.Parse(adaptedNode?.ToJsonString() ?? "{}");

        var fragments = await db.HtmlReportTemplateFragments.AsNoTracking()
            .Where(x => x.TemplateVersionId == version.Id)
            .ToDictionaryAsync(x => x.FragmentCode, x => x.FragmentVersion.FragmentJson, StringComparer.OrdinalIgnoreCase, ct);

        var html = htmlRenderer.Render(version.TemplateJson, adaptedDoc.RootElement, fragments);
        var pdfBytes = await pdfRenderer.RenderAsync(html, ct, tagged: true);

        var friendlyFileName = GetFriendlyReportFileName(
            definition.ReportName,
            job.ReportCode,
            job.ParametersJson,
            keys.Count > 0 ? keys[0] : null,
            "pdf");

        using var pdfStream = new MemoryStream(pdfBytes);
        var uploaded = await documents.UploadDocumentAsync(
            pdfStream,
            friendlyFileName,
            "application/pdf",
            pdfBytes.Length,
            new DocumentUploadDto { OwnerUserId = userId, DocumentType = "HtmlReport" },
            userId,
            ct);

        job.Status = "Completed";
        job.Stage = "Completed";
        job.CompletedDate = DateTime.UtcNow;
        job.ProcessedRecords = Math.Max(1, keys.Count);
        foreach (var item in job.Items)
        {
            item.Status = "Completed";
            item.CompletedDate = DateTime.UtcNow;
        }

        db.HtmlReportFiles.Add(new HtmlReportFileEntity
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            BatchNumber = 1,
            DocumentGuid = uploaded.DocumentGuid,
            FileName = friendlyFileName,
            ContentType = "application/pdf",
            FileSizeBytes = pdfBytes.Length,
            CreatedDate = DateTime.UtcNow,
            ExpiryDate = job.ExpiryDate
        });

        await db.SaveChangesAsync(ct);
    }

    public async Task<HtmlWorkerAuthenticateResult?> AuthenticateWorkerAsync(HtmlWorkerAuthenticateRequest request, CancellationToken ct = default)
    {
        var claims = tokens.ValidateHtmlReportShortLivedToken(request.ShortLivedToken);
        if (claims is null || claims.Value.jobId != request.JobId) return null;
        var job = await db.HtmlReportJobs.SingleOrDefaultAsync(x => x.Id == request.JobId
            && x.OrganizationId == claims.Value.organizationId, ct);
        if (job is null || job.OrganizationId != claims.Value.organizationId || job.RequestedByUserId != claims.Value.userId ||
            job.SltConsumed || job.ShortLivedToken != request.ShortLivedToken || job.SltExpiresAt <= DateTime.UtcNow) return null;

        job.SltConsumed = true;
        job.SltConsumedAt = DateTime.UtcNow;

        var version = await db.HtmlReportTemplateVersions.AsNoTracking().SingleAsync(x => x.Id == job.TemplateVersionId && x.Status == "Published", ct);
        var fragments = await db.HtmlReportTemplateFragments.AsNoTracking().Where(x => x.TemplateVersionId == version.Id)
            .ToDictionaryAsync(x => x.FragmentCode, x => x.FragmentVersion.FragmentJson, StringComparer.OrdinalIgnoreCase, ct);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return null;
        }

        return new(tokens.GenerateHtmlReportWorkerToken(job.Id, job.RequestedByUserId, job.OrganizationId, _options.LltMinutes),
            job.ReportCode, job.DataProviderCode, job.ParametersJson ?? "{}", version.TemplateJson, fragments);
    }

    public async Task<HtmlWorkerDataPageResult> GetWorkerDataAsync(
        Guid jobId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var job = await db.HtmlReportJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId && x.OrganizationId == OrganizationId, ct)
            ?? throw new KeyNotFoundException("HTML report job was not found.");
        var parameters = JsonSerializer.Deserialize<Dictionary<string, string>>(job.ParametersJson ?? "{}") ?? [];
        var boundedPageSize = Math.Clamp(pageSize, 1, 10_000);
        if (job.JobType == HtmlReportJobTypes.Single)
        {
            var envelope = await executor.ExecuteAsync(job.Id, job.DataProviderCode, parameters, boundedPageSize, ct);
            var adaptedSingle = adapters.Adapt(job.DataProviderCode, envelope);
            var adaptedSingleNode = JsonSerializer.SerializeToNode(adaptedSingle);
            await InlineDocumentImagesAsync(adaptedSingleNode, ct);
            using var adaptedSingleDocument = JsonDocument.Parse(adaptedSingleNode?.ToJsonString() ?? "{}");
            var adaptedRoot = adaptedSingleDocument.RootElement;
            var recordCount = envelope.Main.Count > 0
                ? envelope.Main.Count
                : adaptedRoot.ValueKind == JsonValueKind.Array
                    ? adaptedRoot.GetArrayLength()
                    : adaptedRoot.ValueKind == JsonValueKind.Object
                        && adaptedRoot.TryGetProperty("records", out var adaptedRecords)
                        && adaptedRecords.ValueKind == JsonValueKind.Array
                            ? adaptedRecords.GetArrayLength()
                            : adaptedRoot.ValueKind == JsonValueKind.Object && adaptedRoot.EnumerateObject().Any() ? 1 : 0;
            return new HtmlWorkerDataPageResult(
                adaptedRoot.Clone(),
                1,
                boundedPageSize,
                recordCount,
                recordCount,
                false,
                false,
                envelope.Main.Count == 0 ? null : ReadRecordKey(envelope.Main[0]),
                envelope.Main.Count == 0 ? null : ReadRecordKey(envelope.Main[^1]));
        }
        var pageEnvelope = await executor.ExecutePageAsync(
            job.Id,
            job.DataProviderCode,
            parameters,
            Math.Max(1, page),
            boundedPageSize,
            true,
            ct);
        var adapted = adapters.Adapt(job.DataProviderCode, pageEnvelope.Envelope);
        var adaptedNode = JsonSerializer.SerializeToNode(adapted);
        await InlineDocumentImagesAsync(adaptedNode, ct);
        using var adaptedDocument = JsonDocument.Parse(adaptedNode?.ToJsonString() ?? "{}");
        var driverRows = pageEnvelope.DriverRows;
        var totalCount = pageEnvelope.TotalCount ?? (job.TotalRecords > 1 ? job.TotalRecords : null);
        return new HtmlWorkerDataPageResult(
            adaptedDocument.RootElement.Clone(),
            Math.Max(1, page),
            boundedPageSize,
            driverRows.Count,
            totalCount,
            pageEnvelope.HasMore,
            pageEnvelope.SupportsPaging,
            driverRows.Count == 0 ? null : ReadRecordKey(driverRows[0]),
            driverRows.Count == 0 ? null : ReadRecordKey(driverRows[^1]));
    }

    public async Task<HtmlWorkerUploadResult> UploadWorkerFileAsync(Guid jobId, long? jobItemId, int? batchNumber,
        Stream pdf, string fileName, long fileSize, CancellationToken ct = default)
    {
        var job = await db.HtmlReportJobs.SingleOrDefaultAsync(x => x.Id == jobId && x.OrganizationId == OrganizationId, ct)
            ?? throw new KeyNotFoundException("HTML report job was not found.");
        var existing = await db.HtmlReportFiles.AsNoTracking().FirstOrDefaultAsync(x => x.JobId == jobId && x.JobItemId == jobItemId && x.BatchNumber == batchNumber, ct);
        if (existing is not null) return new(existing.DocumentGuid);
        var uploaded = await documents.UploadDocumentAsync(pdf, fileName, "application/pdf", fileSize,
            new DocumentUploadDto { OwnerUserId = job.RequestedByUserId, DocumentType = "HtmlReport" }, job.RequestedByUserId, ct);
        db.HtmlReportFiles.Add(new HtmlReportFileEntity
        {
            Id = Guid.NewGuid(), JobId = jobId, JobItemId = jobItemId, BatchNumber = batchNumber,
            DocumentGuid = uploaded.DocumentGuid, FileName = fileName, ContentType = "application/pdf", FileSizeBytes = fileSize,
            CreatedDate = DateTime.UtcNow, ExpiryDate = job.ExpiryDate
        });
        await db.SaveChangesAsync(ct);
        return new(uploaded.DocumentGuid);
    }

    private async Task PinFragmentsAsync(HtmlReportTemplateVersionEntity version, int org, CancellationToken ct)
    {
        var available = await db.HtmlReportFragmentVersions
            .AsNoTracking()
            .Include(x => x.Fragment)
            .Where(x => x.Fragment.OrganizationId == org && x.Status == "Published")
            .ToListAsync(ct);
        var pinned = new Dictionary<string, HtmlReportFragmentVersionEntity>(StringComparer.OrdinalIgnoreCase);
        var visiting = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        PinDocument(version.TemplateJson, 0);
        foreach (var fragment in pinned.Values)
            version.Fragments.Add(new HtmlReportTemplateFragmentEntity
            {
                FragmentVersionId = fragment.Id,
                FragmentCode = fragment.Fragment.FragmentCode
            });

        void PinDocument(string json, int depth)
        {
            if (depth > 8) throw new InvalidOperationException("Fragment nesting exceeds 8.");
            using var document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 64 });
            foreach (var reference in CollectReferences(document.RootElement))
            {
                var key = $"{reference.Code}@{reference.Version?.ToString() ?? "latest"}";
                if (!visiting.Add(key)) throw new InvalidOperationException($"Circular fragment reference detected at '{reference.Code}'.");
                var fragment = available
                    .Where(x => x.Fragment.FragmentCode.Equals(reference.Code, StringComparison.OrdinalIgnoreCase) &&
                        (reference.Version is null || x.VersionNo == reference.Version))
                    .OrderByDescending(x => x.VersionNo)
                    .FirstOrDefault()
                    ?? throw new InvalidOperationException($"Published fragment '{reference.Code}' version '{reference.Version?.ToString() ?? "latest"}' was not found.");
                if (pinned.TryGetValue(reference.Code, out var existing) && existing.Id != fragment.Id)
                    throw new InvalidOperationException($"Template references multiple versions of fragment '{reference.Code}'.");
                if (pinned.TryAdd(reference.Code, fragment)) PinDocument(fragment.FragmentJson, depth + 1);
                visiting.Remove(key);
            }
        }

        static IEnumerable<(string Code, int? Version)> CollectReferences(JsonElement node)
        {
            if (node.ValueKind == JsonValueKind.Object)
            {
                if (node.TryGetProperty("fragmentCode", out var code) && code.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(code.GetString()))
                {
                    var requested = node.TryGetProperty("fragmentVersion", out var number) && number.TryGetInt32(out var value) ? value : (int?)null;
                    yield return (code.GetString()!, requested);
                }
                foreach (var property in node.EnumerateObject())
                    foreach (var child in CollectReferences(property.Value)) yield return child;
            }
            else if (node.ValueKind == JsonValueKind.Array)
                foreach (var item in node.EnumerateArray())
                    foreach (var child in CollectReferences(item)) yield return child;
        }
    }

    private static HtmlReportTemplateVersionEntity NewVersion(HtmlReportTemplateEntity template, int number, string json,
        HtmlReportValidationResult validation, int userId, DateTime now) => new()
    {
        Template = template, VersionNo = number, SchemaVersion = validation.SchemaVersion, Status = "Draft", TemplateJson = json,
        ContentHash = Hash(json), ValidationJson = JsonSerializer.Serialize(validation), CreatedBy = userId, CreatedDate = now
    };
    private static byte[] Hash(string value) => SHA256.HashData(Encoding.UTF8.GetBytes(value));
    private static string NormalizeCode(string value) => new(value.Trim().Where(x => char.IsLetterOrDigit(x) || x == '_').ToArray());
    private static string ComparableCode(string value) => new(value.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());
    private static string NormalizeOutputMode(string? value) => value?.Trim().ToLowerInvariant() switch { "separate" => "Separate", "batch" => "Batch", _ => "Merged" };
    private static List<string> ExtractRecordKeys(Dictionary<string, string> parameters)
    {
        parameters.TryGetValue("propertyId", out var value);
        return string.IsNullOrWhiteSpace(value) ? ["single"] : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string ResolveJobType(
        string? requestedJobType,
        IReadOnlyDictionary<string, string> parameters,
        IReadOnlyCollection<string> recordKeys)
    {
        var explicitIdentifierCount = CountExplicitIdentifiers();
        var usesBulkSelector = HasValue("fromPropertyNo") || HasValue("toPropertyNo")
            || (explicitIdentifierCount == 0 && (HasValue("zoneId") || HasValue("wardId")));

        if (!string.IsNullOrWhiteSpace(requestedJobType))
        {
            if (!HtmlReportJobTypes.IsValid(requestedJobType))
                throw new ArgumentException("JobType must be either Single or Bulk.", nameof(requestedJobType));
            var normalized = HtmlReportJobTypes.Normalize(requestedJobType);
            if (normalized == HtmlReportJobTypes.Single && (explicitIdentifierCount > 1 || usesBulkSelector))
                throw new ArgumentException("A Single report job cannot contain multiple identifiers or use a bulk selector.", nameof(requestedJobType));
            return normalized;
        }

        // Compatibility for older callers. New callers send JobType explicitly. Broad filters
        // must default to Bulk so they can never consume the reserved Single execution lane.
        if (recordKeys.Count > 1 || explicitIdentifierCount > 1 || usesBulkSelector)
            return HtmlReportJobTypes.Bulk;
        return HtmlReportJobTypes.Single;

        bool HasValue(string key) => parameters.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value);
        int CountExplicitIdentifiers()
        {
            foreach (var key in new[] { "propertyId", "propertyIds", "ownerId" })
            {
                if (!parameters.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value)) continue;
                return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();
            }
            return 0;
        }
    }
    private static string? ReadRecordKey(JsonElement row)
    {
        if (row.ValueKind != JsonValueKind.Object) return null;
        foreach (var preferredName in new[] { "propertyId", "upicId", "recordKey", "id" })
        {
            foreach (var property in row.EnumerateObject())
            {
                if (!property.Name.Equals(preferredName, StringComparison.OrdinalIgnoreCase)) continue;
                var value = property.Value.ValueKind == JsonValueKind.String
                    ? property.Value.GetString()
                    : property.Value.ToString();
                return string.IsNullOrWhiteSpace(value) ? null : value;
            }
        }
        return null;
    }

    private static HtmlReportJobStatusDto MapJob(HtmlReportJobEntity x) => new(x.Id, x.ReportCode, x.Status,
        x.TotalRecords, x.ProcessedRecords, x.FailedRecords, x.CompletedBatches, x.TotalBatches,
        x.CurrentChunk, x.Stage, x.ErrorMessage, x.CreatedDate, x.CompletedDate);

    private async Task<int?> ResolveModuleIdAsync(int? moduleId, string? moduleCode, CancellationToken ct)
    {
        if (moduleId.HasValue)
        {
            if (!await db.ReportModules.AsNoTracking().AnyAsync(x => x.Id == moduleId.Value, ct))
                throw new ArgumentException("The selected report module does not exist.", nameof(moduleId));
            return moduleId;
        }
        if (string.IsNullOrWhiteSpace(moduleCode)) return null;
        var modules = await db.ReportModules.AsNoTracking().ToListAsync(ct);
        return modules.FirstOrDefault(x => ComparableCode(x.Name) == ComparableCode(moduleCode))?.Id;
    }

    private static int? ResolveTenantId(string? scope, int? requestedTenantId, int currentTenantId, bool isReportAdmin = false)
    {
        if (scope?.Equals("Global", StringComparison.OrdinalIgnoreCase) == true)
        {
            if (!isReportAdmin)
                throw new UnauthorizedAccessException("Only a report administrator can configure global templates.");
            return null;
        }
        if (requestedTenantId.HasValue && requestedTenantId.Value != currentTenantId)
        {
            if (!isReportAdmin)
                throw new UnauthorizedAccessException("Reports can only be configured for the authenticated tenant.");
            return requestedTenantId.Value;
        }
        return currentTenantId;
    }

    private static string ResolveProviderCode(string? providerCode, string dataSourceCode)
    {
        if (!string.IsNullOrWhiteSpace(providerCode)) return providerCode.Trim();
        if (!string.IsNullOrWhiteSpace(dataSourceCode)) return dataSourceCode.Trim();
        return "UnassignedReportDataProvider";
    }

    private static string RequireText(string? value, string message)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException(message);
        return value.Trim();
    }

    private async Task SyncParametersAsync(int reportDefinitionId,
        IReadOnlyList<HtmlReportParameterDto> requested, int userId, DateTime now, CancellationToken ct)
    {
        var duplicate = requested.Where(x => x.IsActive)
            .GroupBy(x => x.Key.Trim(), StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(x => x.Count() > 1);
        if (duplicate is not null)
            throw new ArgumentException($"Parameter '{duplicate.Key}' is configured more than once.");

        var existing = await db.ReportParameterDefinitions
            .Where(x => x.ReportDefinitionId == reportDefinitionId).ToListAsync(ct);
        var requestedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in requested)
        {
            var key = RequireText(item.Key, "Every parameter requires a key.");
            requestedKeys.Add(key);
            var entity = existing.FirstOrDefault(x => x.ParameterKey.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (entity is null)
            {
                entity = new ReportParameterDefinitionEntity
                {
                    ReportDefinitionId = reportDefinitionId,
                    ParameterKey = key,
                    CreatedBy = userId,
                    CreatedDate = now
                };
                db.ReportParameterDefinitions.Add(entity);
            }
            else
            {
                entity.UpdatedBy = userId;
                entity.UpdatedDate = now;
            }
            entity.Label = RequireText(item.Label, $"Parameter '{key}' requires a label.");
            entity.ParameterType = RequireText(item.Type, $"Parameter '{key}' requires a type.");
            entity.CascadeFromKey = string.IsNullOrWhiteSpace(item.CascadeFromKey) ? null : item.CascadeFromKey.Trim();
            entity.IsRequired = item.IsRequired;
            entity.SortOrder = item.SortOrder;
            entity.IsActive = item.IsActive;
        }
        foreach (var stale in existing.Where(x => !requestedKeys.Contains(x.ParameterKey)))
        {
            stale.IsActive = false;
            stale.UpdatedBy = userId;
            stale.UpdatedDate = now;
        }
    }

    private async Task<IReadOnlyList<HtmlReportParameterDto>> LoadParametersAsync(
        int reportDefinitionId, CancellationToken ct) =>
        await db.ReportParameterDefinitions.AsNoTracking()
            .Where(x => x.ReportDefinitionId == reportDefinitionId && x.IsActive)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.ParameterKey)
            .Select(x => new HtmlReportParameterDto(x.Id, x.ParameterKey, x.Label,
                x.ParameterType, x.IsRequired, x.SortOrder, x.CascadeFromKey, x.IsActive))
            .ToListAsync(ct);

    private static HtmlReportSettingsDto MapSettings(HtmlReportTemplateEntity x,
        ReportDefinitionEntity d, string module, IReadOnlyList<HtmlReportParameterDto> parameters,
        int currentTenantId) => new(x.Id, d.Id, d.ReportCode, x.TemplateName, d.ModuleId, module,
            d.TenantId, d.TenantId is null ? "Global" : "CurrentTenant", currentTenantId,
            d.IsActive && x.IsActive, x.DataSourceCode, d.DataProviderCode, parameters);

    private static HtmlReportTemplateDetailDto MapDetail(HtmlReportTemplateEntity x,
        ReportDefinitionEntity d, string module, IReadOnlyList<HtmlReportParameterDto> parameters) =>
        new(x.Id, d.Id, d.ReportCode, x.TemplateName, d.ModuleId, module, d.TenantId,
            d.IsActive && x.IsActive, x.DataSourceCode, d.DataProviderCode, parameters,
            x.Versions.OrderByDescending(v => v.VersionNo)
                .Select(v => new HtmlReportTemplateVersionDto(v.Id, v.VersionNo, v.SchemaVersion,
                    v.Status, ReportDesignerLogoField.RepairCatalog(UlbReportBranding.Normalize(v.TemplateJson, d.DataProviderCode)),
                    v.ValidationJson, v.CreatedDate, v.PublishedDate)).ToList());

    private static string GetFriendlyReportFileName(
        string? reportName,
        string? reportCode,
        string? parametersJson,
        string? singleRecordKey,
        string extension = "pdf")
    {
        var rawName = !string.IsNullOrWhiteSpace(reportName) ? reportName.Trim() : (reportCode?.Trim() ?? "Report");
        var invalidChars = Path.GetInvalidFileNameChars();
        var cleanBase = new string(rawName.Select(ch => invalidChars.Contains(ch) || char.IsWhiteSpace(ch) ? '_' : ch).ToArray());
        while (cleanBase.Contains("__")) cleanBase = cleanBase.Replace("__", "_");
        cleanBase = cleanBase.Trim('_');
        if (string.IsNullOrEmpty(cleanBase)) cleanBase = "Report";

        var key = singleRecordKey?.Trim();
        if (string.IsNullOrEmpty(key) && !string.IsNullOrWhiteSpace(parametersJson))
        {
            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(parametersJson);
                if (dict != null)
                {
                    var possibleKeys = new[] { "propertyNo", "PropertyNo", "propNo", "PropNo", "propertyId", "PropertyId", "consumerNo", "accountNo", "noticeNo", "wardNo" };
                    foreach (var k in possibleKeys)
                    {
                        if (dict.TryGetValue(k, out var val) && !string.IsNullOrWhiteSpace(val))
                        {
                            key = val.Trim();
                            break;
                        }
                    }
                }
            }
            catch { }
        }

        if (!string.IsNullOrEmpty(key))
        {
            var cleanKey = new string(key.Select(ch => invalidChars.Contains(ch) || char.IsWhiteSpace(ch) ? '_' : ch).ToArray()).Trim('_');
            if (!string.IsNullOrEmpty(cleanKey))
            {
                return $"{cleanBase}_{cleanKey}.{extension}";
            }
        }

        return $"{cleanBase}.{extension}";
    }

    private async Task InlineDocumentImagesAsync(JsonNode? node, CancellationToken ct)
    {
        if (node is null) return;
        var imageCache = new Dictionary<Guid, string?>();
        await TraverseAndInlineAsync(node);

        async Task TraverseAndInlineAsync(JsonNode current)
        {
            if (current is JsonObject obj)
            {
                PromoteImageGuidFallback(obj, "propertyPhoto", "propertyPhotoDocumentGuid");
                PromoteImageGuidFallback(obj, "planPhoto", "planPhotoDocumentGuid");
                PromoteImageGuidFallback(obj, "buildingPlanPhoto", "buildingPlanPhotoDocumentGuid");

                var propertiesToUpdate = new List<(string Key, string Value)>();
                foreach (var prop in obj)
                {
                    // Companion metadata must remain a GUID. Inlining it as a second base64 copy
                    // doubles the JSON payload for every report image and slows bulk reports.
                    if (prop.Key.EndsWith("DocumentGuid", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (prop.Value is JsonValue val && val.TryGetValue<string>(out var strVal))
                    {
                        if (TryParseDocumentGuid(strVal, out var guid))
                        {
                            if (!imageCache.TryGetValue(guid, out var dataUri))
                            {
                                dataUri = await LoadDocumentAsDataUriAsync(guid, ct);
                                imageCache[guid] = dataUri;
                            }

                            if (!string.IsNullOrEmpty(dataUri))
                            {
                                propertiesToUpdate.Add((prop.Key, dataUri));
                            }
                        }
                    }
                    else if (prop.Value is not null)
                    {
                        await TraverseAndInlineAsync(prop.Value);
                    }
                }

                foreach (var (key, value) in propertiesToUpdate)
                {
                    obj[key] = value;
                }
            }
            else if (current is JsonArray arr)
            {
                foreach (var item in arr)
                {
                    if (item is not null)
                        await TraverseAndInlineAsync(item);
                }
            }
        }

        static void PromoteImageGuidFallback(JsonObject obj, string imageKey, string documentGuidKey)
        {
            if (obj.TryGetPropertyValue(imageKey, out var imageNode)
                && imageNode is JsonValue imageValue
                && imageValue.TryGetValue<string>(out var image)
                && !string.IsNullOrWhiteSpace(image))
                return;

            if (obj.TryGetPropertyValue(documentGuidKey, out var guidNode)
                && guidNode is JsonValue guidValue
                && guidValue.TryGetValue<string>(out var documentGuid)
                && Guid.TryParse(documentGuid, out _))
                obj[imageKey] = documentGuid;
        }

        static bool TryParseDocumentGuid(string value, out Guid guid)
        {
            guid = Guid.Empty;
            if (string.IsNullOrWhiteSpace(value)) return false;
            if (Guid.TryParse(value.Trim(), out guid)) return true;
            var match = Regex.Match(value, @"(?:/api/UlbImageMaster/|/api/DocumentMaster/|/api/documents?/)?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", RegexOptions.IgnoreCase);
            return match.Success && Guid.TryParse(match.Groups[1].Value, out guid);
        }

        async Task<string?> LoadDocumentAsDataUriAsync(Guid guid, CancellationToken cancellationToken)
        {
            try
            {
                var (stream, _, mimeType) = await documents.ViewDocumentAsync(guid, cancellationToken);
                if (stream is null) return null;
                await using (stream)
                {
                    using var memory = new MemoryStream();
                    await stream.CopyToAsync(memory, cancellationToken);
                    var bytes = memory.ToArray();
                    if (bytes.Length == 0) return null;
                    var effectiveMime = string.IsNullOrWhiteSpace(mimeType) ? "image/png" : mimeType;
                    return $"data:{effectiveMime};base64,{Convert.ToBase64String(bytes)}";
                }
            }
            catch
            {
                return null;
            }
        }
    }
}
