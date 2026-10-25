using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionApplyTaxesMaster - snapshot of the property-level tax exemption list
/// (ApplyTaxesMaster) used by the RV engine. Written by the revision snapshot code.
/// </summary>
public class RevisionApplyTaxesMasterEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int PropertyId { get; set; }
    public int? SourceApplyTaxesMasterId { get; set; }
    public int TaxId { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
