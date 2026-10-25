namespace NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;

/// <summary>
/// Policy-code-wise current demand for an apartment, summed across every unit (PropertyMast row)
/// sharing the given Ward + PropertyNo. Sourced from ptis.PolicyTaxDetails (RV) /
/// ptis.PolicyTaxDetailsCV (CV) where IsCurrent = true - unlike <see cref="ApartmentTaxDetailsDto.CurrentTaxes"/>,
/// every row keeps its real PolicyCode instead of being collapsed to "Demand".
/// </summary>
public sealed class ApartmentDemandDetailsDto
{
    public int WardId { get; set; }
    public string PropertyNo { get; set; } = null!;
    public int? WingMasterId { get; set; }
    public string? WingName { get; set; }
    public string? WingNo { get; set; }
    public string? SocietyName { get; set; }

    /// <summary>Number of PropertyMast rows (units) whose tax was summed into this result.</summary>
    public int PropertyCount { get; set; }

    /// <summary>One entry per requested valuation method (RV, CV, or both for Dual).</summary>
    public List<CurrentTaxByTypeDto> DemandTaxes { get; set; } = new();
}
