using System.Reflection;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Api.Controllers.RetrospectiveTax;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Infrastructure.Services;
using Xunit;

namespace NtisPlatform.Tests.Architecture;

/// <summary>
/// An RV recalculation and a retrospective engine run write the same TransMast / PolicyTaxDetails rows. They are only safe
/// next to another calculation of the same property when they run under the property's retrospective lock, and
/// <see cref="IRetrospectiveTaxRefresher"/> is what takes it around both. These tests pin who may call what, so a new
/// caller cannot quietly recalculate RV (or run the engine after an RV recalculation) outside the refresher.
/// </summary>
public class RetrospectiveLockArchitectureTests
{
    private static readonly Assembly[] ProductionAssemblies =
    {
        typeof(RetrospectiveTaxRefresher).Assembly,          // Application
        typeof(SqlServerRetrospectiveCalculationLock).Assembly, // Infrastructure
        typeof(ApartmentQCController).Assembly,              // Api
    };

    private static IEnumerable<string> TypesWithAConstructorParameterOf<T>() =>
        ProductionAssemblies
            .SelectMany(a => a.GetTypes())
            .Where(t => t is { IsClass: true, IsAbstract: false } && !t.Name.Contains('<'))
            .Where(t => t.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Any(c => c.GetParameters().Any(p => p.ParameterType == typeof(T))))
            .Select(t => t.FullName!)
            .OrderBy(n => n, StringComparer.Ordinal);

    [Fact]
    public void OnlyTheRefresherAndTheEngineTakeTheRateableValueService()
    {
        // The refresher recalculates RV under the property's lock; the engine recalculates it (forced) when a property has
        // no NETTAX rows, inside the lock it already holds. Everything else that needs an RV recalculation goes through
        // the refresher: an RV recalculation anywhere else would run without the lock, and without the engine run that
        // has to follow it (the recalculation replaces a certificate's current-year TransMast row with NETTAX).
        var takers = TypesWithAConstructorParameterOf<IRateableValueService>().ToList();

        // Section129Service (added on main after this guard) also recalculates RV directly; it is the one known exception: its
        // recalculation runs without the property's lock and without an engine run after it. Moving it onto the refresher is a
        // separate change (it is called back from RateableValueService itself, so it needs care not to ask for the lock twice).
        Assert.Equal(
            new[]
            {
                typeof(RetrospectiveTaxCalculationEngineService).FullName,
                typeof(RetrospectiveTaxRefresher).FullName,
                typeof(NtisPlatform.Application.Services.Section129.Section129Service).FullName,
            }.OrderBy(n => n, StringComparer.Ordinal),
            takers);
    }

    [Fact]
    public void OnlyTheCalculateEndpointTakesTheRetrospectiveEngineDirectly()
    {
        // A caller that holds the engine can run it after an RV recalculation of its own, outside the lock. The calculate
        // endpoint runs the engine on its own (no RV recalculation), and the engine takes the lock itself then. Anyone
        // who recalculates RV uses the refresher, which resolves the engine in a scope of its own.
        var takers = TypesWithAConstructorParameterOf<IRetrospectiveTaxCalculationEngineService>().ToList();

        Assert.Equal(new[] { typeof(RetrospectiveTaxCalculationController).FullName }, takers);
    }
}
