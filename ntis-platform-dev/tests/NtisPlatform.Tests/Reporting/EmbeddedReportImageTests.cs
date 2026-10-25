using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class EmbeddedReportImageTests
{
    [Fact]
    public async Task BatchReadsOnlyUniquePositiveBindingsAndHandlesMissingDocuments()
    {
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        documents.Setup(d => d.GetDocumentContentsByBindingsAsync(
            It.Is<IReadOnlyCollection<int>>(ids => ids.Count == 2 && ids.Contains(7) && ids.Contains(8)),
            EmbeddedReportImage.MaxBytes, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, NtisPlatform.Application.DTOs.Document.BoundDocumentContentDto>
            { [7] = new() { ContentMimeType = "image/png", Content = [1, 2] } });
        var images = await EmbeddedReportImage.LoadBindingsAsync([0, -1, 7, 7, 8], documents.Object, CancellationToken.None);
        Assert.Equal(2, images.Count);
        Assert.Equal("data:image/png;base64,AQI=", images[7].DataUrl);
        Assert.Equal("Document binding is invalid", images[8].Status);
        documents.VerifyAll();
        documents.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task EmptyBatchNeedsNoDocumentRead()
    {
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        Assert.Empty(await EmbeddedReportImage.LoadBindingsAsync([0, -1], documents.Object, CancellationToken.None));
    }

    [Fact]
    public void EmptyContentDoesNotProduceAnImageUrl()
    {
        var image = EmbeddedReportImage.From(new() { MimeType = "image/png", Content = [] });
        Assert.Null(image.DataUrl);
        Assert.Equal("Image could not be loaded", image.Status);
    }

    [Fact]
    public async Task OversizedLogoStopsReadingAndDisposesStream()
    {
        var guid = Guid.NewGuid();
        var stream = new MemoryStream(new byte[EmbeddedReportImage.MaxBytes + 8192]);
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        documents.Setup(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)stream, "logo.png", "image/png"));
        var image = await EmbeddedReportImage.LoadLogoAsync(guid.ToString(), documents.Object, null, CancellationToken.None);
        Assert.Null(image.DataUrl);
        Assert.Equal("Logo image is too large", image.Status);
        Assert.False(stream.CanRead);
        documents.Verify(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CallerCancellationIsPropagated()
    {
        var guid = Guid.NewGuid();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(d => d.ViewDocumentAsync(guid, cancellation.Token))
            .ThrowsAsync(new OperationCanceledException(cancellation.Token));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            EmbeddedReportImage.LoadLogoAsync(guid.ToString(), documents.Object, null, cancellation.Token));
    }
}
