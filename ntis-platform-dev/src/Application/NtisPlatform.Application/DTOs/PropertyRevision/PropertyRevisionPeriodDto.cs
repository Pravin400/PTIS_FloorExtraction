namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>One RevisionPeriod row, as returned inside <see cref="PropertyRevisionDetailsDto"/>.</summary>
public class PropertyRevisionPeriodDto
{
    public long RevisionPeriodId { get; set; }
    public int PeriodNo { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime EffectiveTo { get; set; }
    public int PeriodDays { get; set; }

    /// <summary>
    /// Not a stored column - RevisionPeriod has no editability flag in the DB. Computed by
    /// <c>PropertyRevisionService</c> as "this is the period with the highest PeriodNo", matching
    /// the business rule that only the latest period of a draft revision is editable.
    /// </summary>
    public bool IsEditable { get; set; }

    public string? Remarks { get; set; }
}
