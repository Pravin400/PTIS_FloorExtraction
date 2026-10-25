using System.Text.Json;

namespace NtisPlatform.Application.DTOs.HtmlReport;

// ─── Template Summary & Detail DTOs ──────────────────────────────────────────

public class HtmlReportTemplateSummaryDto
{
    public string DataProviderCode { get; set; } = string.Empty;
    public bool CanDelete { get; set; }
    public int SortOrder { get; set; }
    public long Id { get; set; }
    public int ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public bool IsActive { get; set; }
    public string DataSourceCode { get; set; } = string.Empty;
    public long? PublishedVersionId { get; set; }
    public int? PublishedVersionNo { get; set; }
    public long? DraftVersionId { get; set; }
    public int? DraftVersionNo { get; set; }

    public HtmlReportTemplateSummaryDto() { }

    public HtmlReportTemplateSummaryDto(long id, int reportDefinitionId, string reportCode,
        string reportName, int? moduleId, string moduleCode, int? tenantId, bool isActive,
        string dataSourceCode, long? publishedVersionId, int? publishedVersionNo,
        long? draftVersionId, int? draftVersionNo)
    {
        Id = id;
        ReportDefinitionId = reportDefinitionId;
        ReportCode = reportCode;
        ReportName = reportName;
        ModuleId = moduleId;
        ModuleCode = moduleCode;
        TenantId = tenantId;
        IsActive = isActive;
        DataSourceCode = dataSourceCode;
        PublishedVersionId = publishedVersionId;
        PublishedVersionNo = publishedVersionNo;
        DraftVersionId = draftVersionId;
        DraftVersionNo = draftVersionNo;
    }
}

public class HtmlReportTemplateVersionDto
{
    public long Id { get; set; }
    public int VersionNo { get; set; }
    public int SchemaVersion { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TemplateJson { get; set; } = string.Empty;
    public string? ValidationJson { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? PublishedDate { get; set; }

    public HtmlReportTemplateVersionDto() { }

    public HtmlReportTemplateVersionDto(long id, int versionNo, int schemaVersion, string status,
        string templateJson, string? validationJson, DateTime createdDate, DateTime? publishedDate)
    {
        Id = id;
        VersionNo = versionNo;
        SchemaVersion = schemaVersion;
        Status = status;
        TemplateJson = templateJson;
        ValidationJson = validationJson;
        CreatedDate = createdDate;
        PublishedDate = publishedDate;
    }
}

public class HtmlReportParameterDto
{
    public int? Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public string? CascadeFromKey { get; set; }
    public bool IsActive { get; set; } = true;

    public HtmlReportParameterDto() { }

    public HtmlReportParameterDto(int? id, string key, string label, string type,
        bool isRequired, int sortOrder, string? cascadeFromKey, bool isActive = true)
    {
        Id = id;
        Key = key;
        Label = label;
        Type = type;
        IsRequired = isRequired;
        SortOrder = sortOrder;
        CascadeFromKey = cascadeFromKey;
        IsActive = isActive;
    }
}

public class HtmlReportSettingsDto
{
    public long TemplateId { get; set; }
    public int ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public string TenantScope { get; set; } = string.Empty;
    public int CurrentTenantId { get; set; }
    public bool IsActive { get; set; }
    public string DataSourceCode { get; set; } = string.Empty;
    public string DataProviderCode { get; set; } = string.Empty;
    public IReadOnlyList<HtmlReportParameterDto> Parameters { get; set; } = [];

    public HtmlReportSettingsDto() { }

    public HtmlReportSettingsDto(long templateId, int reportDefinitionId, string reportCode,
        string reportName, int? moduleId, string moduleName, int? tenantId, string tenantScope,
        int currentTenantId, bool isActive, string dataSourceCode, string dataProviderCode,
        IReadOnlyList<HtmlReportParameterDto> parameters)
    {
        TemplateId = templateId;
        ReportDefinitionId = reportDefinitionId;
        ReportCode = reportCode;
        ReportName = reportName;
        ModuleId = moduleId;
        ModuleName = moduleName;
        TenantId = tenantId;
        TenantScope = tenantScope;
        CurrentTenantId = currentTenantId;
        IsActive = isActive;
        DataSourceCode = dataSourceCode;
        DataProviderCode = dataProviderCode;
        Parameters = parameters;
    }
}

public class HtmlReportTemplateDetailDto
{
    public long Id { get; set; }
    public int ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public bool IsActive { get; set; }
    public string DataSourceCode { get; set; } = string.Empty;
    public string DataProviderCode { get; set; } = string.Empty;
    public IReadOnlyList<HtmlReportParameterDto> Parameters { get; set; } = [];
    public IReadOnlyList<HtmlReportTemplateVersionDto> Versions { get; set; } = [];

    public HtmlReportTemplateDetailDto() { }

    public HtmlReportTemplateDetailDto(long id, int reportDefinitionId, string reportCode,
        string reportName, int? moduleId, string moduleCode, int? tenantId, bool isActive,
        string dataSourceCode, string dataProviderCode, IReadOnlyList<HtmlReportParameterDto> parameters,
        IReadOnlyList<HtmlReportTemplateVersionDto> versions)
    {
        Id = id;
        ReportDefinitionId = reportDefinitionId;
        ReportCode = reportCode;
        ReportName = reportName;
        ModuleId = moduleId;
        ModuleCode = moduleCode;
        TenantId = tenantId;
        IsActive = isActive;
        DataSourceCode = dataSourceCode;
        DataProviderCode = dataProviderCode;
        Parameters = parameters;
        Versions = versions;
    }
}

// ─── Requests & Results ──────────────────────────────────────────────────────

public class CreateHtmlTemplateRequest
{
    public string ReportCode { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public string ModuleCode { get; set; } = string.Empty;
    public string DataSourceCode { get; set; } = string.Empty;
    public string TemplateJson { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string TenantScope { get; set; } = "CurrentTenant";
    public int? TenantId { get; set; }
    public bool IsActive { get; set; } = true;
    public string? DataProviderCode { get; set; }
    public IReadOnlyList<HtmlReportParameterDto>? Parameters { get; set; }

    public CreateHtmlTemplateRequest() { }

    public CreateHtmlTemplateRequest(string reportCode, string reportName, string moduleCode,
        string dataSourceCode, string templateJson, int? moduleId = null, string tenantScope = "CurrentTenant",
        int? tenantId = null, bool isActive = true, string? DataProviderCode = null,
        IReadOnlyList<HtmlReportParameterDto>? parameters = null)
    {
        ReportCode = reportCode;
        ReportName = reportName;
        ModuleCode = moduleCode;
        DataSourceCode = dataSourceCode;
        TemplateJson = templateJson;
        ModuleId = moduleId;
        TenantScope = tenantScope;
        TenantId = tenantId;
        IsActive = isActive;
        this.DataProviderCode = DataProviderCode;
        Parameters = parameters;
    }
}

public class UpdateHtmlReportSettingsRequest
{
    public string ReportName { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string TenantScope { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public bool IsActive { get; set; }
    public string DataSourceCode { get; set; } = string.Empty;
    public string DataProviderCode { get; set; } = string.Empty;
    public IReadOnlyList<HtmlReportParameterDto> Parameters { get; set; } = [];

    public UpdateHtmlReportSettingsRequest() { }

    public UpdateHtmlReportSettingsRequest(string reportName, int? moduleId,
        string tenantScope, int? tenantId, bool isActive, string dataSourceCode,
        string dataProviderCode, IReadOnlyList<HtmlReportParameterDto> parameters)
    {
        ReportName = reportName;
        ModuleId = moduleId;
        TenantScope = tenantScope;
        TenantId = tenantId;
        IsActive = isActive;
        DataSourceCode = dataSourceCode;
        DataProviderCode = dataProviderCode;
        Parameters = parameters;
    }
}

public class HtmlReportSettingsOptionsDto
{
    public int CurrentTenantId { get; set; }
    public IReadOnlyList<HtmlReportModuleOptionDto> Modules { get; set; } = [];
    public IReadOnlyList<string> DataProviderCodes { get; set; } = [];

    public HtmlReportSettingsOptionsDto() { }

    public HtmlReportSettingsOptionsDto(int currentTenantId,
        IReadOnlyList<HtmlReportModuleOptionDto> modules, IReadOnlyList<string> dataProviderCodes)
    {
        CurrentTenantId = currentTenantId;
        Modules = modules;
        DataProviderCodes = dataProviderCodes;
    }
}

public class HtmlReportModuleOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public HtmlReportModuleOptionDto() { }

    public HtmlReportModuleOptionDto(int id, string name)
    {
        Id = id;
        Name = name;
    }
}

public class SaveHtmlTemplateDraftRequest
{
    public string TemplateJson { get; set; } = string.Empty;

    public SaveHtmlTemplateDraftRequest() { }

    public SaveHtmlTemplateDraftRequest(string templateJson)
    {
        TemplateJson = templateJson;
    }
}

public class SaveHtmlTemplateResult
{
    public long VersionId { get; set; }
    public int VersionNo { get; set; }
    public string Status { get; set; } = string.Empty;

    public SaveHtmlTemplateResult() { }

    public SaveHtmlTemplateResult(long versionId, int versionNo, string status)
    {
        VersionId = versionId;
        VersionNo = versionNo;
        Status = status;
    }
}

public class CreateHtmlReportJobRequest
{
    public string ReportCode { get; set; } = string.Empty;
    public Dictionary<string, string> Parameters { get; set; } = [];
    public string? OutputMode { get; set; }
    public string? IdempotencyKey { get; set; }
    public string? JobType { get; set; }

    public CreateHtmlReportJobRequest() { }

    public CreateHtmlReportJobRequest(string reportCode, Dictionary<string, string> parameters,
        string? outputMode, string? idempotencyKey, string? jobType = null)
    {
        ReportCode = reportCode;
        Parameters = parameters;
        OutputMode = outputMode;
        IdempotencyKey = idempotencyKey;
        JobType = jobType;
    }
}

public class CreateHtmlReportJobResult
{
    public Guid JobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalRecords { get; set; }

    public CreateHtmlReportJobResult() { }

    public CreateHtmlReportJobResult(Guid jobId, string status, int totalRecords)
    {
        JobId = jobId;
        Status = status;
        TotalRecords = totalRecords;
    }
}

public class HtmlReportJobStatusDto
{
    public Guid JobId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int FailedRecords { get; set; }
    public int CompletedBatches { get; set; }
    public int TotalBatches { get; set; }
    public int CurrentChunk { get; set; }
    public string Stage { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    public int TotalChunks => TotalBatches;
    public int CompletedChunks => CompletedBatches;
    public decimal ProgressPercentage => TotalRecords == 0 ? 0 :
        Math.Min(100m, Math.Round(100m * (ProcessedRecords + FailedRecords) / TotalRecords, 2));

    public HtmlReportJobStatusDto() { }

    public HtmlReportJobStatusDto(Guid jobId, string reportCode, string status, int totalRecords,
        int processedRecords, int failedRecords, int completedBatches, int totalBatches, int currentChunk,
        string stage, string? errorMessage, DateTime createdDate, DateTime? completedDate)
    {
        JobId = jobId;
        ReportCode = reportCode;
        Status = status;
        TotalRecords = totalRecords;
        ProcessedRecords = processedRecords;
        FailedRecords = failedRecords;
        CompletedBatches = completedBatches;
        TotalBatches = totalBatches;
        CurrentChunk = currentChunk;
        Stage = stage;
        ErrorMessage = errorMessage;
        CreatedDate = createdDate;
        CompletedDate = completedDate;
    }
}

// ─── Validation DTOs ─────────────────────────────────────────────────────────

public class HtmlReportValidationIssue
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;

    public HtmlReportValidationIssue() { }

    public HtmlReportValidationIssue(string code, string message, string path)
    {
        Code = code;
        Message = message;
        Path = path;
    }
}

public class HtmlReportValidationResult
{
    public bool IsValid { get; set; }
    public int SchemaVersion { get; set; }
    public IReadOnlyList<HtmlReportValidationIssue> Errors { get; set; } = [];
    public IReadOnlyList<HtmlReportValidationIssue> Warnings { get; set; } = [];

    public HtmlReportValidationResult() { }

    public HtmlReportValidationResult(bool isValid, int schemaVersion,
        IReadOnlyList<HtmlReportValidationIssue> errors, IReadOnlyList<HtmlReportValidationIssue> warnings)
    {
        IsValid = isValid;
        SchemaVersion = schemaVersion;
        Errors = errors;
        Warnings = warnings;
    }
}

// ─── Data Envelopes ──────────────────────────────────────────────────────────

public class HtmlReportDataEnvelope
{
    public IReadOnlyList<JsonElement> Main { get; set; } = [];
    public IReadOnlyDictionary<string, IReadOnlyList<JsonElement>> Sections { get; set; } = new Dictionary<string, IReadOnlyList<JsonElement>>();
    public Guid RequestId { get; set; }

    public HtmlReportDataEnvelope() { }

    public HtmlReportDataEnvelope(IReadOnlyList<JsonElement> main,
        IReadOnlyDictionary<string, IReadOnlyList<JsonElement>> sections, Guid requestId)
    {
        Main = main;
        Sections = sections;
        RequestId = requestId;
    }
}

public class HtmlReportDataPageEnvelope
{
    public HtmlReportDataEnvelope Envelope { get; set; } = null!;
    public IReadOnlyList<JsonElement> DriverRows { get; set; } = [];
    public int? TotalCount { get; set; }
    public bool HasMore { get; set; }
    public bool SupportsPaging { get; set; }

    public HtmlReportDataPageEnvelope() { }

    public HtmlReportDataPageEnvelope(HtmlReportDataEnvelope envelope,
        IReadOnlyList<JsonElement> driverRows, int? totalCount, bool hasMore, bool supportsPaging)
    {
        Envelope = envelope;
        DriverRows = driverRows;
        TotalCount = totalCount;
        HasMore = hasMore;
        SupportsPaging = supportsPaging;
    }
}

// ─── Worker Pipeline DTOs ────────────────────────────────────────────────────

public class HtmlWorkerAuthenticateRequest
{
    public Guid JobId { get; set; }
    public string ShortLivedToken { get; set; } = string.Empty;

    public HtmlWorkerAuthenticateRequest() { }

    public HtmlWorkerAuthenticateRequest(Guid jobId, string shortLivedToken)
    {
        JobId = jobId;
        ShortLivedToken = shortLivedToken;
    }
}

public class HtmlWorkerAuthenticateResult
{
    public string LongLivedToken { get; set; } = string.Empty;
    public string ReportCode { get; set; } = string.Empty;
    public string DataProviderCode { get; set; } = string.Empty;
    public string ParametersJson { get; set; } = string.Empty;
    public string TemplateJson { get; set; } = string.Empty;
    public IReadOnlyDictionary<string, string> Fragments { get; set; } = new Dictionary<string, string>();

    public HtmlWorkerAuthenticateResult() { }

    public HtmlWorkerAuthenticateResult(string longLivedToken, string reportCode,
        string dataProviderCode, string parametersJson, string templateJson, IReadOnlyDictionary<string, string> fragments)
    {
        LongLivedToken = longLivedToken;
        ReportCode = reportCode;
        DataProviderCode = dataProviderCode;
        ParametersJson = parametersJson;
        TemplateJson = templateJson;
        Fragments = fragments;
    }
}

public class HtmlWorkerDataRequest
{
    public Guid JobId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5000;

    public HtmlWorkerDataRequest() { }

    public HtmlWorkerDataRequest(Guid jobId, int page = 1, int pageSize = 5000)
    {
        JobId = jobId;
        Page = page;
        PageSize = pageSize;
    }
}

public class HtmlWorkerDataPageResult
{
    public JsonElement Data { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int RecordCount { get; set; }
    public int? TotalCount { get; set; }
    public bool HasMore { get; set; }
    public bool SupportsPaging { get; set; }
    public string? StartKey { get; set; }
    public string? EndKey { get; set; }

    public HtmlWorkerDataPageResult() { }

    public HtmlWorkerDataPageResult(JsonElement data, int page, int pageSize, int recordCount,
        int? totalCount, bool hasMore, bool supportsPaging, string? startKey, string? endKey)
    {
        Data = data;
        Page = page;
        PageSize = pageSize;
        RecordCount = recordCount;
        TotalCount = totalCount;
        HasMore = hasMore;
        SupportsPaging = supportsPaging;
        StartKey = startKey;
        EndKey = endKey;
    }
}

public class HtmlWorkerUploadResult
{
    public Guid DocumentGuid { get; set; }

    public HtmlWorkerUploadResult() { }

    public HtmlWorkerUploadResult(Guid documentGuid)
    {
        DocumentGuid = documentGuid;
    }
}

// ─── Data Source & Fields ────────────────────────────────────────────────────

public class HtmlReportDataSourceDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ExecutionReportCode { get; set; } = string.Empty;
    public IReadOnlyList<HtmlReportDataSourceFieldDto> Fields { get; set; } = [];

    public HtmlReportDataSourceDto() { }

    public HtmlReportDataSourceDto(string code, string name, string executionReportCode,
        IReadOnlyList<HtmlReportDataSourceFieldDto> fields)
    {
        Code = code;
        Name = name;
        ExecutionReportCode = executionReportCode;
        Fields = fields;
    }
}

public class HtmlReportDataSourceFieldDto
{
    public string Path { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string ElementType { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public string ValueType { get; set; } = "string";

    public HtmlReportDataSourceFieldDto() { }

    public HtmlReportDataSourceFieldDto(string path, string label, string elementType, string group, string valueType = "string")
    {
        Path = path;
        Label = label;
        ElementType = elementType;
        Group = group;
        ValueType = valueType;
    }
}
