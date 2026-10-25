namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>Response of the baseline endpoint.</summary>
public class RevisionBaselineDto
{
    public long RevisionId { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }

    /// <summary>True if this call created the initial assessment; false if one already existed.</summary>
    public bool Created { get; set; }
}
