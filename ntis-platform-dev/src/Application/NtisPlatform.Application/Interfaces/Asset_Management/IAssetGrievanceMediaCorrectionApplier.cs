using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

/// <summary>
/// Applies an approved grievance media correction (photo or document ADD/REPLACE/DELETE) onto
/// the underlying asset. One implementation per <see cref="AssetGrievanceMediaCorrectionEntity.TargetMediaType"/>
/// ("PHOTO"/"DOCUMENT"), resolved by <see cref="CanApply"/>. Deliberately not the same
/// abstraction as <see cref="IAssetGrievanceCorrectionApplier"/> — that one is shaped around a
/// string-keyed field dictionary and TargetTableName dispatch, which is the hack this table
/// replaces for photo corrections specifically.
/// </summary>
public interface IAssetGrievanceMediaCorrectionApplier
{
    /// <summary>True if this applier handles <paramref name="targetMediaType"/> ("PHOTO" or "DOCUMENT").</summary>
    bool CanApply(string targetMediaType);

    /// <summary>
    /// Performs the ADD/REPLACE/DELETE described by <paramref name="row"/> against the asset
    /// identified by <paramref name="assetId"/>. Must be called inside the caller's own
    /// transaction — the underlying asset-photo/asset-document services only call
    /// SaveChangesAsync internally (no nested transactions), so this is safe to run inside the
    /// caller's ambient transaction.
    /// </summary>
    Task ApplyAsync(AssetGrievanceMediaCorrectionEntity row, int assetId, int userId, CancellationToken cancellationToken = default);
}
