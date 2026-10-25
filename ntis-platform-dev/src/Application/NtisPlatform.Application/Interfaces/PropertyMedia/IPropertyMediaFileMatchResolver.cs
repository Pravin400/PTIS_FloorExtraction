using NtisPlatform.Application.DTOs.PropertyMedia;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// Resolves Property Media import filenames against the database (Ward + active Property lookup,
/// plus cross-job "already imported" dedup), batched for efficiency. The single source of truth
/// for match status, shared by the Upload/Download preview, the Execute (queue) file-selection
/// step, and the Worker's per-file processing - so all three always agree on Matched vs Unmatched.
/// </summary>
public interface IPropertyMediaFileMatchResolver
{
    /// <summary>Returns one result per input filename, in no particular order.</summary>
    Task<List<PropertyMediaFileMatchResult>> ResolveAsync(
        IReadOnlyList<string> fileNames, CancellationToken cancellationToken = default);

    /// <summary>Returns one result per input filename, matching against the category/photoType specified.</summary>
    Task<List<PropertyMediaFileMatchResult>> ResolveAsync(
        IReadOnlyList<string> fileNames, int? photoTypeId, CancellationToken cancellationToken = default);
}
