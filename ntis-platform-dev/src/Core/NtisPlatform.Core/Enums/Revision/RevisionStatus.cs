using System.Text.Json.Serialization;

namespace NtisPlatform.Core.Enums.Revision;

/// <summary>
/// Revision workflow state (revision_api_rules.txt section 25):
/// <c>DRAFT</c> -&gt; <c>CALCULATED</c> -&gt; <c>APPROVED</c> -&gt; <c>POSTED</c>, with <c>CANCELLED</c>
/// reachable from <c>DRAFT</c>/<c>CALCULATED</c>. Once <c>POSTED</c>, a revision is immutable.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RevisionStatus
{
    DRAFT = 1,
    CALCULATED = 2,
    APPROVED = 3,
    POSTED = 4,
    CANCELLED = 5
}
