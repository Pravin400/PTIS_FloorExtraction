using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyMast - the snapshot of PropertyMast's header fields for one revision.
/// Shape matches the actual CREATE TABLE script exactly (no ROWVERSION column on this table,
/// unlike RevisionMast/RevisionPeriod - do not add one).
///
/// One row per revision for a HISTORY_ONLY revision (<see cref="RevisionPeriodId"/> is null,
/// enforced by UX_RevisionPropertyMast_History), or one row per <see cref="RevisionPeriodId"/>
/// for a PERIOD_WISE revision (UX_RevisionPropertyMast_Period). usp_Revision_Begin is
/// responsible for populating the initial snapshot row(s) from the live PropertyMast row when the
/// revision is opened; only the row for the latest period (or the single history row) may be
/// edited by the draft-editing API - see PropertyRevisionSnapshotService.
/// </summary>
public class RevisionPropertyMastEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }

    /// <summary>Null for a HISTORY_ONLY revision's single snapshot row. Set for a PERIOD_WISE revision's per-period row.</summary>
    public long? RevisionPeriodId { get; set; }

    /// <summary>Trace-only reference to the live PropertyMast row this was cloned from. Not an FK (revision_api_rules.txt: Source*Id columns never FK back to mutable live rows).</summary>
    public int SourcePropertyId { get; set; }

    public int TaxZoneId { get; set; }
    public int WardId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int PropertySeqNo { get; set; }
    public int? PropertyTypeId { get; set; }
    public string? UPICId { get; set; }
    public bool? OpenPlot { get; set; }
    public int? MoujaId { get; set; }
    public string? CSN { get; set; }
    public string? SubZoneNo { get; set; }
    public string? PlotNo { get; set; }
    public int? CategoryId { get; set; }

    /// <summary>Matches live PropertyMast.Type (NVARCHAR(50)) for categories like RESIDENTIAL, COMMERCIAL, etc.</summary>
    public string? Type { get; set; }

    public string? OwnerTitle { get; set; }
    public string? OwnerName { get; set; }
    public string? OccupierTitle { get; set; }
    public string? OccupierName { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? Address { get; set; }
    public string? PinCode { get; set; }
    public string? Location { get; set; }
    public string? MobileNo { get; set; }
    public int? MobileNoRemarkId { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? OccupierMobileNo { get; set; }
    public int? OccupierMobileNoRemarkId { get; set; }
    public string? EmailId { get; set; }
    public int? WingDetailId { get; set; }
    public string? OwnerTitleEnglish { get; set; }
    public string? OwnerNameEnglish { get; set; }
    public string? OccupierTitleEnglish { get; set; }
    public string? OccupierNameEnglish { get; set; }
    public string? FlatOrShopNoEnglish { get; set; }
    public string? FlatOrShopNameEnglish { get; set; }
    public string? AddressEnglish { get; set; }
    public string? LocationEnglish { get; set; }
    public int? PropertyAssessmentStatusId { get; set; }
    public int? PropertyFloorId { get; set; }

    // ===== Navigation properties =====
    [ForeignKey(nameof(RevisionMastId))]
    public virtual RevisionMastEntity? RevisionMast { get; set; }

    [ForeignKey(nameof(RevisionPeriodId))]
    public virtual RevisionPeriodEntity? RevisionPeriod { get; set; }

    [ForeignKey(nameof(TaxZoneId))]
    public virtual TaxZoneEntity? TaxZone { get; set; }

    [ForeignKey(nameof(WardId))]
    public virtual WardEntity? Ward { get; set; }

    [ForeignKey(nameof(PropertyTypeId))]
    public virtual PropertyTypeMasterEntity? PropertyTypeMaster { get; set; }

    [ForeignKey(nameof(MoujaId))]
    public virtual MoujaEntity? Mouja { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public virtual PropertyCategoryEntity? PropertyCategory { get; set; }

    [ForeignKey(nameof(WingDetailId))]
    public virtual WingDetailsMastEntity? WingDetailsMast { get; set; }

    [ForeignKey(nameof(PropertyAssessmentStatusId))]
    public virtual PropertyAssessmentStatusEntity? PropertyAssessmentStatus { get; set; }

    [ForeignKey(nameof(PropertyFloorId))]
    public virtual FloorEntity? PropertyFloor { get; set; }

    public virtual RevisionPropertyMastDetailsEntity? PropertyMastDetails { get; set; }
    public virtual ICollection<RevisionPropertyDetailsEntity> PropertyDetails { get; set; } = new List<RevisionPropertyDetailsEntity>();

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
