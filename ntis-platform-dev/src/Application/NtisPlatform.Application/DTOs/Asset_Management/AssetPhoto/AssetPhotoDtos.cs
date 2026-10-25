using System;
using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.Asset_Management;

public class AssetPhotoUploadResponseDto
{
    public int PhotoId { get; set; }
    public Guid DocumentGuid { get; set; }
    public int DocumentId { get; set; }
    public int DocumentBindingId { get; set; }
    public int AssetId { get; set; }
    public int PhotoTypeId { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}

public class AssetPhotoDto
{
    public int PhotoId { get; set; }
    public int AssetId { get; set; }
    public int PhotoTypeId { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }

    public int? DocumentBindingId { get; set; }
    public Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
}

/// <summary>An asset photo that has an uploaded file; <see cref="AssetPhotoDto.DocumentGuid"/> identifies the file.</summary>
public class AssetPhotoFileDto : AssetPhotoDto
{
    /// <summary>
    /// The sub-unit floor row (AMS.SubUnitsDetails) the photo was uploaded against; null when it
    /// belongs to the asset as a whole.
    /// </summary>
    public int? SubUnitsDetailsId { get; set; }
}

public class AssetPhotoTypeWithStatusDto
{
    public int PhotoTypeId { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public int? DisplayOrder { get; set; }

    public bool HasPhoto { get; set; }
    public int PhotoCount { get; set; }

    public int? PhotoId { get; set; }
    public string? Remarks { get; set; }
    public int? DocumentBindingId { get; set; }
    public Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
}

public class AssetPhotoGalleryDto
{
    public int AssetId { get; set; }
    public int TotalPhotos { get; set; }
    public List<AssetPhotoTypeGroupDto> PhotoTypes { get; set; } = new();
}

public class AssetPhotoTypeGroupDto
{
    public int PhotoTypeId { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    public int? DisplayOrder { get; set; }
    public bool HasPhoto { get; set; }
    public int PhotoCount { get; set; }
    public List<AssetPhotoDto> Photos { get; set; } = new();
}
