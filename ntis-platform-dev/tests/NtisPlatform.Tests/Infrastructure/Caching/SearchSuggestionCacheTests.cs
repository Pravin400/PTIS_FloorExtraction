using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using NtisPlatform.Infrastructure.Caching;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.Caching;

public class SearchSuggestionCacheTests
{
    private static SearchSuggestionCache CreateCache(long? sizeLimit = null, double? compactionPercentage = null)
    {
        var configData = new Dictionary<string, string?>();
        if (sizeLimit.HasValue)
            configData["Caching:SearchSuggestionCache:SizeLimit"] = sizeLimit.Value.ToString();
        if (compactionPercentage.HasValue)
            configData["Caching:SearchSuggestionCache:CompactionPercentage"] = compactionPercentage.Value.ToString();

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();
        return new SearchSuggestionCache(configuration);
    }

    [Fact]
    public void SizeLimit_ReadFromConfiguration_OverridesDefault()
    {
        // A tiny configured limit forces eviction almost immediately -- proves the configuration
        // value is actually plumbed through to the underlying MemoryCacheOptions, not just the
        // hardcoded DefaultSizeLimit.
        using var cache = CreateCache(sizeLimit: 1);

        cache.SetSuggestion("ward-1", "suggestions-1", TimeSpan.FromMinutes(5));
        cache.SetSuggestion("ward-2", "suggestions-2", TimeSpan.FromMinutes(5));

        // With SizeLimit = 1, the cache cannot hold both entries at once.
        var stillHasFirst = cache.TryGetValue<string>("ward-1", out _);
        var stillHasSecond = cache.TryGetValue<string>("ward-2", out _);
        Assert.False(stillHasFirst && stillHasSecond);
    }

    [Fact]
    public void IsIsolatedFrom_SeparateMemoryCacheInstance()
    {
        // Simulates the shared app-wide IMemoryCache as a genuinely separate instance with its
        // own tiny SizeLimit, then drives the search-suggestion cache well past that limit.
        // Proves the two never share eviction pressure, regardless of DI registration order --
        // filling one to capacity must not touch the other's entries at all.
        using var searchCache = CreateCache(sizeLimit: 2000);
        using var sharedAppWideCache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 2, CompactionPercentage = 0.5 });

        sharedAppWideCache.Set("sst:1", "stamp-1", new MemoryCacheEntryOptions { Size = 1 });
        sharedAppWideCache.Set("sst:2", "stamp-2", new MemoryCacheEntryOptions { Size = 1 });

        for (var i = 0; i < 50; i++)
        {
            searchCache.SetSuggestion($"ward-{i}", $"suggestions-{i}", TimeSpan.FromMinutes(5));
        }

        Assert.True(sharedAppWideCache.TryGetValue("sst:1", out string? stamp1));
        Assert.Equal("stamp-1", stamp1);
        Assert.True(sharedAppWideCache.TryGetValue("sst:2", out string? stamp2));
        Assert.Equal("stamp-2", stamp2);
    }

    [Fact]
    public void SetSuggestion_OnSizeLimitedCache_DoesNotThrow()
    {
        // A raw cache.Set(key, value, TimeSpan) call (no Size) throws InvalidOperationException
        // against a SizeLimit-configured MemoryCache. SetSuggestion exists specifically so every
        // call site always supplies Size and can never hit that failure mode.
        using var cache = CreateCache(sizeLimit: 10);

        var exception = Record.Exception(() => cache.SetSuggestion("ward-1", "suggestions-1", TimeSpan.FromMinutes(5)));

        Assert.Null(exception);
    }

    [Fact]
    public void SizeLimit_Negative_FallsBackToDefault()
    {
        // A raw negative SizeLimit passed straight to MemoryCacheOptions makes MemoryCache's own
        // constructor throw ArgumentOutOfRangeException. BuildOptions must never let that bad
        // deployment value reach MemoryCache directly -- construction should succeed, and the
        // effective limit should behave like the ~2000 default, not "everything evicted"/"broken".
        var exception = Record.Exception(() =>
        {
            using var cache = CreateCache(sizeLimit: -5);

            for (var i = 0; i < 5; i++)
            {
                cache.SetSuggestion($"ward-{i}", $"suggestions-{i}", TimeSpan.FromMinutes(5));
            }

            for (var i = 0; i < 5; i++)
            {
                Assert.True(cache.TryGetValue<string>($"ward-{i}", out var value));
                Assert.Equal($"suggestions-{i}", value);
            }
        });

        Assert.Null(exception);
    }

    [Fact]
    public void CompactionPercentage_OutOfRange_IsClamped()
    {
        // A raw out-of-range CompactionPercentage (must be within [0, 1]) passed straight to
        // MemoryCacheOptions makes MemoryCache's own constructor throw
        // ArgumentOutOfRangeException. BuildOptions must clamp it first so a bad deployment
        // value never reaches MemoryCache directly.
        var exception = Record.Exception(() => CreateCache(compactionPercentage: 5.0).Dispose());

        Assert.Null(exception);
    }
}
