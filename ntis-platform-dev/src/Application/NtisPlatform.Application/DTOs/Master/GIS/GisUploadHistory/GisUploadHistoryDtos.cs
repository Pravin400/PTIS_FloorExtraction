using System;
using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisUploadHistoryDto : BaseDtos
{
    public string FileName { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public int RecordCount { get; set; }
    public int UploadedBy { get; set; }
    public string Status { get; set; } = "COMPLETED";
    public string? Remarks { get; set; }
    public string FileType { get; set; } = "GeoJSON";
    public DateTime? UploadedAt => CreatedDate;
}

public class CreateGisUploadHistoryDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisUploadHistory_FileName_Required")]
    [StringLength(255, ErrorMessage = "GisUploadHistory_FileName_MaxLen_255")]
    public string FileName { get; set; } = null!;

    public long FileSizeBytes { get; set; }
    public int RecordCount { get; set; }
    public int UploadedBy { get; set; }

    [StringLength(50, ErrorMessage = "GisUploadHistory_Status_MaxLen_50")]
    public string Status { get; set; } = "COMPLETED";

    [StringLength(500, ErrorMessage = "GisUploadHistory_Remarks_MaxLen_500")]
    public string? Remarks { get; set; }

    [StringLength(50, ErrorMessage = "GisUploadHistory_FileType_MaxLen_50")]
    public string FileType { get; set; } = "GeoJSON";
}

public class UpdateGisUploadHistoryDto : UpdateBaseDtos
{
    public int RecordCount { get; set; }

    [StringLength(50, ErrorMessage = "GisUploadHistory_Status_MaxLen_50")]
    public string? Status { get; set; }

    [StringLength(500, ErrorMessage = "GisUploadHistory_Remarks_MaxLen_500")]
    public string? Remarks { get; set; }
}
