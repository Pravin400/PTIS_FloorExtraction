using System.Text.Json.Serialization;

namespace NtisPlatform.Core.Enums.Revision;

/// <summary>
/// Whether a revision applies to the entire financial year (<see cref="HISTORY_ONLY"/>) or is
/// split into one or more <c>RevisionPeriod</c> rows around an effective date
/// (<see cref="PERIOD_WISE"/>). See revision_api_rules.txt sections 8-9.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RevisionCalculationScope
{
    /// <summary>Whole-year revision. No RevisionPeriod rows are created.</summary>
    HISTORY_ONLY = 1,

    /// <summary>Revision is split into locked/editable periods around an effective date.</summary>
    PERIOD_WISE = 2
}
