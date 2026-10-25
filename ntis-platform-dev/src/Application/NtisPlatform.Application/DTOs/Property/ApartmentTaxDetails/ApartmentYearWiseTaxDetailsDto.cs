namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>
/// Policy-code-wise ptis.TransMast totals for one specific finance year, summed across every unit
/// (PropertyMast row) sharing the given Ward + PropertyNo. Every row keeps its real PolicyCode.
/// </summary>
public sealed class ApartmentYearWiseTaxDetailsDto
{
    public int WardId { get; set; }
    public string PropertyNo { get; set; } = null!;
    public int? WingMasterId { get; set; }
    public string? WingName { get; set; }
    public string? WingNo { get; set; }
    public string? SocietyName { get; set; }

    /// <summary>Number of PropertyMast rows (units) whose tax was summed into this result.</summary>
    public int PropertyCount { get; set; }

    public int FinanceYearId { get; set; }

    /// <summary>YearMaster.YearCode for <see cref="FinanceYearId"/> (e.g. "2022-23"), if it resolves.</summary>
    public string? FinanceYear { get; set; }

    /// <summary>One entry per requested valuation method (RV, CV, or both for Dual).</summary>
    public List<CurrentTaxByTypeDto> YearWiseTaxes { get; set; } = new();
}
