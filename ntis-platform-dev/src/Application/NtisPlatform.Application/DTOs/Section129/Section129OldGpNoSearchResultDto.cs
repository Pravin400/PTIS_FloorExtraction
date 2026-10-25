namespace NtisPlatform.Application.DTOs.Section129;

/// <summary>Outcome of an "Old Gram Panchayat Number" search.</summary>
public enum Section129OldGpNoSearchStatus
{
    /// <summary>Resolved to exactly one property — <see cref="Section129OldGpNoSearchResultDto.Schedule"/> is populated.</summary>
    Found,

    /// <summary>No PropertyMastOld row has this old number at all (unknown/typo'd number).</summary>
    NotFound,

    /// <summary>The old number exists in PropertyMastOld, but isn't currently mapped to any property.</summary>
    NotMapped,

    /// <summary>The old number resolves to more than one distinct current property — the controller
    /// returns a 409 telling the officer to search by UPIC or Ward + Property No instead.</summary>
    Ambiguous
}

/// <summary>
/// Result of an "Old Gram Panchayat Number" search. <see cref="Schedule"/> is non-null only when
/// <see cref="Status"/> is <see cref="Section129OldGpNoSearchStatus.Found"/>.
/// </summary>
public record Section129OldGpNoSearchResultDto(Section129ScheduleDto? Schedule, Section129OldGpNoSearchStatus Status)
{
    public bool IsAmbiguous => Status == Section129OldGpNoSearchStatus.Ambiguous;

    public static readonly Section129OldGpNoSearchResultDto NotFound = new(null, Section129OldGpNoSearchStatus.NotFound);
    public static readonly Section129OldGpNoSearchResultDto NotMapped = new(null, Section129OldGpNoSearchStatus.NotMapped);
    public static Section129OldGpNoSearchResultDto Found(Section129ScheduleDto schedule) => new(schedule, Section129OldGpNoSearchStatus.Found);
    public static readonly Section129OldGpNoSearchResultDto Ambiguous = new(null, Section129OldGpNoSearchStatus.Ambiguous);
}
