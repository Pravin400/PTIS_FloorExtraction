namespace NtisPlatform.Core.Models;

/// <summary>
/// DTO for Property Old Details Tab - includes joined data from PropertyMastOld and PropertyDetailsOld tables
/// Used for the GET /{propertyId}/old-details API endpoint
/// </summary>
public class PropertyOldDetailsDto
{
    public int PropertyId { get; set; }

    // From PropertyMastOld
    public string? OldWardNo { get; set; }
    public string? OldPropertyNo { get; set; }
    public string? OldPartitionNo { get; set; }
    public string? OldEgovNo { get; set; }
    public string? OldPlotArea { get; set; }
    public string? OldPlotNo { get; set; }
    public double? OldRV { get; set; }
    public double? OldALV { get; set; }
    public double? OldTotalTax { get; set; }
    public string? OldZoneNo { get; set; }
    public double? OldGeneralTax { get; set; }
    public string? OldCSN { get; set; }
    public double? OldConstructionArea { get; set; }

    // From PropertyDetailsOld (Aggregated if multiple records exist)
    public string? OldConstructionYear { get; set; }
    public double? OldCarpetAreaSqFeet { get; set; }
    public double? OldCarpetAreaSqMeter { get; set; }
    public string? OldConstructionTypeId { get; set; }
    public string? OldTypeOfUseId { get; set; }

    // Additional fields from PropertyMastOld / PropertyDetailsOld / PropertyMast
    public int? OldFloorId { get; set; }
    public int? OldPropertyTypeId { get; set; }
    public string? OldSubZoneNo { get; set; }
    public string? OldOwnerName { get; set; }
    public string? OldOccupierName { get; set; }
    public string? OldAddress { get; set; }
    public string? OldOwnerNameEnglish { get; set; }
    public string? OldOccupierNameEnglish { get; set; }
    public string? OldAddressEnglish { get; set; }
    public string? OldUseType { get; set; }
    public string? OldAssessmentDate { get; set; }
    public string? OldFlatOrShopNumber { get; set; }
    public string? OldWing { get; set; }
    public string? OldMobileNo { get; set; }
    public string? OldSocietyName { get; set; }
    public string? OldEmailId { get; set; }
    public double? OldParkingAreaSqFt { get; set; }
    public double? OldParkingAreaSqMtr { get; set; }
    public int? NoOfOldToilets { get; set; }
    public int? OldTotalRooms { get; set; }
}
