namespace NtisPlatform.Application.DTOs.PropertyCertificate;

/// <summary>
/// Real-time progress payload sent via SignalR during background tax recalculation.
/// </summary>
public class TaxCalculationProgressDto
{
    public string JobId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty; // "S" (Society), "W" (Wing), "P" (Property)
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int TotalUnits { get; set; }
    public int ProcessedUnits { get; set; }
    public int CurrentPropertyId { get; set; }
    public int PercentComplete => TotalUnits > 0 ? (int)((double)ProcessedUnits / TotalUnits * 100) : 100;
    public string Status { get; set; } = "Processing";
    public string StatusMessage { get; set; } = string.Empty;
    public string Message => !string.IsNullOrEmpty(StatusMessage) ? StatusMessage : $"Processing {ProcessedUnits} of {TotalUnits} units...";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Real-time completion payload sent via SignalR when background tax recalculation finishes.
/// </summary>
public class TaxCalculationCompletedDto
{
    public string JobId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int TotalUnits { get; set; }
    public int SucceededCount { get; set; }
    public int FailedCount { get; set; }

    private string? _status;
    public string Status
    {
        get
        {
            if (!string.IsNullOrEmpty(_status) && !_status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                return _status;
            }
            if (FailedCount > 0)
            {
                return SucceededCount > 0 ? "PartiallyCompleted" : "Failed";
            }
            return "Completed";
        }
        set => _status = value;
    }

    public bool Success => string.Equals(Status, "Completed", StringComparison.OrdinalIgnoreCase) && FailedCount == 0;
    public bool IsSuccess => Success;

    public string SummaryMessage { get; set; } = string.Empty;
    public string Message
    {
        get
        {
            if (!string.IsNullOrEmpty(SummaryMessage))
            {
                return SummaryMessage;
            }

            return Status switch
            {
                "Cancelled" => $"Tax recalculation was cancelled after processing {SucceededCount} of {TotalUnits} unit(s).",
                "PartiallyCompleted" => $"Tax recalculation partially completed: {SucceededCount} succeeded, {FailedCount} failed.",
                "Failed" => $"Tax recalculation failed for {FailedCount} unit(s).",
                "Completed" => $"Tax recalculation completed successfully for {TotalUnits} unit(s).",
                _ => Success
                    ? $"Tax recalculation completed for {TotalUnits} unit(s)."
                    : $"Tax recalculation failed for {FailedCount} unit(s)."
            };
        }
    }
    public List<string> FailureDetails { get; set; } = new();
    public long DurationMs { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

