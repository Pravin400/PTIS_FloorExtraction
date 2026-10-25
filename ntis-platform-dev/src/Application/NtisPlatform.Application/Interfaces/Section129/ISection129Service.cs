using NtisPlatform.Application.DTOs.Section129;

namespace NtisPlatform.Application.Interfaces.Section129;

/// <summary>
/// Use-case boundary for the Section 129A single-assessment screen: reading the header +
/// year-wise schedule, and the officer's one-time "Apply" action.
/// </summary>
public interface ISection129Service
{
    /// <summary>Returns the header + schedule for a property, or null when the property doesn't exist.</summary>
    Task<Section129ScheduleDto?> GetScheduleAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Records the officer's Apply action (PropertySection129Application), then synchronously
    /// recalculates every finance year from the property's start year (or the last year already
    /// on file) through the current finance year — the fill-forward loop driven by
    /// PolicyCodeMaster.NextPolicyCodeId. Returns the refreshed schedule, or null when the
    /// property doesn't exist.
    /// </summary>
    Task<Section129ScheduleDto?> ApplyAsync(int propertyId, Section129ApplyRequestDto request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ensures Section 129A stage progression schedule is up-to-date through the current finance year.
    /// If Section 129A is not applied for the property, returns the current schedule without modifying data.
    /// </summary>
    Task<Section129ScheduleDto?> RecalculateAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// The officer-facing "Recalculate Assessment": first persists the supplied Property-Change-Check
    /// facts and OC-Date basis checkbox onto the application row (null leaves them as stored), then
    /// force-refreshes the RV basis and restages the schedule so those edits actually take effect.
    /// Flipping <see cref="Section129RecalculateRequestDto.UseOcDateBasis"/> wipes and rebuilds the
    /// whole schedule from the new anchor year.
    /// </summary>
    Task<Section129ScheduleDto?> RecalculateAsync(int propertyId, Section129RecalculateRequestDto? request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ensures Section 129A stage progression schedule is up-to-date through the current finance year,
    /// optionally indicating if the call originated from the Rateable Value engine.
    /// </summary>
    Task<Section129ScheduleDto?> RecalculateAsync(int propertyId, bool isFromRateableValueService, CancellationToken cancellationToken = default);

    /// <summary>
    /// Builds the Section 129A year-wise schedule as CSV text (same columns/rows/values the
    /// single-assessment screen's client-side "Export CSV" button produces), or null when the
    /// property doesn't exist.
    /// </summary>
    Task<string?> GetScheduleCsvAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Builds the Section 129A year-wise schedule as an A4-landscape PDF (server-side, via
    /// PdfSharp/MigraDoc), or null when the property doesn't exist.
    /// </summary>
    Task<byte[]?> GetSchedulePdfAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves a property by "Old Gram Panchayat Number" (PropertyMastOld.OldPropertyNo,
    /// comma-separated values accepted) and returns its schedule. Returns
    /// <see cref="Section129OldGpNoSearchResultDto.IsAmbiguous"/> = true (and no schedule) when the
    /// old number resolves to more than one distinct current property — the caller must not pick
    /// one and should ask the officer to search by UPIC or Ward + Property No instead.
    /// </summary>
    Task<Section129OldGpNoSearchResultDto> SearchByOldGpNoAsync(string oldGpNoRaw, CancellationToken cancellationToken = default);

    /// <summary>
    /// Every active property/partition directly in PropertyMast for a ward — used to build the
    /// single-assessment screen's combined "Property No" dropdown once a Ward is picked.
    /// </summary>
    Task<List<Section129WardPropertyOptionDto>> GetWardPropertiesAsync(int wardId, CancellationToken cancellationToken = default);
}
