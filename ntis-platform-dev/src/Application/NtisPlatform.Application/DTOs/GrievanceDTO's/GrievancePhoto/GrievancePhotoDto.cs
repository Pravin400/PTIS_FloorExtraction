using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Grievance;

public class GrievancePhotoDto
{
    public int Id { get; set; }
    public int GrievanceApplicationId { get; set; }
    public int PhotoTypeId { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public string PhotoTypeCode { get; set; } = string.Empty;
    public int? DocumentBindingId { get; set; }
    public bool IsLatest { get; set; }
    public string? Remarks { get; set; }
    
    // Core Document details so frontend can display the image
    public string? FileName { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileExtension { get; set; }
    public string? MimeType { get; set; }
    public string? StoragePath { get; set; }
    public Guid? DocumentGuid { get; set; }
}

public class UploadGrievancePhotoDto 
{
    public int GrievanceApplicationId { get; set; }
    public int PhotoTypeId { get; set; }
    public string? Remarks { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class UploadMultipleGrievancePhotosDto 
{
    public int GrievanceApplicationId { get; set; }
    public int PhotoTypeId { get; set; }
    public string? Remarks { get; set; }
    public List<IFormFile> Files { get; set; } = new List<IFormFile>();
}
