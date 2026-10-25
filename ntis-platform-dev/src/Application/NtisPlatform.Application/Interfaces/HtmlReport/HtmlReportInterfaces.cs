using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Interfaces.HtmlReport;

public interface IReportDataProviderResolver
{
    IReportDataProvider Resolve(string providerCode);
}

public interface IReportDataExecutor
{
    Task<HtmlReportDataEnvelope> ExecuteAsync(Guid requestId, string providerCode,
        Dictionary<string, string> parameters, int pageSize, CancellationToken ct = default);
    Task<HtmlReportDataPageEnvelope> ExecutePageAsync(Guid requestId, string providerCode,
        Dictionary<string, string> parameters, int page, int pageSize, bool requirePaging,
        CancellationToken ct = default);
}

public interface IHtmlReportDataAdapter
{
    string ProviderCode { get; }
    object Adapt(HtmlReportDataEnvelope envelope);
}

public interface IHtmlReportDataAdapterRegistry
{
    object Adapt(string providerCode, HtmlReportDataEnvelope envelope);
}

public interface IHtmlReportTemplateValidator
{
    HtmlReportValidationResult Validate(string templateJson);
}

public interface IHtmlReportService
{
    Task<IReadOnlyList<HtmlReportTemplateSummaryDto>> GetTemplatesAsync(CancellationToken ct = default);
    Task<HtmlReportTemplateDetailDto?> GetTemplateAsync(long id, CancellationToken ct = default);
    Task<HtmlReportTemplateDetailDto?> GetCurrentTemplateAsync(long id, CancellationToken ct = default);
    Task<HtmlReportSettingsDto?> GetSettingsAsync(long templateId, CancellationToken ct = default);
    Task<HtmlReportSettingsOptionsDto> GetSettingsOptionsAsync(CancellationToken ct = default);
    Task<HtmlReportTemplateDetailDto> CreateTemplateAsync(CreateHtmlTemplateRequest request, CancellationToken ct = default);
    Task ArchiveTemplateAsync(long templateId, CancellationToken ct = default);
    Task<HtmlReportSettingsDto> UpdateSettingsAsync(long templateId,
        UpdateHtmlReportSettingsRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<HtmlReportParameterDto>> GetParametersAsync(string reportCode,
        CancellationToken ct = default);
    Task<SaveHtmlTemplateResult> SaveDraftAsync(long templateId, SaveHtmlTemplateDraftRequest request, CancellationToken ct = default);
    Task PublishAsync(long templateId, long versionId, CancellationToken ct = default);
    Task<CreateHtmlReportJobResult> CreateJobAsync(CreateHtmlReportJobRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<HtmlReportJobStatusDto>> GetMyJobsAsync(int take, CancellationToken ct = default);
    Task<HtmlReportJobStatusDto?> GetJobAsync(Guid jobId, CancellationToken ct = default);
    Task<bool> CancelAsync(Guid jobId, CancellationToken ct = default);
    Task<(Stream Stream, string FileName, string ContentType)?> DownloadAsync(Guid jobId, CancellationToken ct = default);
    Task<(Stream Stream, string FileName, string ContentType)?> RenderDirectAsync(CreateHtmlReportJobRequest request, CancellationToken ct = default);
    Task ProcessQueuedJobAsync(Guid jobId, CancellationToken ct = default);
    Task<HtmlWorkerAuthenticateResult?> AuthenticateWorkerAsync(HtmlWorkerAuthenticateRequest request, CancellationToken ct = default);
    Task<HtmlWorkerDataPageResult> GetWorkerDataAsync(Guid jobId, int page, int pageSize,
        CancellationToken ct = default);
    Task<HtmlWorkerUploadResult> UploadWorkerFileAsync(Guid jobId, long? jobItemId, int? batchNumber,
        Stream pdf, string fileName, long fileSize, CancellationToken ct = default);
}
