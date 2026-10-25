using System;
using System.Collections.Generic;

namespace NtisPlatform.Core.Models.GIS;

/// <summary>
/// Structured DTO returned by the Asset GIS Popup API.
/// Contains all 21 key attributes, plus all associated Photos (Images), Legal/Revenue Documents,
/// and Child Shops / Tenants for Shopping Complexes and multi-unit assets.
/// </summary>
public class GisAssetPopupDetailsDto
{
    public int AssetId { get; set; }

    // Parent Asset info (populated if this asset is a child shop / gala)
    public int? ParentAssetId { get; set; }
    public string? ParentAssetName { get; set; }
    public string? ParentAssetNo { get; set; }
    
    // Top header / Identification
    public string? MPMSID { get; set; }
    public string? AssetNo { get; set; }
    public string? AssetName { get; set; }
    public string? AssetType { get; set; }
    public string? Department { get; set; }
    
    // In-Charge, Tenant & Status
    public string? InCharge { get; set; }
    public string? TenantName { get; set; }
    public string? Encroachment { get; set; }
    public string? MobileNo { get; set; }
    
    // Spatial & Plot Details
    public string? PlotNo { get; set; }
    public decimal? PlotArea { get; set; }
    public string? FormattedPlotArea { get; set; }
    public string? CitySurveyNo { get; set; }
    public decimal? CarpetAreaSqFt { get; set; }
    public string? FormattedCarpetArea { get; set; }
    public decimal? BuiltUpAreaSqFt { get; set; }
    public string? FormattedBuiltUpArea { get; set; }
    
    // Structure & Units
    public string? ConstYear { get; set; }
    public int TotalFloors { get; set; }
    public int RoomsOrUnits { get; set; }
    public string? Address { get; set; }
    
    // Financials
    public decimal CapitalValue { get; set; }
    public string FormattedCapitalValue { get; set; } = "₹ 0";
    public decimal AnnualRevenue { get; set; }
    public string FormattedAnnualRevenue { get; set; } = "₹ 0";
    public decimal? MonthlyRent { get; set; }
    public string? FormattedMonthlyRent { get; set; }
    
    // Links
    public string? GoogleMapLink { get; set; }
    public string? Link360 { get; set; }

    // Media & Documents
    /// <summary>
    /// List of all uploaded photos for this asset (Front View, Aerial, Boundary, Encroachment, etc.)
    /// </summary>
    public List<GisAssetPopupPhotoDto> Photos { get; set; } = new();

    /// <summary>
    /// List of all legal and revenue documents for this asset (7/12 Form, Survey Map, Akhiv Patrika, etc.)
    /// </summary>
    public List<GisAssetPopupDocumentDto> Documents { get; set; } = new();

    /// <summary>
    /// List of all child units / shops / galas belonging to this parent complex (AMS.AssetMaster WHERE ParentAssetId = @AssetId).
    /// </summary>
    public List<GisAssetChildShopDto> ChildShops { get; set; } = new();
}

/// <summary>
/// Child Shop / Gala / Sub-unit DTO for Shopping Complexes on the GIS Viewer.
/// </summary>
public class GisAssetChildShopDto
{
    public int AssetId { get; set; }
    public int? ParentAssetId { get; set; }
    public string? AssetNo { get; set; }
    public string? MPMSNo { get; set; }
    public string? AssetName { get; set; }
    public string? UnitNo { get; set; }
    public string? FloorName { get; set; }
    public decimal? CarpetAreaSqFt { get; set; }
    public decimal? BuiltUpAreaSqFt { get; set; }
    public string? TenantName { get; set; }
    public string? TenantMobile { get; set; }
    public string? OccupancyStatus { get; set; }
    public decimal? MonthlyRent { get; set; }
    public decimal? CapitalValue { get; set; }
    public decimal? AnnualRevenue { get; set; }
    public int PhotoCount { get; set; }
    public int DocumentCount { get; set; }
    public string? PrimaryPhotoUrl { get; set; }
}

/// <summary>
/// Photo / Image item for the Asset GIS popup panel.
/// Accurately bound to ams.AssetPhoto, ams.AssetPhotoType, CORE.DocumentBinding, and CORE.Document.
/// </summary>
public class GisAssetPopupPhotoDto
{
    public int PhotoId { get; set; }
    public int PhotoTypeId { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public string PhotoTypeCode { get; set; } = string.Empty;
    public int? DocumentBindingId { get; set; }
    public System.Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? FileExtension { get; set; }
    public string? MimeType { get; set; }
    public long? FileSizeBytes { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public int? DisplayOrder { get; set; }
}

/// <summary>
/// Document item (7/12 Extract, Survey Form, Property Card, Akhiv Patrika) for the Asset GIS popup panel.
/// Accurately bound to ams.AssetDocument, ams.AssetDocumentDefinition, CORE.DocumentBinding, and CORE.Document.
/// </summary>
public class GisAssetPopupDocumentDto
{
    public int DocumentId { get; set; }
    public int DocumentDefinitionId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentCode { get; set; } = string.Empty;
    public int? DocumentBindingId { get; set; }
    public System.Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? FileExtension { get; set; }
    public string? MimeType { get; set; }
    public long? FileSizeBytes { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public int? DisplayOrder { get; set; }
}
