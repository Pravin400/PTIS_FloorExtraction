namespace NtisPlatform.Core.Entities;

/// <summary>
/// Maps PTIS.MasterDataChangeBatch — populated by PTIS.usp_ProcessCdcChanges (CDC-based master-data
/// change pipeline, built at the DB layer). The application never inserts into this table; it only
/// reads it to drive the Add Taxes "master data changed" banner/export.
/// </summary>
public class MasterDataChangeBatchEntity
{
    public long Id { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string SourceSchema { get; set; } = string.Empty;
    public string SourceTable { get; set; } = string.Empty;
    public string? CalculationType { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RemarkSummary { get; set; }
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorDetail { get; set; }
    public byte[]? CdcStartLsn { get; set; }
    public bool IsActive { get; set; }
}
