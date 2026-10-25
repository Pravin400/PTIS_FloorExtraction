using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// "Choose What to Download" drawer: resolves PropertyPhoto files matching a Category/Subtype
/// selection, exports metadata listings (Excel/PDF), retrieves applicable property numbers,
/// and packages matching original images into a single ZIP file for download.
/// </summary>
public interface IPropertyMediaDownloadService
{
    /// <summary>
    /// <paramref name="photoTypeId"/> is the specific Subtype (or null for "All Photo Types" under
    /// <paramref name="category"/>). Returns the currently-available (latest) file per property.
    /// </summary>
    Task<List<PropertyMediaMatchedFileDto>> GetMatchedFilesAsync(
        PropertyMediaCategory? category, int? photoTypeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves the distinct list of property numbers matching the selected Category, PhotoSubType,
    /// Division (Zone), and Ward, ordered by natural (human) alphanumeric sort order.
    /// </summary>
    Task<List<string>> GetPropertyNumbersAsync(
        PropertyMediaPropertyNumbersQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Queries all active latest original images matching the selected Category, PhotoSubType,
    /// Division, Ward, and optional From/To PropertyNo range, and streams them into a single ZIP archive.
    /// </summary>
    Task<PropertyMediaZipDownloadResult> DownloadImagesZipAsync(
        PropertyMediaDownloadQueryParameters parameters,
        CancellationToken cancellationToken = default);
}
