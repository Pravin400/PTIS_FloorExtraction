namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>Repository-level result for the apartment year-wise tax-details query, before DTO mapping.</summary>
public sealed class ApartmentYearWiseTaxDetailsRawData
{
    public int PropertyCount { get; set; }
    public int? WingMasterId { get; set; }
    public string? WingName { get; set; }
    public string? WingNo { get; set; }
    public string? SocietyName { get; set; }
    public string? FinanceYear { get; set; }
    public List<CurrentTaxByTypeDto> YearWiseTaxes { get; set; } = new();
}
