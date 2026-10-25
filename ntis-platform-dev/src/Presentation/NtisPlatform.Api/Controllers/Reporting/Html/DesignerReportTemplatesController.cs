using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Core.Entities.Reporting;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Api.Controllers.Reporting.Html;

[ApiController]
[Authorize]
[Route("api/designer-report-templates")]
public sealed class DesignerReportTemplatesController(
    IHtmlReportService service,
    IReportDataProviderResolver resolver,
    IEnumerable<IReportDataProvider> providers) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<HtmlReportTemplateSummaryDto>> GetAll(CancellationToken ct) => service.GetTemplatesAsync(ct);

    [HttpGet("{id:long}")]
    public async Task<ActionResult<HtmlReportTemplateDetailDto>> Get(long id, CancellationToken ct) =>
        await service.GetTemplateAsync(id, ct) is { } result ? Ok(result) : NotFound();

    [HttpGet("{id:long}/current")]
    public async Task<ActionResult<HtmlReportTemplateDetailDto>> GetCurrent(long id, CancellationToken ct) =>
        await service.GetCurrentTemplateAsync(id, ct) is { } result ? Ok(result) : NotFound();

    [HttpGet("{id:long}/settings")]
    public async Task<ActionResult<HtmlReportSettingsDto>> Settings(long id, CancellationToken ct) =>
        await service.GetSettingsAsync(id, ct) is { } result ? Ok(result) : NotFound();

    [HttpGet("settings/options")]
    public Task<HtmlReportSettingsOptionsDto> SettingsOptions(CancellationToken ct) =>
        service.GetSettingsOptionsAsync(ct);

    [HttpGet("parameters/{reportCode}")]
    public Task<IReadOnlyList<HtmlReportParameterDto>> Parameters(string reportCode, CancellationToken ct) =>
        service.GetParametersAsync(reportCode, ct);

    [HttpPost]
    public async Task<ActionResult<HtmlReportTemplateDetailDto>> Create(CreateHtmlTemplateRequest request, CancellationToken ct)
    {
        var result = await service.CreateTemplateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Archive(long id, CancellationToken ct)
    {
        await service.ArchiveTemplateAsync(id, ct);
        return NoContent();
    }

    [HttpPut("{templateId:long}/settings")]
    public async Task<ActionResult<HtmlReportSettingsDto>> UpdateSettings(long templateId,
        UpdateHtmlReportSettingsRequest request, CancellationToken ct)
    {
        return Ok(await service.UpdateSettingsAsync(templateId, request, ct));
    }

    [HttpPost("{templateId:long}/drafts")]
    public Task<SaveHtmlTemplateResult> SaveDraft(long templateId, SaveHtmlTemplateDraftRequest request, CancellationToken ct) =>
        service.SaveDraftAsync(templateId, request, ct);

    [HttpPost("{templateId:long}/versions/{versionId:long}/publish")]
    public async Task<IActionResult> Publish(long templateId, long versionId, CancellationToken ct)
    {
        await service.PublishAsync(templateId, versionId, ct);
        return NoContent();
    }

    [HttpGet("schema/{providerOrReportCode}")]
    public async Task<ActionResult<IReadOnlyList<HtmlReportDataSourceFieldDto>>> GetSchema(
        string providerOrReportCode,
        [FromServices] IReportingRepository<HtmlReportFragmentVersionEntity, long> fragmentRepo,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(providerOrReportCode)) return Ok(Array.Empty<HtmlReportDataSourceFieldDto>());

        var trimmed = providerOrReportCode.Trim();
        var cleanCode = trimmed.Replace("_", "").Replace("-", "").ToUpperInvariant();

        // 0. Check database table dbo.HtmlReportFragmentVersion
        try
        {
            var fragment = await fragmentRepo.GetQueryable()
                .AsNoTracking()
                .Include(x => x.Fragment)
                .Where(x => x.Fragment.IsActive && (x.Status == "Published" || x.Status == "Draft"))
                .OrderByDescending(x => x.VersionNo)
                .FirstOrDefaultAsync(x =>
                    x.Fragment.FragmentCode == trimmed ||
                    x.Fragment.FragmentCode == cleanCode ||
                    x.Fragment.FragmentCode.ToUpper() == cleanCode ||
                    x.Fragment.FragmentCode == "SCHEMA_" + cleanCode ||
                    x.Fragment.FragmentCode == "SCHEMA_" + trimmed ||
                    cleanCode.Contains(x.Fragment.FragmentCode.Replace("SCHEMA_", "").Replace("_", "").ToUpper()) ||
                    x.Fragment.FragmentCode.Replace("SCHEMA_", "").Replace("_", "").ToUpper().Contains(cleanCode), ct);

            if (fragment is not null && !string.IsNullOrWhiteSpace(fragment.FragmentJson))
            {
                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var fields = System.Text.Json.JsonSerializer.Deserialize<List<HtmlReportDataSourceFieldDto>>(fragment.FragmentJson, options);
                if (fields is not null && fields.Count > 0)
                {
                    // Preserve database labels and append fields exposed by the provider.
                    // Old schema fragments must not hide newer bindings or case-sensitive aliases.
                    var providerFields = await GetProviderSchemaAsync(trimmed, cleanCode, ct);
                    return Ok(fields.Select(ReportDesignerLogoField.RepairSchemaField).Concat(providerFields)
                        .DistinctBy(field => field.Path, StringComparer.Ordinal)
                        .ToArray());
                }
            }
        }
        catch {}

        return Ok(await GetProviderSchemaAsync(trimmed, cleanCode, ct));
    }

    private async Task<IReadOnlyList<HtmlReportDataSourceFieldDto>> GetProviderSchemaAsync(
        string trimmed, string cleanCode, CancellationToken ct)
    {
        // 1. Try to resolve directly by provider code
        try
        {
            var provider = resolver.Resolve(trimmed);
            if (provider is IReportSchemaProvider schemaProvider)
            {
                return schemaProvider.GetSchemaFields();
            }
        }
        catch (KeyNotFoundException)
        {
            // Not a direct provider code
        }

        // 2. If it's a numeric template ID, lookup its settings
        if (long.TryParse(trimmed, out var templateId))
        {
            try
            {
                var settings = await service.GetSettingsAsync(templateId, ct);
                if (settings is not null && !string.IsNullOrWhiteSpace(settings.DataProviderCode))
                {
                    var provider = resolver.Resolve(settings.DataProviderCode);
                    if (provider is IReportSchemaProvider schemaProvider)
                    {
                        return schemaProvider.GetSchemaFields();
                    }
                }
            }
            catch {}
        }

        // Prefer an exact report code before matching shared tokens (SpecialNotice / SpecialNoticeThane).
        var matched = providers.FirstOrDefault(p =>
            p.ProviderCode.Replace("DataProvider", "").Equals(cleanCode, StringComparison.OrdinalIgnoreCase))
            ?? providers.FirstOrDefault(p =>
        {
            var pClean = p.ProviderCode.Replace("DataProvider", "").ToUpperInvariant();
            return pClean.Equals(cleanCode, StringComparison.OrdinalIgnoreCase)
                || cleanCode.Contains(pClean, StringComparison.OrdinalIgnoreCase)
                || pClean.Contains(cleanCode, StringComparison.OrdinalIgnoreCase);
        });

        if (matched is IReportSchemaProvider matchedSchema)
        {
            return matchedSchema.GetSchemaFields();
        }

        return Array.Empty<HtmlReportDataSourceFieldDto>();
    }

    [HttpGet("data-sources")]
    public ActionResult<IReadOnlyList<HtmlReportDataSourceDto>> DataSources()
    {
        var list = new List<HtmlReportDataSourceDto>();
        foreach (var p in providers)
        {
            var cleanName = p.ProviderCode.Replace("DataProvider", "");
            var code = string.Concat(cleanName.Select((x, i) => i > 0 && char.IsUpper(x) ? "_" + x.ToString() : x.ToString())).ToUpperInvariant();
            var fields = p is IReportSchemaProvider schemaProvider
                ? schemaProvider.GetSchemaFields()
                : Array.Empty<HtmlReportDataSourceFieldDto>();

            // Return every registered provider, even while its optional field schema is
            // still empty. ExecutionReportCode is the canonical resolver key; the
            // designer must persist this value instead of reconstructing it from a label.
            list.Add(new HtmlReportDataSourceDto(code, cleanName, p.ProviderCode, fields));
        }
        return Ok(list);
    }

    [HttpGet("preview-data/{providerOrReportCode}")]
    public async Task<ActionResult<object>> PreviewData(
        string providerOrReportCode,
        [FromQuery] string? propertyNo,
        [FromQuery] int? wardId,
        [FromQuery] int? propertyId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(providerOrReportCode)) return Ok(Array.Empty<object>());

        var trimmed = providerOrReportCode.Trim();
        IReportDataProvider? provider = null;

        try
        {
            provider = resolver.Resolve(trimmed);
        }
        catch (KeyNotFoundException)
        {
            var cleanCode = trimmed.Replace("_", "").Replace("-", "").ToUpperInvariant();
            provider = providers.FirstOrDefault(p =>
            {
                var pClean = p.ProviderCode.Replace("DataProvider", "").ToUpperInvariant();
                return pClean.Equals(cleanCode, StringComparison.OrdinalIgnoreCase)
                    || cleanCode.Contains(pClean, StringComparison.OrdinalIgnoreCase)
                    || pClean.Contains(cleanCode, StringComparison.OrdinalIgnoreCase);
            });
        }

        if (provider is null) return Ok(Array.Empty<object>());

        var parameters = new Dictionary<string, string>();
        if (!string.IsNullOrWhiteSpace(propertyNo)) parameters["propertyNo"] = propertyNo;
        if (wardId.HasValue && wardId.Value > 0) parameters["wardId"] = wardId.Value.ToString();
        if (propertyId.HasValue && propertyId.Value > 0) parameters["propertyId"] = propertyId.Value.ToString();

        try
        {
            if (provider is IPagedReportDataProvider pagedProvider)
            {
                var page = await pagedProvider.GetDataPageAsync(Guid.NewGuid(), parameters, "main", 1, 10, ct);
                return Ok(page.Rows);
            }

            var data = await provider.GetDataAsync(parameters, ct);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
