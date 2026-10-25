using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Infrastructure.DependencyInjection;
using NtisPlatform.Infrastructure.Services;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure.DependencyInjection;

/// <summary>
/// What every host that calculates retrospective tax gets from <c>AddRetrospectiveTaxEngine</c>: the engine, the refresher
/// that runs it after an RV recalculation, the lookup the engine needs, and the cross-process database lock, which is not
/// optional. A host without the connection string the lock needs
/// fails at start-up instead of running without it.
/// </summary>
public class RetrospectiveTaxServiceCollectionExtensionsTests
{
    private const string ConnectionString = "Server=(localdb)\\MSSQLLocalDB;Database=NtisTestDb;Trusted_Connection=True;";

    private static IConfiguration Configuration(string? connectionString) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = connectionString })
            .Build();

    [Fact]
    public void RegistersTheEngineScoped_AndTheDatabaseLockAsOneSingleton()
    {
        var services = new ServiceCollection();

        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));

        var engine = Assert.Single(services, d => d.ServiceType == typeof(IRetrospectiveTaxCalculationEngineService));
        Assert.Equal(typeof(RetrospectiveTaxCalculationEngineService), engine.ImplementationType);
        Assert.Equal(ServiceLifetime.Scoped, engine.Lifetime);
        var calculationLock = Assert.Single(services, d => d.ServiceType == typeof(IRetrospectiveCalculationLock));
        Assert.Equal(ServiceLifetime.Singleton, calculationLock.Lifetime);
    }

    [Fact]
    public void RegistersTheRefresherScoped_NextToTheEngine_SoEveryHostThatCanRecalculateRvCanRunTheEngineAfterIt()
    {
        var services = new ServiceCollection();

        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));

        var refresher = Assert.Single(services, d => d.ServiceType == typeof(IRetrospectiveTaxRefresher));
        Assert.Equal(typeof(RetrospectiveTaxRefresher), refresher.ImplementationType);
        Assert.Equal(ServiceLifetime.Scoped, refresher.Lifetime); // it recalculates RV on the caller's own DbContext
    }

    [Fact]
    public void TheRefresherNeedsNothingFromTheHostBesidesTheRvService()
    {
        // the engine is resolved from a scope of its own at run time, so the refresher is built here and the engine is not:
        // the host adds its RV service (it has to, for the recalculation) and everything else comes with the extension
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddScoped(_ => Mock.Of<IRateableValueService>());
        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));
        using var provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
        using var scope = provider.CreateScope();

        var refresher = scope.ServiceProvider.GetRequiredService<IRetrospectiveTaxRefresher>();

        Assert.IsType<RetrospectiveTaxRefresher>(refresher);
    }

    [Fact]
    public void TheDatabaseLockIsTheSqlServerOne_AndOneInstanceServesEveryScope()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));
        using var provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });

        var first = provider.GetRequiredService<IRetrospectiveCalculationLock>();
        using var scope = provider.CreateScope();
        var second = scope.ServiceProvider.GetRequiredService<IRetrospectiveCalculationLock>();

        Assert.IsType<SqlServerRetrospectiveCalculationLock>(first);
        Assert.Same(first, second);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void WithoutTheConnectionStringOfTheLock_TheHostFailsAtRegistration_NotAtTheFirstCalculation(string? connectionString)
    {
        var services = new ServiceCollection();

        var failure = Assert.Throws<InvalidOperationException>(() => services.AddRetrospectiveTaxEngine(Configuration(connectionString)));

        Assert.Contains("ConnectionStrings:DefaultConnection", failure.Message);
        Assert.Empty(services); // nothing was registered: no host is left half set up
    }

    [Fact]
    public void ARegistrationOfTheHostForThePolicyCodeLookupIsKept_AndWithoutOneTheDefaultIsAdded()
    {
        var hostLookup = new Mock<IPolicyCodeLookupService>().Object;
        var withHostRegistration = new ServiceCollection();
        withHostRegistration.AddSingleton(hostLookup);
        withHostRegistration.AddRetrospectiveTaxEngine(Configuration(ConnectionString));

        var withoutHostRegistration = new ServiceCollection();
        withoutHostRegistration.AddRetrospectiveTaxEngine(Configuration(ConnectionString));

        Assert.Single(withHostRegistration, d => d.ServiceType == typeof(IPolicyCodeLookupService));
        Assert.Same(hostLookup, withHostRegistration.Single(d => d.ServiceType == typeof(IPolicyCodeLookupService)).ImplementationInstance);
        var added = Assert.Single(withoutHostRegistration, d => d.ServiceType == typeof(IPolicyCodeLookupService));
        Assert.Equal(typeof(PolicyCodeLookupService), added.ImplementationType);
    }

    [Fact]
    public void RegisteringTwice_DoesNotDuplicateThePolicyCodeLookup()
    {
        var services = new ServiceCollection();

        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));
        services.AddRetrospectiveTaxEngine(Configuration(ConnectionString));

        Assert.Single(services, d => d.ServiceType == typeof(IPolicyCodeLookupService));
    }
}