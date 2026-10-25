namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>
/// One tax head's amount, already summed across every matched property. <see cref="PolicyCode"/> is
/// the PolicyCodeMaster.PolicyCode for rows sourced from PolicyTaxDetails/PolicyTaxDetailsCV (e.g.
/// "NETTAX", "OC"), the literal "Net Pay" for rows sourced from the current finance year's
/// ptis.TransMast - the real PolicyCodeMaster.PolicyCode is not surfaced for those, since they
/// represent the year's net payable rather than a specific policy stage - or the closed finance
/// year's YearCode (e.g. "2022-23") for arrears rows, which are summed year-wise instead of by
/// policy code. <see cref="FinanceYearId"/> is only populated for arrears rows - it is the
/// YearMaster primary key for that row's finance year, to be passed as-is as the
/// <c>financeYearId</c> input to <c>GET api/ApartmentQC/yearwisedetails</c>.
/// policy code.
/// </summary>
public sealed class TaxHeadAmountDto
{
    public int TaxId { get; set; }
    public string TaxName { get; set; } = null!;
    public string PolicyCode { get; set; } = null!;
    public decimal TaxAmount { get; set; }
    public int? FinanceYearId { get; set; }
}
