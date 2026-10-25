using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionMast - the header/workflow row for a single Property Revision. Shape matches the
/// actual DDL exactly (see the CREATE TABLE script shared for this table); do not add columns
/// here without adding them to the table first.
///
/// Inherits <see cref="LongBaseEntity"/> and implements <see cref="IHardDeletable"/>: revision tables use BIGINT identity keys (long Id)
/// and encapsulate common audit/soft-delete fields (Id, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
/// IsActive, MarkedForDeletion, MarkedForDeletionDate).
///
/// A DRAFT/CALCULATED revision must never be reflected onto the live PropertyMast/PropertyDetails
/// tables - only a POSTED revision may set <see cref="IsCurrent"/> and be synchronized to live
/// tables. The table's default for IsCurrent is 1, and UX_RevisionMast_Current enforces at most
/// one IsCurrent=1 row per (PropertyId, FinanceYearId); usp_Revision_Begin is responsible for
/// inserting new DRAFT revisions with IsCurrent=0 so that invariant holds - this is a stored
/// procedure concern, not something the (read-only, Phase 1) EF mapping needs to enforce.
/// </summary>
public class RevisionMastEntity : LongBaseEntity, IHardDeletable
{
    public int PropertyId { get; set; }

    /// <summary>Foreign key to Core.YearMaster (the same finance-year master TransMast/RVCalculationResults use).</summary>
    public int FinanceYearId { get; set; }

    /// <summary>Sequential revision number, unique within (PropertyId, FinanceYearId).</summary>
    public int RevisionNo { get; set; }

    /// <summary>
    /// Links to the revision timeline this one continues, used when a later PERIOD_WISE revision
    /// must clone a previously POSTED revision's periods rather than the live property. Null for a
    /// property's first revision in the finance year.
    /// </summary>
    public long? PreviousRevisionMastId { get; set; }

    public RevisionCalculationType CalculationType { get; set; }

    public RevisionCalculationScope CalculationScope { get; set; }

    /// <summary>
    /// Free-text/business classification of why the revision was raised (e.g. "AREA_CHANGE",
    /// "USE_CHANGE"). Kept as a plain string rather than an enum because this list is
    /// configuration-driven rather than fixed at compile time. VARCHAR(30) in the DB.
    /// </summary>
    public string RevisionType { get; set; } = string.Empty;

    /// <summary>Required for PERIOD_WISE, must be null for HISTORY_ONLY (enforced by both the service layer and CK_RevisionMast_PeriodWiseEffectiveDate).</summary>
    public DateTime? EffectiveDate { get; set; }

    public string? RevisionReason { get; set; }

    /// <summary>Nullable in the DB - no default policy code is assumed at the header level.</summary>
    public int? PolicyCodeId { get; set; }

    /// <summary>Optional free-text origin of the revision (e.g. a workflow/module name), for traceability.</summary>
    public string? SourceType { get; set; }

    /// <summary>Optional id of the record that triggered this revision within <see cref="SourceType"/>.</summary>
    public long? SourceReferenceId { get; set; }

    public RevisionStatus RevisionStatus { get; set; } = RevisionStatus.DRAFT;

    /// <summary>True only for the single POSTED revision that represents the property's live state for the finance year.</summary>
    public bool IsCurrent { get; set; }

    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }

    /// <summary>SQL Server ROWVERSION - optimistic concurrency token for later approve/post/edit phases.</summary>
    public byte[] RowVersion { get; set; } = [];

    // ===== Navigation properties =====
    [ForeignKey(nameof(PropertyId))]
    public virtual PropertyEntity? Property { get; set; }

    [ForeignKey(nameof(PolicyCodeId))]
    public virtual PolicyCodeMasterEntity? PolicyCodeMaster { get; set; }

    [ForeignKey(nameof(PreviousRevisionMastId))]
    public virtual RevisionMastEntity? PreviousRevision { get; set; }

    public virtual ICollection<RevisionPeriodEntity> Periods { get; set; } = new List<RevisionPeriodEntity>();

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
