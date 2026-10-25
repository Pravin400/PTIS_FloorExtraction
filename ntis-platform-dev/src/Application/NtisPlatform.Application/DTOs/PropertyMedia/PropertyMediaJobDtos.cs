using System.Text.Json.Serialization;

namespace NtisPlatform.Application.DTOs.PropertyMedia;

/// <summary>
/// Request to start a Property Media bulk-import job from the configured Development-only
/// local import folder. <see cref="PhotoTypeId"/> (a PTIS.PropertyPhotoType id, from the
/// existing "Choose What to Upload" dropdown) is applied to every image matched in the run.
/// </summary>
public class ExecuteMediaJobRequestDto
{
    public int PhotoTypeId { get; set; }
    public string? Remarks { get; set; }
    public List<string>? SelectedFiles { get; set; }
}

/// <summary>Returned immediately after a bulk-import job is queued; the actual work happens later in the Worker.</summary>
public class ExecuteMediaJobResponseDto
{
    public int JobId { get; set; }
    public string JobCode { get; set; } = string.Empty;
    public int RecordsSelected { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>One row of the Property Media job list (dashboard).</summary>
public class PropertyMediaJobSummaryDto
{
    [JsonPropertyName("Date & Time")]
    public string DateTime { get; set; } = string.Empty;

    [JsonPropertyName("User")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("Action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("Category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("Result")]
    public int Result { get; set; }

    [JsonIgnore]
    public string CreatedDate
    {
        get => DateTime;
        set => DateTime = value;
    }

    [JsonIgnore]
    public string StartedByUserName
    {
        get => User;
        set => User = value;
    }

    [JsonIgnore]
    public string Operation
    {
        get => Action;
        set => Action = value;
    }

    [JsonIgnore]
    public string PhotoTypeName
    {
        get => Category;
        set => Category = value;
    }

    [JsonIgnore]
    public int MatchedCount
    {
        get => Result;
        set => Result = value;
    }
}

/// <summary>Query parameters for the Property Media job list with global pagination.</summary>
public class PropertyMediaJobQueryParameters : Queries.BaseQueryParameters
{
}

/// <summary>One per-file row of a Property Media job's detail grid.</summary>
public class PropertyMediaJobDetailDto
{
    /// <summary>The real PropertyMediaJobDetail row id.</summary>
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? WardNo { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? Suffix { get; set; }
    public int? PropertyId { get; set; }
    public int? DocumentId { get; set; }
    public int? DocumentBindingId { get; set; }
    public int? PropertyPhotoId { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>Convenience flag mirroring Status == "Matched" (green-check/red-X column) - see ServerImportImageDto.IsMatched for the same pattern.</summary>
    public bool IsMatched { get; set; }
    public string? SkipReason { get; set; }
    public string? Message { get; set; }
    public DateTime? ExecutionStartTime { get; set; }
    public DateTime? ExecutionEndTime { get; set; }
}

/// <summary>
/// Response for the browse-upload preview step: the new JobId (pass back as
/// ExecuteBrowseMediaJobRequestDto to the Browse Execute API to queue every Matched file),
/// folder-wide totals, and one match-preview result per selected file - every file is included
/// (Matched, NoMatch, Invalid, Skipped), not just Matched ones.
/// </summary>
public class PropertyMediaBrowsePreviewResultDto
{
    public string PreviewId { get; set; } = string.Empty;
    /// <summary>Only meaningful for the paged GET re-fetch (<c>GetBrowsedPreviewAsync</c>) - 0 for the initial POST preview, which returns every item.</summary>
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalMatched { get; set; }
    public int TotalUnmatched { get; set; }
    public List<ServerImportImageDto> Items { get; set; } = new();
}



/// <summary>
/// Request to confirm a browse-upload job (see PropertyMediaBrowsePreviewResultDto) and queue
/// EVERY currently-Matched file in it - PhotoTypeId/Remarks are not re-supplied here, they were
/// already captured by the preview step and are read back from the job row.
/// </summary>
public class ExecuteBrowseMediaJobRequestDto
{
    public string? PreviewId { get; set; }
    public int? JobId { get; set; }
}
