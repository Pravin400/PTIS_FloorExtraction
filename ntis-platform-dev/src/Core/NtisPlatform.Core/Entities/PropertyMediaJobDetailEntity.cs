using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Per-file execution row for a <see cref="PropertyMediaJobEntity"/> mapped to [PTIS].[PropertyMediaJobDetail].
/// Captures the filename parse, the Ward/Property match, and the upload outcome.
/// </summary>
public class PropertyMediaJobDetailEntity : BaseEntity, IHardDeletable
{
    public int JobId { get; set; }

    // Source file and parsed filename segments ({WardNo}-{PropertyNo}-{PartitionNo}-{Suffix}.ext)
    public string FileName { get; set; } = string.Empty;
    public string? WardNo { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? Suffix { get; set; }

    // Match / upload results (null unless matched/uploaded)
    public int? PropertyId { get; set; }
    public int? PropertyPhotoId { get; set; }

    public DateTime? ExecutionStartTime { get; set; }
    public DateTime? ExecutionEndTime { get; set; }

    public string Status { get; set; } = "Pending"; // see PropertyMediaJobDetailStatus
    public string? SkipReason { get; set; }          // see PropertyMediaSkipReason; null unless NoMatch/Invalid/Skipped
    public string? Message { get; set; }

    // IHardDeletable
    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }

    /// <summary>
    /// Soft deletes the detail record and sets IsActive = false consistently.
    /// </summary>
    public void MarkForDeletion()
    {
        MarkedForDeletion = true;
        MarkedForDeletionDate = DateTime.Now;
        IsActive = false;
    }
}
