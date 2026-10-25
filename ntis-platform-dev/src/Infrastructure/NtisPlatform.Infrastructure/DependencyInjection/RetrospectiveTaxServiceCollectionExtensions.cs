using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Infrastructure.Services;

namespace NtisPlatform.Infrastructure.DependencyInjection;

/// <summary>
/// The registrations every host that runs a retrospective calculation needs, in one place, so that the API and the Worker
/// cannot drift apart: the engine, the refresher that recalculates RV and runs the engine after it, the policy-code lookup
/// the engine needs, and the cross-process database lock (<see cref="IRetrospectiveCalculationLock"/>). The lock is not optional. It is what keeps two hosts (API instances, the
/// Worker) from calculating the same property at the same time, and an engine that could run without it would let two
/// overlapping runs leave a stale or double demand in the ledger, a fault that only shows under concurrency. A host
/// without the connection string the lock needs therefore fails here, at start-up, instead of running without the lock.
/// </summary>
public static class RetrospectiveTaxServiceCollectionExtensions
{
    /// <summary>The connection string the retrospective calculation lock connects with (the database EF writes the ledger to).</summary>
    public const string ConnectionStringName = "DefaultConnection";

    /// <summary>
    /// Registers <see cref="IRetrospectiveTaxCalculationEngineService"/>, <see cref="IRetrospectiveTaxRefresher"/>,
    /// <see cref="IPolicyCodeLookupService"/> (when the host has not registered it) and the SQL Server
    /// <see cref="IRetrospectiveCalculationLock"/>. The services they read (repositories, the RV services, ...) are the host's
    /// own registrations, as for every other service.
    /// </summary>
    /// <exception cref="InvalidOperationException">The connection string of the lock is not configured.</exception>
    public static IServiceCollection AddRetrospectiveTaxEngine(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString(ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"ConnectionStrings:{ConnectionStringName} is not configured. The retrospective tax engine takes a database lock on it " +
                "(one application lock per property) so that no two hosts calculate the same property at once, and refuses to run " +
                "without that lock.");
        }

        services.TryAddScoped<IPolicyCodeLookupService, PolicyCodeLookupService>();
        services.AddScoped<IRetrospectiveTaxCalculationEngineService, RetrospectiveTaxCalculationEngineService>();
        // Every caller that recalculates RV goes through the refresher: RV, then the engine, under the property's lock. It is
        // scoped so that the recalculation runs on the caller's own DbContext (the engine gets a scope of its own).
        services.AddScoped<IRetrospectiveTaxRefresher, RetrospectiveTaxRefresher>();
        services.AddSingleton<IRetrospectiveCalculationLock>(sp =>
            new SqlServerRetrospectiveCalculationLock(
                connectionString,
                logger: sp.GetService<ILogger<SqlServerRetrospectiveCalculationLock>>()));
        return services;
    }
}
