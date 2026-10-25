namespace NtisPlatform.Application.DTOs.Property;

/// <summary>
/// DTO representing individual property details combining Basic Details, KYC Details,
/// and Individual-level Additional Revenue / Tax metrics.
/// Used by GET /api/Property/{propertyId}/individual.
/// </summary>
public class PropertyIndividualDto
{
    // Identification & Header
    public int PropertyId { get; set; }
    public string? PropertyNo { get; set; }
    public string? UpicId { get; set; }

    // Owner, Occupier & KYC
    public string? OwnerName { get; set; }
    public string? OwnerNameRegional { get; set; }
    public string? OccupierName { get; set; }
    public string? OccupierNameRegional { get; set; }
    public string? OwnerCategory { get; set; }
    public string? AadharNo { get; set; }
    public string? OwnerTitle { get; set; }

    // Contact & Address
    public string? MobileNo { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? EmailId { get; set; }
    public string? AddressEnglish { get; set; }
    public string? AddressRegional { get; set; }
    public string? PinCode { get; set; }

    // Location & Basic Info
    public string? Division { get; set; }
    public string? MoujaName { get; set; }
    public string? SurveyNo { get; set; }
    public string? TaxZoneNo { get; set; }
    public string? SubZoneNo { get; set; }
    public string? RateSectionName { get; set; }
    public string? PlotNo { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? FlatOrShopNameEnglish { get; set; }
    public int? WingDetailId { get; set; }
    public string? WingName { get; set; }

    // Areas (Sq. Ft / Sq. Mtr)
    public double? PlotAreaFt { get; set; }
    public double? PlotAreaMtr { get; set; }
    public double? CarpetAreasqFt { get; set; }
    public double? CarpetAreasqMtr { get; set; }
    public double? BuiltUpAreasqFt { get; set; }
    public double? BuiltUpAreasqMtr { get; set; }
    public double? OldCarpetAreaSqFeet { get; set; }
    public double? OldCarpetAreaSqMeter { get; set; }
    public double? OldBuiltupAreaSqFeet { get; set; }
    public double? OldBuiltupAreaSqMeter { get; set; }

    // Classification & Description
    public int? CategoryId { get; set; }
    public string? PropertyCategory { get; set; }
    public string? PropertyDescription { get; set; }

    // Photos & Documents
    public Guid? IndividualPropertyGuid { get; set; }
    public Guid? IndividualPropertyPhotoGuid { get; set; }
    public Guid? SocietyBuildingPhotoGuid { get; set; }

    // Additional Revenue (Individual Level)
    public PropertyIndividualRevenueDto AdditionalRevenue { get; set; } = new();
}

public class PropertyIndividualRevenueDto
{
    public decimal CurrentTax { get; set; }
    public decimal RetroTax { get; set; }
    public decimal TotalTax { get; set; }
    public decimal CurrentDemand { get; set; }
    public decimal TotalDemand { get; set; }
    public decimal Collection { get; set; }
    public decimal TotalBalance { get; set; }
    public decimal OldCurrentTax { get; set; }
    public decimal DifferenceAmount { get; set; }
    public double ChangePercent { get; set; }
    public decimal PendingCurrent { get; set; }
    public decimal PendingDemand { get; set; }
}
