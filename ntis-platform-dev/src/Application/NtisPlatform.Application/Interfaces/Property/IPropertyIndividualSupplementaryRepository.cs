using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;

namespace NtisPlatform.Application.Interfaces.Property;

/// <summary>
/// Read-only repository providing the fields the Individual Property GET endpoint needs
/// that are not exposed by <see cref="IApartmentQcTopSectionRepository"/>.
/// Kept separate so the ApartmentQC top-section repository (shared by other screens)
/// never has to change for individual-only fields.
/// </summary>
public interface IPropertyIndividualSupplementaryRepository
{
    /// <summary>
    /// Gets the owner title, the "open plot" area (Ft/Mtr), and the Aadhar card number for the
    /// given property. Plot area is sourced the same way as the Basic Details API: the first
    /// active, non-deleted PropertyDetails row whose TypeOfUse is categorized as "OpenPlot".
    /// AadharCardNo is read from the same PropertyMastDetails (assessment) row the KYC write path
    /// (<c>PropertyKycService.UpsertAssessmentAsync</c>/<c>GetFirstAssessmentIdAsync</c>) writes to
    /// — the oldest active assessment row by Id — so reads stay consistent with where updates land.
    /// A property can accumulate multiple assessment rows over time (re-assessment/re-survey); the
    /// shared ApartmentQC top-section repository instead reads the newest row by CreatedDate, which
    /// can silently return null for a field that was only ever populated on the oldest row.
    /// </summary>
    Task<PropertyIndividualSupplementaryData> GetOwnerTitleAndPlotAreaAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the aggregated carpet and built-up area totals (Ft/Mtr) scoped strictly to this single
    /// propertyId, excluding open-plot details (e.g. TypeOfUseCategoryCode == Op / FloorCode == OP / ConstructionCode == OP).
    /// Sums across multiple PropertyDetails rows if present for that property.
    /// </summary>
    Task<(double? CarpetFt, double? CarpetMtr, double? BuiltUpFt, double? BuiltUpMtr)> GetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the additional-revenue tax inputs (CurrentTax, RetroTax, PendingCurrent, OldTotalTax)
    /// scoped strictly to this single propertyId — no Society/Ward-wide summation. Unlike
    /// <see cref="IApartmentQcTopSectionRepository.GetAdditionalRevenueTaxDetailsAsync(int, int?, CancellationToken)"/>,
    /// which sums across every property sharing the same Ward+PropertyNo when the property
    /// resolves as a "society" (CASE 1), an individual/standalone property's revenue must only
    /// ever reflect that one PropertyMast row.
    /// </summary>
    Task<PropertyIndividualTaxData> GetAdditionalRevenueTaxDetailsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the Carpet Area and Built-Up Area (Ft/Mtr) totals scoped strictly to this single
    /// propertyId's own PropertyDetails rows, excluding "open plot" rows. Unlike
    /// <see cref="IApartmentQcTopSectionRepository.GetCarpetAreaTotalsAsync(int, int?, CancellationToken)"/>
    /// and <see cref="IApartmentQcTopSectionRepository.GetBuiltUpAreaTotalsAsync(int, int?, CancellationToken)"/>,
    /// which (when wingDetailId is null) sum across every property sharing the same Ward+PropertyNo —
    /// i.e. every partition/unit in the same building — an individual property's area must only ever
    /// reflect that one PropertyMast row's own PropertyDetails, the same scoping the Basic Details API uses.
    /// </summary>
    /// <summary>
    /// Gets the historical/old carpet and built-up area totals from PropertyDetailsOld mapped to this property via PropertyMapDetails.
    /// </summary>
    Task<(double? OldCarpetAreaSqFeet, double? OldCarpetAreaSqMeter, double? OldBuiltupAreaSqFeet, double? OldBuiltupAreaSqMeter)> GetOldAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates individual property master details in PTIS.PropertyMast and assessment details in PTIS.PropertyMastDetails.
    /// Verifies property exists and is not locked.
    /// </summary>
    Task<TopSectionUpdateOutcome> UpdateIndividualDetailsAsync(
        int propertyId,
        UpdatePropertyIndividualDto dto,
        int updatedBy,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Supplementary fields for the Individual Property GET endpoint.
/// </summary>
public sealed record PropertyIndividualSupplementaryData(
    string? OwnerTitle,
    string? OwnerTitleEnglish,
    double? PlotAreaFt,
    double? PlotAreaMtr,
    string? AadharCardNo,
    int? CategoryId = null,
    int? WingDetailId = null,
    string? WingName = null);

/// <summary>
/// Raw tax inputs for the Individual Property additional-revenue section, scoped to a single property.
/// </summary>
public sealed record PropertyIndividualTaxData(
    decimal CurrentTax,
    decimal RetroTax,
    decimal PendingCurrent,
    decimal OldTotalTax);

/// <summary>
/// Carpet/Built-Up area totals (Ft, Mtr) for a single property, scoped strictly to its own
/// PropertyDetails rows.
/// </summary>
public sealed record PropertyIndividualAreaData(
    double? CarpetAreaFt,
    double? CarpetAreaMtr,
    double? BuiltUpAreaFt,
    double? BuiltUpAreaMtr);
