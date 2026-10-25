using System.Reflection;
using Moq;
using NtisPlatform.Application.DTOs.Auth;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class ReportProviderLogoTests
{
    [Fact]
    public async Task CommonConfiguredLogoLoaderReflectsChangesWithoutFileReads()
    {
        var configuration = new Mock<IUlbConfigService>();
        configuration.SetupSequence(c => c.GetUlbConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UlbConfigDto { UlbLogo = "data:image/png;base64,AQI=" })
            .ReturnsAsync(new UlbConfigDto { UlbLogo = "data:image/png;base64,AwQ=" });
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        var clients = new Mock<IHttpClientFactory>(MockBehavior.Strict);
        Assert.Equal("data:image/png;base64,AQI=", await EmbeddedReportImage.LoadConfiguredLogoAsync(
            configuration.Object, documents.Object, clients.Object, CancellationToken.None));
        Assert.Equal("data:image/png;base64,AwQ=", await EmbeddedReportImage.LoadConfiguredLogoAsync(
            configuration.Object, documents.Object, clients.Object, CancellationToken.None));
    }

    [Theory]
    [InlineData(typeof(PrarupYadiDataProvider))]
    [InlineData(typeof(Notice119DataProvider))]
    public async Task LogoUsesLatestEffectiveUlbConfiguration(Type providerType)
    {
        var guid = Guid.NewGuid();
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        documents.Setup(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)new MemoryStream([1, 2]), "logo.png", "image/png"));
        var configuration = new Mock<IUlbConfigService>();
        configuration.SetupSequence(c => c.GetUlbConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UlbConfigDto { UlbLogo = $"/api/UlbImageMaster/{guid}/view" })
            .ReturnsAsync(new UlbConfigDto { UlbLogo = "data:image/png;base64,AwQ=" });
        var provider = Provider(providerType, configuration.Object, documents.Object);
        Assert.Equal("data:image/png;base64,AQI=", await Logo(provider));
        Assert.Equal("data:image/png;base64,AwQ=", await Logo(provider));
        documents.Verify(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()), Times.Once);
        documents.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(typeof(PrarupYadiDataProvider))]
    [InlineData(typeof(Notice119DataProvider))]
    public async Task MissingConfiguredLogoDoesNotReadAnUnrelatedDefault(Type providerType)
    {
        var configuration = new Mock<IUlbConfigService>();
        configuration.Setup(c => c.GetUlbConfigAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new UlbConfigDto());
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        Assert.Equal(string.Empty, await Logo(Provider(providerType, configuration.Object, documents.Object)));
    }

    private static object Provider(Type type, IUlbConfigService configuration, IDocumentApplicationService documents)
    {
        var constructor = type.GetConstructors().Single();
        return constructor.Invoke(constructor.GetParameters().Select(p =>
            p.Name == "ulbConfigService" ? (object)configuration : p.Name == "documentService" ? documents : null).ToArray());
    }

    private static Task<string> Logo(object provider) => (Task<string>)provider.GetType()
        .GetMethod("ResolveCouncilLogoAsync", BindingFlags.NonPublic | BindingFlags.Instance)!
        .Invoke(provider, [CancellationToken.None])!;
}
