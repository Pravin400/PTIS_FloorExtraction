using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPeriod - one date-bounded slice of a PERIOD_WISE revision. A HISTORY_ONLY
/// revision has no rows here. Shape matches the actual DDL exactly.
///
/// Note: the table does NOT store an "is this period editable/locked" flag - that is a business
/// rule (only the latest period, by <see cref="PeriodNo"/>, of a DRAFT/CALCULATED revision is
/// editable), computed by <c>PropertyRevisionService</c> when building the API response rather
/// than persisted here.
/// </summary>
public class RevisionPeriodEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }

    /// <summary>1-based, ordered by <see cref="EffectiveFrom"/>.</summary>
    public int PeriodNo { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime EffectiveTo { get; set; }

    /// <summary>
    /// PERSISTED computed column in the DB (<c>DATEDIFF(DAY, EffectiveFrom, EffectiveTo) + 1</c>).
    /// Store-generated - never set this from application code.
    /// </summary>
    public int PeriodDays { get; set; }

    public string? Remarks { get; set; }

    /// <summary>SQL Server ROWVERSION - optimistic concurrency token for later draft-editing phases.</summary>
    public byte[] RowVersion { get; set; } = [];

    [ForeignKey(nameof(RevisionMastId))]
    public virtual RevisionMastEntity? RevisionMast { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
