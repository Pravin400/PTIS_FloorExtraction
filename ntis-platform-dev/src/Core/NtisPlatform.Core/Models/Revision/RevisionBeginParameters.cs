namespace NtisPlatform.Core.Models.Revision;

/// <summary>
/// Input to <c>PTIS.usp_Revision_Begin</c> (<see cref="Interfaces.IRevisionRepository.BeginRevisionAsync"/>).
/// Plain strings are used for <c>CalculationType</c>/<c>CalculationScope</c> (rather than the
/// Core enums) because this model is the literal ADO.NET parameter payload sent to the stored
/// procedure - keeping it decoupled from the C# enum type avoids leaking a JSON/text converter
/// concern into the SQL boundary.
/// </summary>
public class RevisionBeginParameters
{
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public string CalculationType { get; set; } = string.Empty;
    public string CalculationScope { get; set; } = string.Empty;
    public string RevisionType { get; set; } = string.Empty;
    public DateTime? EffectiveDate { get; set; }
    public string? RevisionReason { get; set; }

    /// <summary>Maps to the real <c>usp_Revision_Begin</c>'s optional @PolicyCodeId parameter.</summary>
    public int? PolicyCodeId { get; set; }

    /// <summary>Maps to the real <c>usp_Revision_Begin</c>'s @CreatedBy parameter (was incorrectly named/sent as @UserId before the real SP script was supplied).</summary>
    public int CreatedBy { get; set; }
}
