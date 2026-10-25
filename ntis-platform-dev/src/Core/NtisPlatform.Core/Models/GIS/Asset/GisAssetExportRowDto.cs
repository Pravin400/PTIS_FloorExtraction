namespace NtisPlatform.Core.Models.GIS;

/// <summary>
/// Data row representing a filtered GIS Asset point/record for Excel export.
/// Contains comprehensive identification, classification, location, spatial coordinates,
/// structural metrics, valuation, revenue, and status fields.
/// </summary>
public class GisAssetExportRowDto
{
    public int AssetId { get; set; }
    public string? MPMSID { get; set; }
    public string? AssetNo { get; set; }
    public string? AssetName { get; set; }
    public string? Department { get; set; }
    public string? AssetCategory { get; set; }
    public string? AssetType { get; set; }
    public string? OwnershipType { get; set; }
    public string? Zone { get; set; }
    public string? Ward { get; set; }
    public string? PlotNo { get; set; }
    public string? CitySurveyNo { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public decimal? PlotAreaSqFt { get; set; }
    public decimal? CarpetAreaSqFt { get; set; }
    public decimal? BuiltUpAreaSqFt { get; set; }
    public string? ConstYear { get; set; }
    public int TotalFloors { get; set; }
    public int RoomsOrUnits { get; set; }
    public decimal CapitalValue { get; set; }
    public decimal AnnualRevenue { get; set; }
    public string? Encroachment { get; set; }
    public string? InCharge { get; set; }
    public string? MobileNo { get; set; }
    public string? GoogleMapLink { get; set; }
    public string? Link360 { get; set; }
    public int PhotoCount { get; set; }
    public int DocumentCount { get; set; }
}
