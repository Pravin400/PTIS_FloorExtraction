namespace NtisPlatform.Core.Models.Revision;

/// <summary>Result of <c>PTIS.usp_Revision_EnsureBaseline</c>.</summary>
public class RevisionBaselineResult
{
    public long RevisionId { get; set; }

    /// <summary>True when the SP created a new INITIAL baseline; false when one already existed.</summary>
    public bool Created { get; set; }
}
