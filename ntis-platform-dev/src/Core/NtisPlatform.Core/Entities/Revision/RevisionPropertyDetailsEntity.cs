using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyDetails - one row per floor-wise unit (DetailSequenceNo) snapshotted for a
/// revision. Multiple rows per <see cref="RevisionPropertyMastId"/> are expected (mirrors live
/// PropertyDetails, which is one-to-many under PropertyMast). No ROWVERSION column on this table.
/// This is the table most tax-relevant fields live on (revision_api_rules.txt / REVISION LOGIC.txt
/// section 19 reset list: ConstructionTypeId, TypeOfUseId, AssessmentYear, BuiltupArea, CarpetArea,
/// IsRenter, ...) - edits here must run through the shared CALCULATED-&gt;DRAFT reset mechanism.
/// </summary>
public class RevisionPropertyDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyMastId { get; set; }

    /// <summary>Trace-only reference to the live PropertyDetails row this was cloned from. Not an FK.</summary>
    public int? SourcePropertyDetailsId { get; set; }

    /// <summary>1-based, unique within (RevisionPropertyMastId); identifies which floor-wise unit this row represents. Defaults to 1 in the DB.</summary>
    public int DetailSequenceNo { get; set; } = 1;

    public bool? IsTaxable { get; set; }
    public int FloorId { get; set; }
    public int? SubFloorId { get; set; }
    public string? ConstructionYear { get; set; }
    public string? AssessmentYear { get; set; }
    public int ConstructionTypeId { get; set; }
    public int TypeOfUseId { get; set; }
    public int? SubTypeOfUseId { get; set; }
    public double? CarpetAreaSqMeter { get; set; }
    public double? CarpetAreaSqFeet { get; set; }
    public double? BuiltupAreaSqMeter { get; set; }
    public double? BuiltupAreaSqFeet { get; set; }
    public int? NoOfRooms { get; set; }
    public bool? IsRenter { get; set; }
    public int? ChangeDetectionYear { get; set; }

    // ===== Navigation properties =====
    [ForeignKey(nameof(RevisionMastId))]
    public virtual RevisionMastEntity? RevisionMast { get; set; }

    [ForeignKey(nameof(RevisionPeriodId))]
    public virtual RevisionPeriodEntity? RevisionPeriod { get; set; }

    /// <summary>Composite FK (RevisionPropertyMastId, RevisionMastId) -&gt; RevisionPropertyMast(Id, RevisionMastId); configured in OnModelCreating.</summary>
    public virtual RevisionPropertyMastEntity? RevisionPropertyMast { get; set; }

    [ForeignKey(nameof(FloorId))]
    public virtual FloorEntity? Floor { get; set; }

    [ForeignKey(nameof(SubFloorId))]
    public virtual SubFloorEntity? SubFloor { get; set; }

    [ForeignKey(nameof(ConstructionTypeId))]
    public virtual ConstructionTypeEntity? ConstructionType { get; set; }

    [ForeignKey(nameof(TypeOfUseId))]
    public virtual TypeOfUseEntity? TypeOfUse { get; set; }

    [ForeignKey(nameof(SubTypeOfUseId))]
    public virtual SubTypeOfUseEntity? SubTypeOfUse { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
