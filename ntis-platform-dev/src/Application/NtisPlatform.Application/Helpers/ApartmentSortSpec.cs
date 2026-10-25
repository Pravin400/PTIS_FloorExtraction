namespace NtisPlatform.Application.Helpers;

/// <summary>The table whose column header was clicked on the apartment screen.</summary>
public enum ApartmentSortPanel
{
    Survey,
    Difference,
    Existing
}

/// <summary>
/// The sort of the apartment comparison screen. The three tables (New Survey, Difference Engine, Existing Assessment) show the
/// same units side by side, so there is one sort for all of them: the clicked column decides the order of the units.
/// Sent as <c>SortBy = "&lt;panel&gt;:&lt;column&gt;"</c> (for example <c>survey:tax</c>, <c>existing:rv</c>, <c>difference:rtTax</c>)
/// with <c>SortOrder = asc|desc</c>.
/// </summary>
public sealed record ApartmentSortSpec(ApartmentSortPanel Panel, string Column, bool Descending)
{
    /// <summary>The sort for the given query values, or <c>null</c> when none (or an unknown / not sortable column) was asked for.</summary>
    public static ApartmentSortSpec? TryParse(string? sortBy, string? sortOrder)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return null;
        }

        var parts = sortBy.Split(':', 2, StringSplitOptions.TrimEntries);
        if (parts.Length != 2 || parts[1].Length == 0)
        {
            return null;
        }

        var panel = parts[0].ToLowerInvariant() switch
        {
            "survey" => ApartmentSortPanel.Survey,
            "difference" => ApartmentSortPanel.Difference,
            "existing" => ApartmentSortPanel.Existing,
            _ => (ApartmentSortPanel?)null
        };

        if (panel is null || !ApartmentComparisonSorter.IsSortable(panel.Value, parts[1]))
        {
            return null;
        }

        var descending = string.Equals(sortOrder?.Trim(), "desc", StringComparison.OrdinalIgnoreCase);
        return new ApartmentSortSpec(panel.Value, ApartmentComparisonSorter.CanonicalColumn(panel.Value, parts[1]), descending);
    }

    /// <summary>Identifies the sort inside a cache key.</summary>
    public string CacheKey => $"{Panel}:{Column}:{(Descending ? "desc" : "asc")}";
}
