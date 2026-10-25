namespace NtisPlatform.Core.Entities;

/// <summary>
/// Maps PTIS.MasterDataChangeEvent — one row per field-level change detected by the CDC pipeline,
/// populated by PTIS.usp_ProcessCdcChanges. Read-only from the application's perspective.
/// </summary>
public class MasterDataChangeEventEntity
{
    public long Id { get; set; }
    public long BatchId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string SourceSchema { get; set; } = string.Empty;
    public string SourceTable { get; set; } = string.Empty;
    public int? SourceRecordId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? FieldChanges { get; set; }
    public int? ChangedByUserId { get; set; }
    public string? ChangedBySqlLogin { get; set; }
    public string? DatabaseUser { get; set; }
    public string? ApplicationName { get; set; }
    public string? ClientIp { get; set; }
    public string? SqlStatement { get; set; }
    public DateTime? AuditEventTime { get; set; }
    public DateTime? ChangedAt { get; set; }
    public byte[]? CdcStartLsn { get; set; }
    public byte[]? CdcSeqVal { get; set; }
    public byte? CdcOperation { get; set; }
    public string DetectionSource { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    public string? ChangeSource { get; set; }
    public string? AttributionStatus { get; set; }

    public virtual MasterDataChangeBatchEntity? Batch { get; set; }
}
