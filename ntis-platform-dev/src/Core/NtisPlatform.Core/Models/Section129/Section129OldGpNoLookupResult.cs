namespace NtisPlatform.Core.Models.Section129;

/// <summary>
/// Outcome of resolving an "Old Gram Panchayat Number" (PropertyMastOld.OldPropertyNo) to a single
/// current property.
/// </summary>
public enum Section129OldGpNoLookupStatus
{
    /// <summary>Resolved to exactly one distinct, actively mapped PropertyIdNew.</summary>
    Found,

    /// <summary>No PropertyMastOld row (active, not marked for deletion) has this OldPropertyNo at all.</summary>
    NotFound,

    /// <summary>The OldPropertyNo exists in PropertyMastOld, but none of its rows have a current,
    /// active PropertyMapDetail mapping to any current property.</summary>
    NotMapped,

    /// <summary>The old number resolves to more than one distinct current property (e.g. the same
    /// OldPropertyNo recorded under more than one ward, or split/merged into multiple current
    /// properties) — the caller must not pick one arbitrarily.</summary>
    Ambiguous
}

/// <summary>
/// Result of resolving an "Old Gram Panchayat Number" (PropertyMastOld.OldPropertyNo) to a single
/// current property. <see cref="PropertyId"/> is non-null only when <see cref="Status"/> is
/// <see cref="Section129OldGpNoLookupStatus.Found"/>.
/// </summary>
public record Section129OldGpNoLookupResult(int? PropertyId, Section129OldGpNoLookupStatus Status)
{
    public bool IsAmbiguous => Status == Section129OldGpNoLookupStatus.Ambiguous;

    public static readonly Section129OldGpNoLookupResult NotFound = new(null, Section129OldGpNoLookupStatus.NotFound);
    public static readonly Section129OldGpNoLookupResult NotMapped = new(null, Section129OldGpNoLookupStatus.NotMapped);
    public static Section129OldGpNoLookupResult Found(int propertyId) => new(propertyId, Section129OldGpNoLookupStatus.Found);
    public static readonly Section129OldGpNoLookupResult Ambiguous = new(null, Section129OldGpNoLookupStatus.Ambiguous);
}
