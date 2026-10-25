using System.Collections.Concurrent;

namespace NtisPlatform.Application.Helpers;

/// <summary>
/// Remembers, for a short time, the sorted order of the units of an apartment screen: only the property ids of each row
/// (a row is one new property, or the several new properties that map to the same old property), never the rows themselves.
/// With it the next pages of a sorted list are cut from the order that the first page computed, instead of rebuilding every
/// unit of the society for each page. A request for page 1 always recomputes, so a new click on a header is never served from here.
/// </summary>
public interface IApartmentSortOrderCache
{
    bool TryGet(string key, out IReadOnlyList<int[]> groups);

    void Set(string key, IReadOnlyList<int[]> groups);
}

/// <summary>
/// Its own small store (not the app-wide <c>IMemoryCache</c>, whose size limit is for small lookups): at most
/// <see cref="MaxEntries"/> sorted orders, each kept for <see cref="TimeToLive"/>.
/// </summary>
public sealed class ApartmentSortOrderCache : IApartmentSortOrderCache
{
    public static readonly TimeSpan TimeToLive = TimeSpan.FromMinutes(2);
    public const int MaxEntries = 64;

    private readonly ConcurrentDictionary<string, (DateTime ExpiresAtUtc, IReadOnlyList<int[]> Groups)> _entries = new();

    public bool TryGet(string key, out IReadOnlyList<int[]> groups)
    {
        if (_entries.TryGetValue(key, out var entry) && entry.ExpiresAtUtc > DateTime.UtcNow)
        {
            groups = entry.Groups;
            return true;
        }

        groups = Array.Empty<int[]>();
        return false;
    }

    public void Set(string key, IReadOnlyList<int[]> groups)
    {
        var now = DateTime.UtcNow;
        foreach (var expired in _entries.Where(e => e.Value.ExpiresAtUtc <= now).Select(e => e.Key).ToList())
        {
            _entries.TryRemove(expired, out _);
        }

        // Full: drop the entries that expire first.
        while (_entries.Count >= MaxEntries)
        {
            var oldest = _entries.OrderBy(e => e.Value.ExpiresAtUtc).Select(e => e.Key).FirstOrDefault();
            if (oldest == null || !_entries.TryRemove(oldest, out _)) break;
        }

        _entries[key] = (now.Add(TimeToLive), groups);
    }
}
