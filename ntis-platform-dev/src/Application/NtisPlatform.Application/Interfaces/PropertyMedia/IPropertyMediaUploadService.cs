using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// Use-case service for the Property Media Upload/Download drawer screen.
/// Separate from <see cref="IPropertyMediaDashboardService"/>, which serves the main
/// dashboard/gap-analysis screen.
/// </summary>
public interface IPropertyMediaUploadService
{
    /// <summary>Gets the "Choose What to Upload" Category dropdown for the Upload/Download drawer.</summary>
    Task<List<PropertyMediaDropdownOptionDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the Property Subtype dropdown, dependent on the selected Category: Photo returns the
    /// PROPERTY-scoped photo types; Document returns every subtype not already covered by Photo;
    /// Plan currently returns none (no plan-scoped photo type exists yet); null (no category
    /// selected) returns none.
    /// </summary>
    Task<List<PropertyMediaDropdownOptionDto>> GetPropertySubTypesAsync(
        PropertyMediaCategory? category, CancellationToken cancellationToken = default);

    /// <summary>
    /// Paged preview of the image files in the configured server import folder
    /// (PropertyPhotoPlanImage), each resolved against the database (Ward +
    /// active Property lookup) to show real Matched/Unmatched status and property details before
    /// any upload happens. Read-only - does not touch the database beyond that lookup.
    /// </summary>
    Task<ServerImportPreviewResultDto> GetServerImportImagesAsync(
        int page, int pageSize, CancellationToken cancellationToken = default);

    Task<ServerImportPreviewResultDto> GetServerImportImagesAsync(
        int? photoTypeId, int page, int pageSize, CancellationToken cancellationToken = default);



    /// <summary>
    /// Gets all Property Filter dropdown/filter data (Division, Ward, Property Type, and the
    /// Property No. From/To range count) in one call, for the Upload/Download drawer's
    /// Property Filter section.
    /// </summary>
    //Task<PropertyMediaFilterOptionsDto> GetFilterOptionsAsync(
    //    string? propertyNoFrom,
    //    string? propertyNoTo,
    //    CancellationToken cancellationToken = default);
}
