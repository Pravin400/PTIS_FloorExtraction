using System;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

public class GrievancePhotoTypeEntity : BaseEntity
{
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public string? PhotoScope { get; set; }
}
