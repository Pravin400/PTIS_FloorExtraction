using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace NtisPlatform.Infrastructure.Caching;

/// <summary>
/// Isolated, narrow cache surface for property/apartment search-suggestion and unified-search
/// data (<see cref="Repositories.ApartmentQcSearchRepository"/>,
/// <see cref="Repositories.Property.PropertySearchRepository"/>). Backed by its own
/// <see cref="MemoryCache"/> instance, not the shared app-wide <see cref="IMemoryCache"/>, so this
/// feature's entries are never evicted to make room for — and never evict — unrelated app-wide
/// cache consumers (security-stamp, security-settings, module lookup, email settings).
/// Deliberately does NOT inherit <see cref="IMemoryCache"/>: the raw <c>Set(...)</c>/
/// <c>CreateEntry(...)</c> API (which lets a caller omit <c>Size</c> and throw at runtime against
/// a size-limited cache) isn't reachable through this interface at all — <see cref="SetSuggestion{T}"/>
/// is the only way to write an entry, and every entry always counts as exactly one unit (no
/// caller-supplied size to accidentally get wrong).
/// </summary>
public interface ISearchSuggestionCache
{
    bool TryGetValue<TItem>(object key, out TItem? value);

    void SetSuggestion<T>(string key, T value, TimeSpan absoluteExpirationRelativeToNow);
}

/// <summary>
/// Concrete <see cref="ISearchSuggestionCache"/>, wrapping its own private <see cref="MemoryCache"/>
/// instance and options — independent of the app-wide <c>IMemoryCache</c> singleton.
/// </summary>
public sealed class SearchSuggestionCache : ISearchSuggestionCache, IDisposable
{
    /// <summary>
    /// Default when <c>Caching:SearchSuggestionCache:SizeLimit</c> isn't configured (or is
    /// configured as zero/negative — see <see cref="BuildOptions"/>). Sized for this feature's two
    /// consumers, each using Size = 1 per entry:
    ///   - ApartmentQcSearchRepository: one entry per ward searched (5min TTL).
    ///   - PropertySearchRepository: one entry per ward for its suggestion typeahead (5min TTL),
    ///     plus one entry per distinct (query text, page number, page size) combination for
    ///     UnifiedSearchPropertiesAsync's free-text search (also 5min TTL) — naturally higher
    ///     cardinality than a per-ward key, since every distinct search string/page a user
    ///     requests gets its own entry.
    /// 2000 gives comfortable headroom for a few hundred wards across both features plus a few
    /// thousand distinct in-flight unified-search query/page combinations within any given
    /// 5-minute window. Traffic shape varies by ULB/environment (ward count, active search
    /// volume), so this is configurable rather than fixed — see appsettings.json's "Caching"
    /// section — without needing a code deployment to retune it.
    /// </summary>
    public const long DefaultSizeLimit = 2000;

    public const double DefaultCompactionPercentage = 0.25;

    private readonly MemoryCache _inner;

    public SearchSuggestionCache(IConfiguration configuration)
    {
        _inner = new MemoryCache(BuildOptions(configuration));
    }

    public bool TryGetValue<TItem>(object key, out TItem? value)
    {
        if (_inner.TryGetValue(key, out var result))
        {
            value = (TItem?)result;
            return true;
        }

        value = default;
        return false;
    }

    public void SetSuggestion<T>(string key, T value, TimeSpan absoluteExpirationRelativeToNow)
    {
        _inner.Set(key, value, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpirationRelativeToNow,
            Size = 1
        });
    }

    public void Dispose() => _inner.Dispose();

    private static MemoryCacheOptions BuildOptions(IConfiguration configuration)
    {
        // A configured SizeLimit <= 0 would make the cache reject every entry (or throw, for
        // negative values) -- fall back to the default rather than let a bad deployment value
        // silently disable caching. CompactionPercentage must be within [0, 1] or MemoryCache's
        // own constructor throws ArgumentOutOfRangeException; clamp defensively instead.
        var configuredSizeLimit = configuration.GetValue<long?>("Caching:SearchSuggestionCache:SizeLimit");
        var sizeLimit = configuredSizeLimit is > 0 ? configuredSizeLimit.Value : DefaultSizeLimit;

        var configuredCompactionPercentage = configuration.GetValue<double?>("Caching:SearchSuggestionCache:CompactionPercentage");
        var compactionPercentage = configuredCompactionPercentage.HasValue
            ? Math.Clamp(configuredCompactionPercentage.Value, 0.0, 1.0)
            : DefaultCompactionPercentage;

        return new MemoryCacheOptions
        {
            SizeLimit = sizeLimit,
            CompactionPercentage = compactionPercentage
        };
    }
}
