namespace NtisPlatform.Core.Entities.Reporting;

public static class HtmlReportJobTypes
{
    public const string Single = "Single";
    public const string Bulk = "Bulk";

    public static bool IsValid(string? value) =>
        value is not null && (value.Equals(Single, StringComparison.OrdinalIgnoreCase)
            || value.Equals(Bulk, StringComparison.OrdinalIgnoreCase));

    public static string Normalize(string value) =>
        value.Equals(Single, StringComparison.OrdinalIgnoreCase) ? Single :
        value.Equals(Bulk, StringComparison.OrdinalIgnoreCase) ? Bulk :
        throw new ArgumentOutOfRangeException(nameof(value), value, "JobType must be Single or Bulk.");
}

public class HtmlReportTemplateEntity
{
    public long Id { get; set; }
    public int ReportDefinitionId { get; set; }
    public int? OrganizationId { get; set; }
    public string TemplateCode { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string DataSourceCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ICollection<HtmlReportTemplateVersionEntity> Versions { get; set; } = [];
}

public class HtmlReportTemplateVersionEntity
{
    public long Id { get; set; }
    public long TemplateId { get; set; }
    public int VersionNo { get; set; }
    public int SchemaVersion { get; set; }
    public string Status { get; set; } = "Draft";
    public string TemplateJson { get; set; } = string.Empty;
    public byte[] ContentHash { get; set; } = [];
    public string? ValidationJson { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? PublishedBy { get; set; }
    public DateTime? PublishedDate { get; set; }
    public int? ArchivedBy { get; set; }
    public DateTime? ArchivedDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public HtmlReportTemplateEntity Template { get; set; } = null!;
    public ICollection<HtmlReportTemplateFragmentEntity> Fragments { get; set; } = [];
}

public class HtmlReportFragmentEntity
{
    public long Id { get; set; }
    public int OrganizationId { get; set; }
    public string FragmentCode { get; set; } = string.Empty;
    public string FragmentName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ICollection<HtmlReportFragmentVersionEntity> Versions { get; set; } = [];
}

public class HtmlReportFragmentVersionEntity
{
    public long Id { get; set; }
    public long FragmentId { get; set; }
    public int VersionNo { get; set; }
    public int SchemaVersion { get; set; }
    public string Status { get; set; } = "Draft";
    public string FragmentJson { get; set; } = string.Empty;
    public byte[] ContentHash { get; set; } = [];
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? PublishedBy { get; set; }
    public DateTime? PublishedDate { get; set; }
    public DateTime? ArchivedDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public HtmlReportFragmentEntity Fragment { get; set; } = null!;
}

public class HtmlReportTemplateFragmentEntity
{
    public long TemplateVersionId { get; set; }
    public long FragmentVersionId { get; set; }
    public string FragmentCode { get; set; } = string.Empty;
    public HtmlReportTemplateVersionEntity TemplateVersion { get; set; } = null!;
    public HtmlReportFragmentVersionEntity FragmentVersion { get; set; } = null!;
}

public class HtmlReportJobEntity
{
    public Guid Id { get; set; }
    public int OrganizationId { get; set; }
    public string PlatformBaseUrl { get; set; } = string.Empty;
    public int ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public long TemplateVersionId { get; set; }
    public string DataProviderCode { get; set; } = string.Empty;
    public string JobType { get; set; } = HtmlReportJobTypes.Single;
    public string OutputMode { get; set; } = "Merged";
    public string? ParametersJson { get; set; }
    public string Status { get; set; } = "Queued";
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int FailedRecords { get; set; }
    public int BatchSize { get; set; }
    public int TotalBatches { get; set; }
    public int CompletedBatches { get; set; }
    public int CurrentChunk { get; set; }
    public string Stage { get; set; } = "Queued";
    public int RequestedByUserId { get; set; }
    public bool CancellationRequested { get; set; }
    public int AttemptCount { get; set; }
    public int MaxAttemptCount { get; set; }
    public DateTime? NextAttemptDate { get; set; }
    public Guid? LeaseId { get; set; }
    public string? LeaseOwner { get; set; }
    public DateTime? LeaseExpiresAt { get; set; }
    public string? IdempotencyKey { get; set; }
    public string? ShortLivedToken { get; set; }
    public DateTime? SltExpiresAt { get; set; }
    public bool SltConsumed { get; set; }
    public DateTime? SltConsumedAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? StartedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ICollection<HtmlReportJobItemEntity> Items { get; set; } = [];
    public ICollection<HtmlReportChunkEntity> Chunks { get; set; } = [];
    public ICollection<HtmlReportFileEntity> Files { get; set; } = [];
}

public class HtmlReportChunkEntity
{
    public long Id { get; set; }
    public Guid JobId { get; set; }
    public int OrganizationId { get; set; }
    public int ChunkNumber { get; set; }
    public string? StartKey { get; set; }
    public string? EndKey { get; set; }
    public int RecordCount { get; set; }
    public bool HasMore { get; set; }
    public string Status { get; set; } = "Pending";
    public string? OutputPath { get; set; }
    public int? PageCount { get; set; }
    public int RetryCount { get; set; }
    public DateTime? StartedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? ErrorMessage { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public HtmlReportJobEntity Job { get; set; } = null!;
}

public class HtmlReportJobItemEntity
{
    public long Id { get; set; }
    public Guid JobId { get; set; }
    public string RecordKey { get; set; } = string.Empty;
    public int BatchNumber { get; set; }
    public string Status { get; set; } = "Queued";
    public int AttemptCount { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? StartedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public HtmlReportJobEntity Job { get; set; } = null!;
}

public class HtmlReportFileEntity
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public long? JobItemId { get; set; }
    public Guid DocumentGuid { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSizeBytes { get; set; }
    public int? PageCount { get; set; }
    public int? BatchNumber { get; set; }
    public byte[]? ContentHash { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public HtmlReportJobEntity Job { get; set; } = null!;
}

public class HtmlReportOutboxEntity
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string MessageType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime OccurredDate { get; set; }
    public DateTime? PublishedDate { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? NextAttemptDate { get; set; }
    public string? LastError { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public class HtmlReportJobLogEntity
{
    public long Id { get; set; }
    public Guid JobId { get; set; }
    public long? JobItemId { get; set; }
    public string? FromStatus { get; set; }
    public string? ToStatus { get; set; }
    public string? Message { get; set; }
    public string? WorkerId { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class HtmlReportWorkerInstanceEntity
{
    public Guid WorkerInstanceId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public DateTime StartedDate { get; set; }
    public DateTime LastHeartbeatDate { get; set; }
    public int ActiveJobCount { get; set; }
    public string? Version { get; set; }
    public bool IsDraining { get; set; }
}
