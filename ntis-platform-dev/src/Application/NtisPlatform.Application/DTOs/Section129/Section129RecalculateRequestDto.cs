namespace NtisPlatform.Application.DTOs.Section129;

/// <summary>
/// Optional body for POST /Property/{propertyId}/section129a-recalculate — the officer's current
/// Property-Change-Check facts and OC-Date basis checkbox, persisted onto the application row
/// before the schedule is recalculated so those edits actually take effect on "Recalculate
/// Assessment". Same validation as <see cref="Section129ApplyRequestDto"/>: a change date and
/// change details are required whenever Area / Use / Other Structural Change is Yes.
/// </summary>
public class Section129RecalculateRequestDto
{
    public bool AreaChanged { get; set; }
    public bool UseChanged { get; set; }
    public bool OtherStructuralChange { get; set; }
    public DateTime? OtherStructuralChangeEffectiveDate { get; set; }
    public string? ChangeDetailsRemark { get; set; }

    /// <summary>false = ward Area Inclusion Date basis; true = this property's own OC Date basis.
    /// Flipping it wipes and rebuilds the whole schedule from the new anchor year.</summary>
    public bool UseOcDateBasis { get; set; }
}
