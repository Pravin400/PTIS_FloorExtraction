namespace NtisPlatform.Application.Interfaces.Asset_Management;

/// <summary>
/// Applies an approved grievance correction's changed fields onto the live target row.
/// One implementation per supported target table, resolved by <see cref="CanApply"/> — the same
/// per-target-table handler convention already used for document bindings
/// (<c>IDocumentBindingHandler</c>). Add a new implementation to support a new target table;
/// existing implementations never need to change.
/// </summary>
public interface IAssetGrievanceCorrectionApplier
{
    /// <summary>True if this applier writes to <paramref name="targetTableName"/> (e.g. "AMS.AssetLeaseRentDetails").</summary>
    bool CanApply(string targetTableName);

    /// <summary>
    /// Writes each field's value onto the live row identified by <paramref name="recordId"/>.
    /// Must be called inside the caller's own transaction/SaveChanges — this method only mutates
    /// the tracked entity, it does not commit. Implementations MUST treat every field as an
    /// absolute set, never a relative delta — the caller may pass the full current-value snapshot
    /// (not just the fields that actually changed), so re-applying an already-current value must
    /// be a safe no-op.
    /// </summary>
    Task ApplyAsync(int recordId, IReadOnlyDictionary<string, string> changedFields, CancellationToken cancellationToken = default);

    /// <summary>Reads the live row identified by <paramref name="recordId"/> as a flat field-name -> value snapshot, for BeforeData.</summary>
    Task<IReadOnlyDictionary<string, string>?> ReadSnapshotAsync(int recordId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Best-effort side effect to run AFTER the caller's transaction has already committed — e.g.
    /// recalculating a derived value via a service that opens its own transaction, which would fail
    /// if attempted inside the caller's still-open one (UnitOfWork.BeginTransactionAsync is not
    /// nesting-safe). The caller catches and logs any exception rather than failing the operation
    /// that already committed; implementations should not swallow errors themselves. Default: no-op.
    /// </summary>
    Task RunPostApplyFollowUpAsync(int recordId, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
