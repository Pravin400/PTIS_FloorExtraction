using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Core.Models;

/// <summary>
/// DTO for updating Property Old Details Tab
/// Used for the PUT /{propertyId}/old-details API endpoint
/// </summary>
public class UpdatePropertyOldDetailsDto
{
    [StringLength(10, ErrorMessage = "OldWardNo cannot exceed 10 characters.")]
    public string? OldWardNo { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "OldFloorId must be a non-negative number.")]
    public int? OldFloorId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldGeneralTax cannot be negative.")]
    public float? OldGeneralTax { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldConstructionArea cannot be negative.")]
    public float? OldConstructionArea { get; set; }

    [StringLength(30, ErrorMessage = "OldCSN cannot exceed 30 characters.")]
    public string? OldCSN { get; set; }

    [StringLength(10, ErrorMessage = "OldPropertyNo cannot exceed 10 characters.")]
    public string? OldPropertyNo { get; set; }

    [StringLength(10, ErrorMessage = "OldPartitionNo cannot exceed 10 characters.")]
    public string? OldPartitionNo { get; set; }

    [StringLength(10, ErrorMessage = "OldEgovNo cannot exceed 10 characters.")]
    public string? OldEgovNo { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldPlotArea cannot be negative.")]
    public double? OldPlotArea { get; set; }

    [StringLength(20, ErrorMessage = "OldPlotNo cannot exceed 20 characters.")]
    public string? OldPlotNo { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldRV cannot be negative.")]
    public double? OldRV { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldALV cannot be negative.")]
    public double? OldALV { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldTotalTax cannot be negative.")]
    public double? OldTotalTax { get; set; }

    [StringLength(20, ErrorMessage = "OldZoneNo cannot exceed 20 characters.")]
    public string? OldZoneNo { get; set; }

    [StringLength(4, ErrorMessage = "OldConstructionYear cannot exceed 4 characters.")]
    [RegularExpression(@"^$|^\d{4}$", ErrorMessage = "OldConstructionYear must be a 4-digit year.")]
    public string? OldConstructionYear { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldCarpetAreaSqFeet cannot be negative.")]
    public double? OldCarpetAreaSqFeet { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldCarpetAreaSqMeter cannot be negative.")]
    public double? OldCarpetAreaSqMeter { get; set; }

    public int? OldConstructionTypeId { get; set; }

    public int? OldTypeOfUseId { get; set; }

    public int? OldPropertyTypeId { get; set; }

    [StringLength(1000, ErrorMessage = "OldOwnerName cannot exceed 1000 characters.")]
    public string? OldOwnerName { get; set; }

    [StringLength(1000, ErrorMessage = "OldOccupierName cannot exceed 1000 characters.")]
    public string? OldOccupierName { get; set; }

    [StringLength(500, ErrorMessage = "OldAddress cannot exceed 500 characters.")]
    public string? OldAddress { get; set; }

    [StringLength(1000, ErrorMessage = "OldOwnerNameEnglish cannot exceed 1000 characters.")]
    public string? OldOwnerNameEnglish { get; set; }

    [StringLength(1000, ErrorMessage = "OldOccupierNameEnglish cannot exceed 1000 characters.")]
    public string? OldOccupierNameEnglish { get; set; }

    [StringLength(500, ErrorMessage = "OldAddressEnglish cannot exceed 500 characters.")]
    public string? OldAddressEnglish { get; set; }

    [StringLength(100, ErrorMessage = "OldUseType cannot exceed 100 characters.")]
    public string? OldUseType { get; set; }

    public string? OldAssessmentDate { get; set; }

    [StringLength(50, ErrorMessage = "OldFlatOrShopNumber cannot exceed 50 characters.")]
    public string? OldFlatOrShopNumber { get; set; }

    [StringLength(20, ErrorMessage = "OldWing cannot exceed 20 characters.")]
    public string? OldWing { get; set; }

    [StringLength(13, ErrorMessage = "OldMobileNo cannot exceed 13 characters.")]
    public string? OldMobileNo { get; set; }

    [StringLength(300, ErrorMessage = "OldSocietyName cannot exceed 300 characters.")]
    public string? OldSocietyName { get; set; }

    [StringLength(100, ErrorMessage = "OldEmailId cannot exceed 100 characters.")]
    [EmailAddress(ErrorMessage = "OldEmailId is not a valid email address.")]
    public string? OldEmailId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldParkingAreaSqFt cannot be negative.")]
    public double? OldParkingAreaSqFt { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "OldParkingAreaSqMtr cannot be negative.")]
    public double? OldParkingAreaSqMtr { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "NoOfOldToilets cannot be negative.")]
    public int? NoOfOldToilets { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "OldTotalRooms cannot be negative.")]
    public int? OldTotalRooms { get; set; }
}
