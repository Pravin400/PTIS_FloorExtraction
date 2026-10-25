using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Reporting.Html;
using NtisPlatform.Infrastructure.Repositories;

namespace NtisPlatform.Tests.Reporting;

public class ReportingServiceRegistrationTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void KarakarniResolvesWithWorkerOrExistingApiBrandingService(bool hasApiBranding)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddMemoryCache();
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));
        services.AddSingleton(Mock.Of<IDocumentApplicationService>());
        services.AddSingleton(Mock.Of<ICurrentTenantService>());
        var apiBranding = Mock.Of<IUlbConfigService>();
        if (hasApiBranding) services.AddSingleton(apiBranding);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Database=ReportRegistrationTest;Integrated Security=true;TrustServerCertificate=true",
        }).Build();
        services.AddHtmlReporting(configuration);
        using var container = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
        using var scope = container.CreateScope();

        var branding = scope.ServiceProvider.GetRequiredService<IUlbConfigService>();
        if (hasApiBranding) Assert.Same(apiBranding, branding);
        else Assert.IsType<UlbConfigService>(branding);
        // This performs service resolution only, with no SQL queries or report generation.
        Assert.NotNull(ActivatorUtilities.CreateInstance<KarakarniDataProvider>(scope.ServiceProvider));
    }
}
