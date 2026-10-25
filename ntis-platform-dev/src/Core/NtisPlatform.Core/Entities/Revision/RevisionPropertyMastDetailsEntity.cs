using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyMastDetails - 1:1 extension of <see cref="RevisionPropertyMastEntity"/>
/// (UX_RevisionPropertyMastDetails_PropertyMast enforces one active row per RevisionPropertyMastId).
/// No ROWVERSION column on this table.
/// </summary>
public class RevisionPropertyMastDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyMastId { get; set; }

    /// <summary>Trace-only reference to the live PropertyMastDetails/PropertyAssessment row this was cloned from. Not an FK.</summary>
    public int? SourcePropertyMastDetailsId { get; set; }

    public int? OwnerTypeId { get; set; }
    public string? AssessmentRemark { get; set; }
    public string? SurveyRemark { get; set; }
    public int? OwnerSignRemarkId { get; set; }
    public string? FlatSystemRemark { get; set; }
    public string? CombPropRemark { get; set; }
    public string? AdharCardNo { get; set; }
    public string? RenterMobileNo { get; set; }
    public DateTime? PrarupYadiPublishDate { get; set; }
    public DateTime? AntimYadiPublishDate { get; set; }
    public DateTime? PropertyRegDate { get; set; }
    public short? ApplyTaxesFrom { get; set; }
    public DateTime? PartOCDate { get; set; }
    public string? BHK { get; set; }
    public string? BlockNo { get; set; }
    public string? AlternetivEmailId { get; set; }
    public double? TotalBuiltupAreaSqFeet { get; set; }
    public double? TotalBuiltupAreaSqMeter { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public int? NoOfResidentialToilets { get; set; }
    public int? NoOfCommercialToilets { get; set; }
    public string? UnitGenerationType { get; set; }

    // ===== Navigation properties =====
    [ForeignKey(nameof(RevisionMastId))]
    public virtual RevisionMastEntity? RevisionMast { get; set; }

    [ForeignKey(nameof(RevisionPeriodId))]
    public virtual RevisionPeriodEntity? RevisionPeriod { get; set; }

    /// <summary>Composite FK (RevisionPropertyMastId, RevisionMastId) -&gt; RevisionPropertyMast(Id, RevisionMastId); configured in OnModelCreating (no single-column [ForeignKey] attribute possible here).</summary>
    public virtual RevisionPropertyMastEntity? RevisionPropertyMast { get; set; }

    [ForeignKey(nameof(OwnerTypeId))]
    public virtual OwnerTypeMasterEntity? OwnerTypeMaster { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
