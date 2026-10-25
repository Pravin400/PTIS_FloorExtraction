using System.Net;
using System.Net.Http.Headers;
using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class RemoteReportImageTests
{
    [Fact]
    public async Task EmbedsImageBytesSoPdfNeedsNoNetworkRequest()
    {
        using var client = Client([137, 80, 78, 71], "image/png");
        var result = await RemoteReportImage.LoadAsync(client, new Uri("https://example.test/logo.png"), 1024, default);
        Assert.Equal("data:image/png;base64,iVBORw==", result);
    }

    [Theory]
    [InlineData("text/html", 1024)]
    [InlineData("image/png", 2)]
    public async Task RejectsNonImagesAndOversizedResponses(string mime, long limit)
    {
        using var client = Client([1, 2, 3, 4], mime);
        Assert.Null(await RemoteReportImage.LoadAsync(client, new Uri("https://example.test/logo"), limit, default));
    }

    [Fact]
    public async Task RejectsOversizedStreamWithoutContentLength()
    {
        using var client = new HttpClient(new ResponseHandler(() =>
        {
            var content = new StreamContent(new NonSeekableStream(new byte[1025]));
            content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = content };
        }));
        Assert.Null(await RemoteReportImage.LoadAsync(client, new Uri("https://example.test/logo"), 1024, default));
    }

    private static HttpClient Client(byte[] bytes, string mime) => new(new ResponseHandler(() =>
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue(mime);
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = content };
    }));

    private sealed class ResponseHandler(Func<HttpResponseMessage> response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
            => Task.FromResult(response());
    }

    private sealed class NonSeekableStream(byte[] bytes) : MemoryStream(bytes)
    {
        public override bool CanSeek => false;
    }
}
