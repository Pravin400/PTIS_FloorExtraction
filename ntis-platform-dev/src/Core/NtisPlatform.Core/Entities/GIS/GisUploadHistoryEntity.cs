using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.GIS;

/// <summary>
/// Entity for Spatial GeoJSON File Upload Audit Log (Table: GIS.GisUploadHistory)
/// </summary>
[Table("GisUploadHistory", Schema = "GIS")]
public class GisUploadHistoryEntity : BaseEntity
{
    public string FileName { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public int RecordCount { get; set; }
    public int UploadedBy { get; set; }
    public string Status { get; set; } = "COMPLETED";
    public string? Remarks { get; set; }

    [NotMapped]
    public string FileType { get; set; } = "GeoJSON";
}
