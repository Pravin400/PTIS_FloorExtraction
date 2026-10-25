namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>Repository-level result for the apartment demand-details query, before DTO mapping.</summary>
public sealed class ApartmentDemandDetailsRawData
{
    public int PropertyCount { get; set; }
    public int? WingMasterId { get; set; }
    public string? WingName { get; set; }
    public string? WingNo { get; set; }
    public string? SocietyName { get; set; }
    public List<CurrentTaxByTypeDto> DemandTaxes { get; set; } = new();
}
