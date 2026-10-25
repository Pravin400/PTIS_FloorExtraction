using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Read-only repository backing the ApartmentQC "top section" panel (property overview,
/// property info, and the inputs the performance-summary calculator needs).
/// All reads are AsNoTracking — this feature never writes.
/// </summary>
public interface IApartmentQcTopSectionRepository
{
    /// <summary>
    /// Core property + master-data fields for the property resolved from <paramref name="query"/>,
    /// or null if no identifier resolves to a property.
    /// </summary>
    Task<PropertyTopSectionRawData?> GetPropertyAsync(ApartmentQcTopSectionQueryParameters query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sum of active PropertyDetails carpet area (Ft, Mtr) rows across all properties in the apartment,
    /// excluding open plot (OP) entries.
    /// </summary>
    Task<(double? Ft, double? Mtr)> GetCarpetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<(double? Ft, double? Mtr)> GetCarpetAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sum of active PropertyDetails BuiltupArea (Ft, Mtr) across all properties in the apartment,
    /// excluding open plot (OP) entries.
    /// </summary>
    Task<(double? Ft, double? Mtr)> GetBuiltUpAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<(double? Ft, double? Mtr)> GetBuiltUpAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sum of active PropertyDetailsOld carpet area (Ft, Mtr) across all mapped old properties in the apartment,
    /// excluding open plot (OP) entries.
    /// </summary>
    Task<(double? Ft, double? Mtr)> GetOldCarpetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<(double? Ft, double? Mtr)> GetOldCarpetAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sum of active PropertyDetailsOld BuiltupArea (Ft, Mtr) across all mapped old properties in the apartment,
    /// excluding open plot (OP) entries.
    /// </summary>
    Task<(double? Ft, double? Mtr)> GetOldBuiltUpAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<(double? Ft, double? Mtr)> GetOldBuiltUpAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current tax, retrospective tax, pre-merge old current tax, and pending current tax details for the property.
    /// </summary>
    Task<(decimal? CurrentTax, decimal? RetroTax, decimal? OldCurrentTax, decimal? PendingCurrent)> GetAdditionalRevenueTaxDetailsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current tax, retrospective tax, pre-merge old current tax, and pending current tax details for the property.
    /// Supports society-level, wing-level, and individual property-level calculation for CurrentTax.
    /// </summary>
    Task<(decimal? CurrentTax, decimal? RetroTax, decimal? OldCurrentTax, decimal? PendingCurrent)> GetAdditionalRevenueTaxDetailsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the active child wings belonging to the property's society (from PTIS.WingDetailsMast).
    /// </summary>
    Task<List<SocietyWingSummaryDto>> GetSocietyWingsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total, residential, commercial, and amenity property counts for the resolved scope (Society or Wing).
    /// </summary>
    Task<PropertyTypeCountSummaryDto> GetPropertyTypeCountsAsync(int propertyId, int? wingDetailId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the formatted total floor string (e.g., "G+7", "G+12", "G") representing the maximum floor
    /// across all units in the resolved scope (Society, Wing, or Flat).
    /// </summary>
    Task<string?> GetTotalFloorAsync(int propertyId, int? wingDetailId = null, CancellationToken cancellationToken = default);


    /// <summary>
    /// Updates the editable fields of the property top section in the database.
    /// </summary>
    Task<TopSectionUpdateOutcome> UpdateTopSectionAsync(int propertyId, UpdateApartmentQcTopSectionDto dto, int updatedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the editable fields of a specific wing in PTIS.WingDetailsMast.
    /// </summary>
    Task<TopSectionUpdateOutcome> UpdateWingDetailsAsync(int wingDetailId, UpdateApartmentQcWingDetailsDto dto, int updatedBy, CancellationToken cancellationToken = default);
}


