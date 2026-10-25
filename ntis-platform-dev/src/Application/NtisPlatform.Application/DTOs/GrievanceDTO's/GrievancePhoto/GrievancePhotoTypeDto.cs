using System;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;

public class GrievancePhotoTypeDto : BaseDtos
{
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public string? PhotoScope { get; set; }
}

public class CreateGrievancePhotoTypeDto : CreateBaseDtos
{
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public string? PhotoScope { get; set; }
}

public class UpdateGrievancePhotoTypeDto : UpdateBaseDtos
{
    public int Id { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public string? PhotoScope { get; set; }
}


