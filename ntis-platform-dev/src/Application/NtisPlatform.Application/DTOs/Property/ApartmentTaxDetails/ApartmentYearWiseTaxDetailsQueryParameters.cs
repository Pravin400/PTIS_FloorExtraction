namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>
/// Identifiers accepted by <c>GET api/ApartmentQC/yearwisedetails</c>. Same shape as
/// <see cref="ApartmentTaxDetailsQueryParameters"/>, plus <see cref="FinanceYearId"/> (the
/// YearMaster primary key) to narrow ptis.TransMast to one specific finance year.
/// </summary>
public sealed class ApartmentYearWiseTaxDetailsQueryParameters
{
    public int WardId { get; set; }
    public string PropertyNo { get; set; } = null!;
    public int? WingMasterId { get; set; }
    public ApartmentTaxType TaxType { get; set; }
    public int FinanceYearId { get; set; }
}
