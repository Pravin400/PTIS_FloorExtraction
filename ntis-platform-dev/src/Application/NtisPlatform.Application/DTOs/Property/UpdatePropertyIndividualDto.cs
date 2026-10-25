using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Property;

/// <summary>
/// Payload for PATCH /api/Property/{propertyId}/individual.
/// All fields are optional — only non-null values will be updated in the database.
/// </summary>
public class UpdatePropertyIndividualDto
{
    [StringLength(1000, ErrorMessage = "OwnerName cannot exceed 1000 characters.")]
    public string? OwnerName { get; set; }

    [StringLength(1000, ErrorMessage = "OwnerNameRegional cannot exceed 1000 characters.")]
    public string? OwnerNameRegional { get; set; }

    [StringLength(1000, ErrorMessage = "OwnerNameEnglish cannot exceed 1000 characters.")]
    public string? OwnerNameEnglish { get; set; }

    [StringLength(100, ErrorMessage = "OwnerTitle cannot exceed 100 characters.")]
    public string? OwnerTitle { get; set; }

    [StringLength(100, ErrorMessage = "OwnerTitleEnglish cannot exceed 100 characters.")]
    public string? OwnerTitleEnglish { get; set; }

    [StringLength(1000, ErrorMessage = "OccupierName cannot exceed 1000 characters.")]
    public string? OccupierName { get; set; }

    [StringLength(1000, ErrorMessage = "OccupierNameRegional cannot exceed 1000 characters.")]
    public string? OccupierNameRegional { get; set; }

    [StringLength(1000, ErrorMessage = "OccupierNameEnglish cannot exceed 1000 characters.")]
    public string? OccupierNameEnglish { get; set; }

    [StringLength(100, ErrorMessage = "OccupierTitle cannot exceed 100 characters.")]
    public string? OccupierTitle { get; set; }

    [StringLength(100, ErrorMessage = "OccupierTitleEnglish cannot exceed 100 characters.")]
    public string? OccupierTitleEnglish { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "OwnerTypeId must be a positive integer.")]
    public int? OwnerTypeId { get; set; }

    [StringLength(12, ErrorMessage = "AadharNo cannot exceed 12 characters.")]
    [RegularExpression(@"^\d{12}$", ErrorMessage = "AadharNo must be a 12-digit numeric number.")]
    public string? AadharNo { get; set; }

    [StringLength(13, ErrorMessage = "MobileNo cannot exceed 13 characters.")]
    [RegularExpression(@"^[0-9+\-\s()]*$", ErrorMessage = "MobileNo contains invalid characters.")]
    public string? MobileNo { get; set; }

    [StringLength(13, ErrorMessage = "AlternateMobileNo cannot exceed 13 characters.")]
    [RegularExpression(@"^[0-9+\-\s()]*$", ErrorMessage = "AlternateMobileNo contains invalid characters.")]
    public string? AlternateMobileNo { get; set; }

    [StringLength(100, ErrorMessage = "EmailId cannot exceed 100 characters.")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid email format.")]
    public string? EmailId { get; set; }

    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
    public string? Address { get; set; }

    [StringLength(500, ErrorMessage = "AddressRegional cannot exceed 500 characters.")]
    public string? AddressRegional { get; set; }

    [StringLength(500, ErrorMessage = "AddressEnglish cannot exceed 500 characters.")]
    public string? AddressEnglish { get; set; }

    [StringLength(10, ErrorMessage = "PinCode cannot exceed 10 characters.")]
    public string? PinCode { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "MoujaId must be a positive integer.")]
    public int? MoujaId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TaxZoneId must be a positive integer.")]
    public int? TaxZoneId { get; set; }

    [StringLength(100, ErrorMessage = "SurveyNo cannot exceed 100 characters.")]
    public string? SurveyNo { get; set; }

    [StringLength(100, ErrorMessage = "PlotNo cannot exceed 100 characters.")]
    public string? PlotNo { get; set; }

    [StringLength(100, ErrorMessage = "FlatOrShopNo cannot exceed 100 characters.")]
    public string? FlatOrShopNo { get; set; }

    [StringLength(200, ErrorMessage = "FlatOrShopName cannot exceed 200 characters.")]
    public string? FlatOrShopName { get; set; }

    [StringLength(200, ErrorMessage = "FlatOrShopNameEnglish cannot exceed 200 characters.")]
    public string? FlatOrShopNameEnglish { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "CategoryId must be a positive integer.")]
    public int? CategoryId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "PropertyTypeId must be a positive integer.")]
    public int? PropertyTypeId { get; set; }

    /// <summary>
    /// Checks if at least one field has been provided in the payload.
    /// </summary>
    public bool HasAnyField() =>
        OwnerName != null ||
        OwnerNameRegional != null ||
        OwnerNameEnglish != null ||
        OwnerTitle != null ||
        OwnerTitleEnglish != null ||
        OccupierName != null ||
        OccupierNameRegional != null ||
        OccupierNameEnglish != null ||
        OccupierTitle != null ||
        OccupierTitleEnglish != null ||
        OwnerTypeId.HasValue ||
        AadharNo != null ||
        MobileNo != null ||
        AlternateMobileNo != null ||
        EmailId != null ||
        Address != null ||
        AddressRegional != null ||
        AddressEnglish != null ||
        PinCode != null ||
        MoujaId.HasValue ||
        TaxZoneId.HasValue ||
        SurveyNo != null ||
        PlotNo != null ||
        FlatOrShopNo != null ||
        FlatOrShopName != null ||
        FlatOrShopNameEnglish != null ||
        CategoryId.HasValue ||
        PropertyTypeId.HasValue;
}
