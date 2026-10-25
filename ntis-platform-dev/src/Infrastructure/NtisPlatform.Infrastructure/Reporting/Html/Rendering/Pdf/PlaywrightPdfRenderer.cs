using System.Collections.Concurrent;
using Microsoft.Playwright;

namespace Ntis.Reporting.Rendering.Pdf;

public interface IPdfRenderer : IAsyncDisposable
{
    Task WarmUpAsync(CancellationToken ct = default);
    Task<byte[]> RenderAsync(string html, CancellationToken ct = default, bool tagged = true);
}

public sealed class PlaywrightPdfRenderer(int maximumConcurrency = 2) : IPdfRenderer
{
    private readonly int _maximumConcurrency = Math.Max(1, maximumConcurrency);
    private readonly SemaphoreSlim _gate = new(Math.Max(1, maximumConcurrency));
    private readonly SemaphoreSlim _browserGate = new(1, 1);
    private readonly ConcurrentBag<IPage> _pagePool = new();
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private IBrowserContext? _sharedContext;

    public async Task WarmUpAsync(CancellationToken ct = default)
    {
        await EnsureBrowserAsync(ct);
        // Pre-warm pages in the pool up to maximum concurrency
        while (_pagePool.Count < _maximumConcurrency)
        {
            var page = await _sharedContext!.NewPageAsync();
            _pagePool.Add(page);
        }
    }

    public async Task<byte[]> RenderAsync(
        string html,
        CancellationToken ct = default,
        bool tagged = true)
    {
        await _gate.WaitAsync(ct);
        IPage? page = null;
        try
        {
            await EnsureBrowserAsync(ct);

            while (_pagePool.TryTake(out var pooledPage))
            {
                if (!pooledPage.IsClosed)
                {
                    page = pooledPage;
                    break;
                }
            }

            page ??= await _sharedContext!.NewPageAsync();

            await page.SetContentAsync(html, new PageSetContentOptions { WaitUntil = WaitUntilState.Load });
            return await page.PdfAsync(new PagePdfOptions
            {
                PrintBackground = true,
                PreferCSSPageSize = true,
                Tagged = tagged
            });
        }
        catch
        {
            if (page is not null && !page.IsClosed)
            {
                try { await page.CloseAsync(); } catch { }
                page = null;
            }
            throw;
        }
        finally
        {
            if (page is not null && !page.IsClosed)
            {
                _pagePool.Add(page);
            }
            _gate.Release();
        }
    }

    private static BrowserTypeLaunchOptions CreateLaunchOptions() => new()
    {
        Headless = true,
        Args = [
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--disable-extensions",
            "--disable-gpu",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-sync",
            "--hide-scrollbars",
            "--mute-audio"
        ]
    };

    private async Task EnsureBrowserAsync(CancellationToken ct)
    {
        if (_browser?.IsConnected == true && _sharedContext is not null) return;
        await _browserGate.WaitAsync(ct);
        try
        {
            if (_browser?.IsConnected == true && _sharedContext is not null) return;

            // If a local browser bundle exists in .playwright\package\.local-browsers, set PLAYWRIGHT_BROWSERS_PATH=0
            var localBrowsersDir = Path.Combine(AppContext.BaseDirectory, ".playwright", "package", ".local-browsers");
            if (Directory.Exists(localBrowsersDir) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH")))
            {
                Environment.SetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", "0");
            }

            _playwright ??= await Playwright.CreateAsync();

            try
            {
                _browser = await _playwright.Chromium.LaunchAsync(CreateLaunchOptions());
            }
            catch (PlaywrightException ex) when (ex.Message.Contains("Executable doesn't exist", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("playwright install", StringComparison.OrdinalIgnoreCase))
            {
                // Fallback: If browser binary is missing on target host, automatically install matching Chromium
                Microsoft.Playwright.Program.Main(["install", "chromium"]);
                _browser = await _playwright.Chromium.LaunchAsync(CreateLaunchOptions());
            }

            _sharedContext = await _browser.NewContextAsync(new BrowserNewContextOptions
            {
                Locale = "mr-IN",
                JavaScriptEnabled = false
            });

            await _sharedContext.RouteAsync("**/*", async route =>
            {
                var url = route.Request.Url;
                if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    await route.AbortAsync();
                else
                    await route.ContinueAsync();
            });
        }
        finally { _browserGate.Release(); }
    }

    public async ValueTask DisposeAsync()
    {
        while (_pagePool.TryTake(out var page))
        {
            try { await page.CloseAsync(); } catch { }
        }

        if (_sharedContext is not null)
        {
            try { await _sharedContext.DisposeAsync(); } catch { }
        }

        if (_browser is not null)
        {
            try { await _browser.DisposeAsync(); } catch { }
        }

        _playwright?.Dispose();
        _browserGate.Dispose();
        _gate.Dispose();
    }
}
