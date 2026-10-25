using Microsoft.Extensions.Options;
using Ntis.Reporting.Rendering.Pdf;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.HtmlReport;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace NtisPlatform.Tests.Reporting;

public sealed class HtmlReportChunkingTests
{
    [Fact]
    public async Task Executor_fetches_only_the_requested_bounded_page()
    {
        var provider = new FakePagedProvider();
        var executor = new ReportDataExecutor(new ReportDataProviderResolver([provider]));

        var result = await executor.ExecutePageAsync(
            Guid.NewGuid(), provider.ProviderCode, [], 3, 100, true);

        Assert.True(result.SupportsPaging);
        Assert.True(result.HasMore);
        Assert.Equal(250, result.TotalCount);
        Assert.Single(result.DriverRows);
        Assert.Equal(2, provider.Calls.Count);
        Assert.All(provider.Calls, call => Assert.Equal((3, 100), (call.Page, call.PageSize)));
        Assert.Equal(["main", "propertyDetails"], provider.Calls.Select(x => x.Section));
    }

    [Fact]
    public async Task Executor_rejects_a_nonpaged_provider_before_loading_bulk_data()
    {
        var provider = new FakeNonPagedProvider();
        var executor = new ReportDataExecutor(new ReportDataProviderResolver([provider]));

        await Assert.ThrowsAsync<NotSupportedException>(() => executor.ExecutePageAsync(
            Guid.NewGuid(), provider.ProviderCode, [], 1, 100, true));

        Assert.False(provider.WasLoaded);
    }

    [Fact]
    public async Task Pdf_merger_preserves_the_supplied_chunk_order_and_renames_atomically()
    {
        var root = Path.Combine(Path.GetTempPath(), "ntis-merge-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        var first = Path.Combine(root, "chunk-000001.pdf");
        var second = Path.Combine(root, "chunk-000002.pdf");
        var temporary = Path.Combine(root, "final.pdf.tmp");
        var final = Path.Combine(root, "final.pdf");
        try
        {
            CreatePdf(first, 100);
            CreatePdf(second, 200);
            var merger = new PdfSharpPdfMerger();

            var result = await merger.MergeAsync([first, second], temporary, final);

            Assert.True(File.Exists(final));
            Assert.False(File.Exists(temporary));
            Assert.Equal([1, 1], result.InputPageCounts);
            Assert.Equal(2, result.TotalPageCount);
            Assert.Equal(new FileInfo(final).Length, result.OutputBytes);
            using var merged = PdfSharp.Pdf.IO.PdfReader.Open(final, PdfSharp.Pdf.IO.PdfDocumentOpenMode.Import);
            Assert.Equal(2, merged.PageCount);
            Assert.Equal(100, merged.Pages[0].Width.Point, 3);
            Assert.Equal(200, merged.Pages[1].Width.Point, 3);
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
    }

    [Fact]
    public async Task Pdf_merger_uses_atomic_single_chunk_fast_path()
    {
        var root = Path.Combine(Path.GetTempPath(), "ntis-single-merge-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        var input = Path.Combine(root, "chunk-000001.pdf");
        var temporary = Path.Combine(root, "final.pdf.tmp");
        var final = Path.Combine(root, "final.pdf");
        try
        {
            CreatePdf(input, 100);
            var original = await File.ReadAllBytesAsync(input);
            var merger = new PdfSharpPdfMerger();

            var result = await merger.MergeAsync([input], temporary, final);

            Assert.Equal(original, await File.ReadAllBytesAsync(final));
            Assert.Equal([1], result.InputPageCounts);
            Assert.Equal(1, result.TotalPageCount);
            Assert.False(File.Exists(temporary));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
    }

    private static void CreatePdf(string path, double width)
    {
        using var document = new PdfDocument();
        var page = document.AddPage();
        page.Width = XUnit.FromPoint(width);
        document.Save(path);
    }

    private sealed class FakePagedProvider : IPagedReportDataProvider
    {
        public string ProviderCode => "paged";
        public List<(string Section, int Page, int PageSize)> Calls { get; } = [];

        public IReadOnlyList<ReportSectionDescriptor> GetSections() =>
            [new("main", true), new("propertyDetails", true)];

        public Task<object> GetDataAsync(Dictionary<string, string> parameters, CancellationToken ct = default) =>
            throw new InvalidOperationException("The unbounded method must not be called.");

        public Task<ReportDataPage> GetDataPageAsync(
            Guid reportRequestId,
            Dictionary<string, string> parameters,
            string section,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            Calls.Add((section, page, pageSize));
            return Task.FromResult(new ReportDataPage
            {
                Section = section,
                Page = page,
                PageSize = pageSize,
                TotalCount = section == "main" ? 250 : -1,
                HasMore = true,
                Rows = [new { propertyId = page * pageSize }]
            });
        }
    }

    private sealed class FakeNonPagedProvider : IReportDataProvider
    {
        public string ProviderCode => "nonpaged";
        public bool WasLoaded { get; private set; }

        public Task<object> GetDataAsync(Dictionary<string, string> parameters, CancellationToken ct = default)
        {
            WasLoaded = true;
            return Task.FromResult<object>(Array.Empty<object>());
        }
    }
}
