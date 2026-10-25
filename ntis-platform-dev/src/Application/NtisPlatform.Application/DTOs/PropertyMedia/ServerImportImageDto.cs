using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.PropertyMedia;

/// <summary>
/// Database match result for one Property Media import filename - the single shape shared by the
/// Upload/Download preview, Execute's file-selection step, and the Worker's per-file processing,
/// so all three always agree on Matched vs Unmatched (see IPropertyMediaFileMatchResolver).
/// </summary>
public class PropertyMediaFileMatchResult
{
    public string FileName { get; set; } = string.Empty;
    public string? WardNo { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? Suffix { get; set; }

    /// <summary>See <see cref="PropertyMediaJobDetailStatus"/>: Matched/NoMatch/Invalid/Skipped.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>See <see cref="PropertyMediaSkipReason"/>; null only when Status is Matched.</summary>
    public string? SkipReason { get; set; }

    /// <summary>The resolved active PTIS.PropertyMast id; null unless Status is Matched.</summary>
    public int? PropertyId { get; set; }

    /// <summary>e.g. "Ward 10 - Property 245 - A1"; null unless Status is Matched.</summary>
    public string? PropertyDisplay { get; set; }

    public bool IsMatched => Status == nameof(PropertyMediaJobDetailStatus.Matched);
}

/// <summary>
/// One row of the Upload/Download drawer's server-import preview table:
/// a file found in the configured server import folder plus its database match status.
/// </summary>
public class ServerImportImageDto
{
    public string FileName { get; set; } = string.Empty;

    /// <summary>"Matched" / "NoMatch" / "Invalid" / "Skipped" - see <see cref="PropertyMediaJobDetailStatus"/>.</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Convenience flag for the green-check/red-X column; true only when Status is "Matched".</summary>
    public bool IsMatched { get; set; }

    /// <summary>e.g. "Ward 10 - Property 245 - A1"; null when not matched.</summary>
    public string? PropertyDisplay { get; set; }

    /// <summary>See <see cref="PropertyMediaSkipReason"/>; null when matched.</summary>
    public string? SkipReason { get; set; }
}

/// <summary>
/// Paged response for the server-import preview, with folder-wide totals (not just the current
/// page) so "Total Matched Records" is always accurate regardless of which page is requested.
/// </summary>
public class ServerImportPreviewResultDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalMatched { get; set; }
    public int TotalUnmatched { get; set; }
    public List<ServerImportImageDto> Items { get; set; } = new();
}


