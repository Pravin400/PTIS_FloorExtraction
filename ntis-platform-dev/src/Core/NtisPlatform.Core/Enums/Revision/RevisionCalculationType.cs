using System.Text.Json.Serialization;

namespace NtisPlatform.Core.Enums.Revision;

/// <summary>
/// Whether a Property Revision recalculates Rateable Value or Capital Value.
/// Member names intentionally match the wire/DB literal values used throughout the Revision
/// module (see revision_api_rules.txt section 16) so that JSON payloads and the
/// <c>PTIS.RevisionMast.CalculationType</c> column both read "RV"/"CV" without extra mapping.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RevisionCalculationType
{
    RV = 1,
    CV = 2,

    /// <summary>
    /// Matches the CK_RevisionMast_CalculationType check constraint ('RV','CV','BOTH').
    /// Not yet driven end-to-end by the calculation engine (Phase 4+ handles RV; CV/BOTH are
    /// schema-ready but out of scope until the CV revision calculation is built) - Phase 1 accepts
    /// and stores it, nothing more.
    /// </summary>
    BOTH = 3
}
