using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Represents a single bulk Property Media import run mapped to [PTIS].[PropertyMediaJob].
/// </summary>
public class PropertyMediaJobEntity : BaseEntity, IHardDeletable
{
    // Identity / classification
    public string JobCode { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty; // see PropertyMediaJobOperation (Application layer)

    // What every matched image in this run is tagged with
    public int PhotoTypeId { get; set; }
    public virtual PropertyPhotoTypeEntity PhotoType { get; set; } = null!;

    // Staging batch key (PreviewId for browse uploads) or null (for local folder import)
    public string? SourceBatchKey { get; set; }

    // Timing
    public DateTime? StartTime { get; set; }
    public DateTime? CompleteTime { get; set; }

    // Counters
    public int RecordsSelected { get; set; }
    public int RecordsProcessed { get; set; }
    public int MatchedCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public int NoMatchCount { get; set; }

    // Status / messaging
    public string Status { get; set; } = "Pending"; // see PropertyMediaJobStatus
    public string? ErrorMessage { get; set; }
    public string? Remarks { get; set; }

    // IHardDeletable
    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }

    /// <summary>
    /// Soft deletes the job and sets IsActive = false consistently.
    /// </summary>
    public void MarkForDeletion()
    {
        MarkedForDeletion = true;
        MarkedForDeletionDate = DateTime.Now;
        IsActive = false;
    }
}
