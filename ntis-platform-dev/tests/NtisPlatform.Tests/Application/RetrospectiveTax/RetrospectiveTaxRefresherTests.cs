using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Infrastructure.Services;
using NtisPlatform.Tests.Application.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// The refresher recalculates a property's RV and runs the retrospective engine after it as one critical section per
/// property: the property's lock is taken before the recalculation and kept until the engine is done, the engine is
/// handed that lock instead of taking it again, it runs in a scope of its own, and a failure of the engine is never
/// swallowed (the recalculation is saved, the ledger is known to need repair). The in-process gate is shared static state,
/// so each test uses property ids no other test uses.
/// </summary>
public class RetrospectiveTaxRefresherTests
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(10);

    private readonly Mock<IRateableValueService> _rv = new();
    private readonly Mock<IRetrospectiveTaxCalculationEngineService> _engine = new();
    private readonly List<string> _events = new();

    /// <summary>The scopes the RV service and the engine were resolved in, one entry per resolution.</summary>
    private readonly List<ScopeMarker> _rvScopeMarkers = new();
    private readonly List<ScopeMarker> _engineScopeMarkers = new();

    /// <summary>
    /// A container wired like the hosts': the refresher, the RV service and the engine are scoped, so the caller gets the
    /// refresher (and through it the RV service) from its own scope while every engine run gets a scope of its own; each
    /// is stamped with the scope it was created in (<see cref="ScopeMarker"/>). The database lock is mandatory, as in every
    /// host: a test that is not about it gets one that is always granted.
    /// </summary>
    private sealed class Host : IDisposable
    {
        private readonly ServiceProvider _root;
        private readonly IServiceScope _callersScope;

        public Host(ServiceProvider root)
        {
            _root = root;
            _callersScope = root.CreateScope();
            CallersMarker = _callersScope.ServiceProvider.GetRequiredService<ScopeMarker>();
            Refresher = _callersScope.ServiceProvider.GetRequiredService<IRetrospectiveTaxRefresher>();
        }

        public ScopeMarker CallersMarker { get; }

        public IRetrospectiveTaxRefresher Refresher { get; }

        public void Dispose()
        {
            _callersScope.Dispose();
            _root.Dispose();
        }
    }

    private Host BuildHost(
        IRetrospectiveCalculationLock? databaseLock = null, bool engineRegistered = true, ILogger<RetrospectiveTaxRefresher>? logger = null)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        if (logger is not null)
        {
            services.AddSingleton(logger);
        }

        services.AddScoped<ScopeMarker>();
        services.AddScoped<IRetrospectiveTaxRefresher, RetrospectiveTaxRefresher>();
        services.AddScoped(sp =>
        {
            _rvScopeMarkers.Add(sp.GetRequiredService<ScopeMarker>());
            return _rv.Object;
        });
        services.AddSingleton(databaseLock ?? new AlwaysGrantedCalculationLock());

        if (engineRegistered)
        {
            services.AddScoped(sp =>
            {
                _engineScopeMarkers.Add(sp.GetRequiredService<ScopeMarker>());
                return _engine.Object;
            });
        }

        return new Host(services.BuildServiceProvider());
    }

    private void Record(string text)
    {
        lock (_events)
        {
            _events.Add(text);
        }
    }

    /// <summary>The RV recalculation records "rv:{id}" and returns a result for the property.</summary>
    private void ArrangeRv(Func<int, Task<RateableValueResponseDto>>? behaviour = null)
        => _rv.Setup(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()))
            .Returns((int id, bool _) =>
            {
                Record($"rv:{id}");
                return behaviour is null ? Task.FromResult(new RateableValueResponseDto { PropertyId = id }) : behaviour(id);
            });

    /// <summary>The engine (the overload for a caller that holds the lock) records "engine:{id}" and does <paramref name="behaviour"/>.</summary>
    private void ArrangeEngine(Func<int, IRetrospectivePropertyLock, Task<RetrospectiveTaxEngineResultDto?>>? behaviour = null)
        => _engine.Setup(e => e.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<IRetrospectivePropertyLock>(), It.IsAny<CancellationToken>()))
            .Returns((int id, int? _, IRetrospectivePropertyLock heldLock, CancellationToken _) =>
            {
                Record($"engine:{id}");
                return behaviour is null ? Task.FromResult<RetrospectiveTaxEngineResultDto?>(null) : behaviour(id, heldLock);
            });

    [Fact]
    public async Task RefreshAsync_TakesTheLock_RecalculatesRv_RunsTheEngine_AndReleasesTheLock_InThatOrder()
    {
        const int propertyId = 9_200_001;
        ArrangeRv();
        ArrangeEngine();
        using var host = BuildHost(new RecordingDatabaseLock(_events));

        await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        _events.Should().Equal(
            $"db lock requested {propertyId}", $"db lock granted {propertyId}",
            $"rv:{propertyId}", $"engine:{propertyId}",
            $"db lock released {propertyId}");
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_HandsTheEngineTheLockItHolds_SoTheEngineNeverAsksForItAgain()
    {
        const int propertyId = 9_200_011;
        ArrangeRv();
        var databaseLock = new RecordingDatabaseLock(_events);
        var seen = new List<(int PropertyId, bool Held)>();
        ArrangeEngine((id, heldLock) =>
        {
            seen.Add((heldLock.PropertyId, heldLock.IsHeld));
            return Task.FromResult<RetrospectiveTaxEngineResultDto?>(null);
        });
        using var host = BuildHost(databaseLock);

        await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        // the engine is called with the lock the refresher holds (taking it again would wait for itself), and the plain
        // overload that takes the lock itself is never used
        seen.Should().Equal((propertyId, true));
        databaseLock.Requests.Should().Be(1);
        _engine.Verify(e => e.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RefreshAsync_PassesTheUserTheForceFlagAndTheTokenOn(bool forceRecalculate)
    {
        var propertyId = 9_200_021 + (forceRecalculate ? 1 : 0);
        ArrangeRv();
        ArrangeEngine();
        using var host = BuildHost();
        using var cts = new CancellationTokenSource();

        await host.Refresher.RefreshAsync(propertyId, 15, new RetrospectiveTaxRefreshOptions { ForceRecalculate = forceRecalculate }, cts.Token).WaitAsync(Patience);

        _rv.Verify(s => s.CalculateAndSaveAsync(propertyId, forceRecalculate), Times.Once);
        _engine.Verify(e => e.CalculateAndSaveAsync(propertyId, 15, It.IsAny<IRetrospectivePropertyLock>(), cts.Token), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_ReturnsWhatTheRvRecalculationAndTheEngineReturned()
    {
        const int propertyId = 9_200_031;
        var rvResult = new RateableValueResponseDto { PropertyId = propertyId, TotalRateableValue = 12345m };
        var engineResult = new RetrospectiveTaxEngineResultDto();
        ArrangeRv(_ => Task.FromResult(rvResult));
        ArrangeEngine((_, _) => Task.FromResult<RetrospectiveTaxEngineResultDto?>(engineResult));
        using var host = BuildHost();

        var result = await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience).WaitAsync(Patience);

        result.RateableValue.Should().BeSameAs(rvResult);
        result.Retrospective.Should().BeSameAs(engineResult);
    }

    [Fact]
    public async Task RefreshAsync_WhenNoRuleMatches_ReturnsTheRvResultAndNoRetrospectiveResult()
    {
        const int propertyId = 9_200_036;
        var rvResult = new RateableValueResponseDto { PropertyId = propertyId };
        ArrangeRv(_ => Task.FromResult(rvResult));
        ArrangeEngine(); // returns null: no rule matched, nothing is charged retrospectively
        using var host = BuildHost();

        var result = await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        result.RateableValue.Should().BeSameAs(rvResult);
        result.Retrospective.Should().BeNull();
    }

    [Fact]
    public async Task RefreshAsync_AnEngineFailure_FailsTheRefresh_AfterTheRvRecalculation_AndReleasesTheLock()
    {
        // The recalculation is saved and has replaced the certificate's current-year TransMast row with NETTAX; only the
        // engine puts it back. Reporting success then would leave a ledger that is known to be wrong.
        const int propertyId = 9_200_051;
        ArrangeRv();
        ArrangeEngine((_, _) => throw new InvalidOperationException("no rule"));
        using var host = BuildHost(new RecordingDatabaseLock(_events));

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        var failure = (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which;
        failure.PropertyId.Should().Be(propertyId);
        failure.ErrorCode.Should().Be(RetrospectiveRefreshFailedException.Code);
        failure.InnerException.Should().BeOfType<InvalidOperationException>().Which.Message.Should().Be("no rule");
        _events.Should().Equal(
            $"db lock requested {propertyId}", $"db lock granted {propertyId}",
            $"rv:{propertyId}", $"engine:{propertyId}",
            $"db lock released {propertyId}"); // nothing stays locked because the engine failed
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_TheMessageOfAnEngineFailureThatIsNotOurOwn_NeverReachesTheCaller()
    {
        // SQL Server, EF and lock internals can sit in an exception message; the message of the refresh failure goes to the
        // screen and to the job's audit trail, so it carries only a reference to the log entry that has the exception
        const int propertyId = 9_200_052;
        const string internals = "Login failed for user 'ntis_app'. Server=AMC-SERVER02;Database=PTIS_WING";
        ArrangeRv();
        ArrangeEngine((_, _) => throw new InvalidOperationException(internals));
        using var host = BuildHost();

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        var failure = (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which;
        failure.Message.Should().NotContain("ntis_app").And.NotContain("AMC-SERVER02").And.NotContain("PTIS_WING");
        failure.Message.Should().Contain($"property {propertyId}").And.Contain("Calculate the property again");
        failure.Message.Should().Contain($"(Reference: {failure.ErrorId})");
        failure.ErrorId.Should().MatchRegex("^[0-9a-f]{8}$");
        failure.InnerException!.Message.Should().Be(internals); // kept for the log, not for the screen
    }

    [Fact]
    public async Task RefreshAsync_TheMessageOfAnEngineFailureThatIsOurOwn_IsShownToTheCaller()
    {
        // the platform's own business and validation exceptions are written for people ("add the missing year to the year
        // master"): the caller learns what to do
        const int propertyId = 9_200_053;
        ArrangeRv();
        var ownFailure = new RetrospectiveYearMasterMissingException(propertyId, new[] { 2024 });
        ArrangeEngine((_, _) => throw ownFailure);
        using var host = BuildHost();

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        var failure = (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which;
        failure.Message.Should().Contain(ownFailure.Message);
        failure.InnerException.Should().BeSameAs(ownFailure);
    }

    [Fact]
    public async Task RefreshAsync_AnEngineFailure_IsLoggedOnceWithTheFullExceptionAndTheSameReferenceThatTheCallerGets()
    {
        const int propertyId = 9_200_054;
        var logger = new Mock<ILogger<RetrospectiveTaxRefresher>>();
        logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(true);
        var cause = new InvalidOperationException("no rule");
        ArrangeRv();
        ArrangeEngine((_, _) => throw cause);
        using var host = BuildHost(logger: logger.Object);

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        var failure = (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which;
        logger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains(failure.ErrorId) && state.ToString()!.Contains(propertyId.ToString())),
                cause,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_WhenTheHostHasNoEngine_Fails_NotSucceedsWithoutIt()
    {
        // a host that cannot run the engine must not report a recalculation as done: the hosts register the engine with the
        // refresher (AddRetrospectiveTaxEngine), so this is a configuration bug, and it fails loudly
        const int propertyId = 9_200_071;
        ArrangeRv();
        using var host = BuildHost(engineRegistered: false);

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        var failure = (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which;
        failure.InnerException.Should().BeOfType<InvalidOperationException>().Which.Message.Should().Contain("IRetrospectiveTaxCalculationEngineService");
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_WhenTheRvRecalculationFails_Propagates_RunsNoEngine_AndReleasesTheLock()
    {
        const int propertyId = 9_200_091;
        ArrangeRv(_ => throw new InvalidOperationException("no property details"));
        ArrangeEngine();
        using var host = BuildHost(new RecordingDatabaseLock(_events));

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        // nothing of the property was replaced, so there is nothing for the engine to put back; the failure is the caller's
        (await act.Should().ThrowAsync<InvalidOperationException>()).WithMessage("no property details");
        _engine.Verify(e => e.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<IRetrospectivePropertyLock>(), It.IsAny<CancellationToken>()), Times.Never);
        _events.Last().Should().Be($"db lock released {propertyId}");
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_WhenCancelled_TheCancellationPropagates_NotWrappedAsAFailedRefresh()
    {
        // a cancelled request or a stopping worker must stop, not be reported as "the engine failed" and carry on
        const int propertyId = 9_200_101;
        ArrangeRv();
        ArrangeEngine((_, _) => throw new OperationCanceledException());
        using var host = BuildHost();

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        await act.Should().ThrowAsync<OperationCanceledException>();
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_RecalculatesRvInTheCallersScope_AndRunsTheEngineInAScopeOfItsOwn()
    {
        // the caller's scope carries the caller's DbContext, with whatever it still tracks: RV stays on it, as before, but
        // the engine must not use it (a run that fails half-way would leave tracked changes for the caller's next save)
        const int propertyId = 9_200_111;
        ArrangeRv();
        ArrangeEngine();
        using var host = BuildHost();

        await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        _rvScopeMarkers.Should().ContainSingle().Which.Should().BeSameAs(host.CallersMarker);
        _engineScopeMarkers.Should().ContainSingle();
        _engineScopeMarkers[0].Should().NotBeSameAs(host.CallersMarker);
    }

    [Fact]
    public async Task RefreshAsync_EveryRunGetsAScopeOfItsOwn_AndDisposesIt_AlsoWhenTheEngineFails()
    {
        // a bulk job refreshes thousands of properties one after the other: a run must not see what the previous one tracked
        const int propertyId = 9_200_121;
        ArrangeRv();
        ArrangeEngine((id, _) => id == propertyId + 1 ? throw new InvalidOperationException("no rule") : Task.FromResult<RetrospectiveTaxEngineResultDto?>(null));
        using var host = BuildHost();

        await host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);
        var failing = () => host.Refresher.RefreshAsync(propertyId + 1, 7).WaitAsync(Patience);
        await failing.Should().ThrowAsync<RetrospectiveRefreshFailedException>();

        _engineScopeMarkers.Should().HaveCount(2);
        _engineScopeMarkers[0].Should().NotBeSameAs(_engineScopeMarkers[1]);
        _engineScopeMarkers.Should().OnlyContain(m => m.Disposed);
        host.CallersMarker.Disposed.Should().BeFalse();
    }

    /// <summary>A table the probe tests write to; one row per "tracked change".</summary>
    private sealed class ProbeRow
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
    }

    private sealed class ProbeContext : DbContext
    {
        public ProbeContext(DbContextOptions<ProbeContext> options) : base(options)
        {
        }

        public DbSet<ProbeRow> Rows => Set<ProbeRow>();
    }

    [Fact]
    public async Task RefreshAsync_AnEngineThatTracksChangesAndThenFails_LeavesNothingForTheCallersNextSave()
    {
        // The case the review asked to see with a real DbContext: the caller's DbContext still tracks a change that waits
        // for its next SaveChanges (a capital value, a job row, a step of a combine); the engine tracks changes on ITS
        // context and then fails half-way. The caller's next save must persist its own change and nothing of the engine's.
        const int propertyId = 9_200_191;
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ProbeContext>(options => options.UseSqlite(connection));
        services.AddSingleton<IRetrospectiveCalculationLock>(new AlwaysGrantedCalculationLock());
        services.AddScoped<IRetrospectiveTaxRefresher, RetrospectiveTaxRefresher>();
        services.AddScoped(sp =>
        {
            // the RV recalculation runs in the caller's scope and leaves a change of the caller's own waiting to be saved
            var rv = new Mock<IRateableValueService>();
            rv.Setup(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()))
                .Returns(() =>
                {
                    sp.GetRequiredService<ProbeContext>().Rows.Add(new ProbeRow { Name = "the caller's own pending change" });
                    return Task.FromResult(new RateableValueResponseDto { PropertyId = propertyId });
                });
            return rv.Object;
        });
        services.AddScoped(sp =>
        {
            // the engine tracks a row on the context of ITS scope, then fails
            var engine = new Mock<IRetrospectiveTaxCalculationEngineService>();
            engine.Setup(e => e.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<IRetrospectivePropertyLock>(), It.IsAny<CancellationToken>()))
                .Returns(async () =>
                {
                    sp.GetRequiredService<ProbeContext>().Rows.Add(new ProbeRow { Name = "half-written by the failed engine" });
                    await Task.Yield();
                    throw new InvalidOperationException("the engine failed after it had tracked changes");
                });
            return engine.Object;
        });

        using var provider = services.BuildServiceProvider();
        using (var setup = provider.CreateScope())
        {
            setup.ServiceProvider.GetRequiredService<ProbeContext>().Database.EnsureCreated();
        }

        using var callersScope = provider.CreateScope();
        var refresher = callersScope.ServiceProvider.GetRequiredService<IRetrospectiveTaxRefresher>();

        await Assert.ThrowsAsync<RetrospectiveRefreshFailedException>(() => refresher.RefreshAsync(propertyId, 7));
        await callersScope.ServiceProvider.GetRequiredService<ProbeContext>().SaveChangesAsync(); // the caller's next save

        using var verification = provider.CreateScope();
        var saved = verification.ServiceProvider.GetRequiredService<ProbeContext>().Rows.Select(r => r.Name).ToList();
        saved.Should().Equal("the caller's own pending change");
    }

    [Fact]
    public async Task RefreshAsync_TwoRefreshesOfTheSameProperty_RunStrictlyOneAfterTheOther()
    {
        // The recalculation of the second must not slip in between the recalculation and the engine run of the first: both
        // write the same rows. Without a lock covering both steps the log would read rv, rv, engine, engine.
        const int propertyId = 9_200_131;
        ArrangeRv();
        var insideFirstEngine = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirstEngine = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var engineRuns = 0;
        ArrangeEngine(async (_, _) =>
        {
            if (Interlocked.Increment(ref engineRuns) == 1)
            {
                insideFirstEngine.SetResult();
                await releaseFirstEngine.Task;
            }

            return null;
        });
        using var host = BuildHost();

        var first = host.Refresher.RefreshAsync(propertyId, 7);
        await insideFirstEngine.Task.WaitAsync(Patience);

        var second = host.Refresher.RefreshAsync(propertyId, 7);
        await Task.Delay(300);

        second.IsCompleted.Should().BeFalse();
        _events.Should().Equal($"rv:{propertyId}", $"engine:{propertyId}"); // the second has recalculated nothing yet

        releaseFirstEngine.SetResult();
        await Task.WhenAll(first, second).WaitAsync(Patience);

        _events.Should().Equal($"rv:{propertyId}", $"engine:{propertyId}", $"rv:{propertyId}", $"engine:{propertyId}");
    }

    [Fact]
    public async Task RefreshAsync_RefreshesOfDifferentProperties_DoNotWaitForEachOther()
    {
        const int busyProperty = 9_200_141;
        const int otherProperty = busyProperty + 256; // a lock keyed by a hash of the id could map these two together
        ArrangeRv();
        var insideFirstEngine = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirstEngine = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        ArrangeEngine(async (id, _) =>
        {
            if (id == busyProperty)
            {
                insideFirstEngine.SetResult();
                await releaseFirstEngine.Task;
            }

            return null;
        });
        using var host = BuildHost(new RecordingDatabaseLock(_events));

        var first = host.Refresher.RefreshAsync(busyProperty, 7);
        await insideFirstEngine.Task.WaitAsync(Patience);

        var other = host.Refresher.RefreshAsync(otherProperty, 7);
        var finishedWhileTheFirstIsHeld = await Task.WhenAny(other, Task.Delay(TimeSpan.FromSeconds(5))) == other;

        finishedWhileTheFirstIsHeld.Should().BeTrue($"a refresh of property {otherProperty} must not wait for the one that holds property {busyProperty}");

        releaseFirstEngine.SetResult();
        await first.WaitAsync(Patience);
    }

    [Fact]
    public async Task RefreshAsync_WhenAnotherProcessHoldsTheDatabaseLock_NothingIsRecalculatedUntilItLetsGo()
    {
        const int propertyId = 9_200_151;
        ArrangeRv();
        ArrangeEngine();
        var heldElsewhere = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var host = BuildHost(new RecordingDatabaseLock(_events) { HeldElsewhere = heldElsewhere });

        var refresh = host.Refresher.RefreshAsync(propertyId, 7);
        await Task.Delay(300);

        refresh.IsCompleted.Should().BeFalse();
        _rv.Verify(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never); // not even the recalculation

        heldElsewhere.SetResult(true);
        await refresh.WaitAsync(Patience);

        _events.Should().Contain($"rv:{propertyId}").And.Contain($"engine:{propertyId}");
    }

    [Fact]
    public async Task RefreshAsync_WhenTheDatabaseLockIsNotGrantedInTime_StartsNothing_AndLeavesNothingHeld()
    {
        const int propertyId = 9_200_161;
        ArrangeRv();
        ArrangeEngine();
        var failure = new RetrospectiveCalculationInProgressException(propertyId, "another calculation holds it");
        using var host = BuildHost(new RecordingDatabaseLock(_events) { FailToAcquireWith = failure });

        var act = () => host.Refresher.RefreshAsync(propertyId, 7).WaitAsync(Patience);

        // not an engine failure: nothing was started (no recalculation, so nothing to repair), the caller must try again
        (await act.Should().ThrowAsync<RetrospectiveCalculationInProgressException>()).Which.Should().BeSameAs(failure);
        _rv.Verify(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_WhenTheEngineScopeCannotBeCreated_Fails_AndReleasesTheLock()
    {
        // e.g. the host is shutting down
        const int propertyId = 9_200_171;
        ArrangeRv();
        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Throws(new ObjectDisposedException("ServiceProvider"));
        var refresher = new RetrospectiveTaxRefresher(_rv.Object, factory.Object, new AlwaysGrantedCalculationLock(), NullLogger<RetrospectiveTaxRefresher>.Instance);

        var act = () => refresher.RefreshAsync(propertyId, 7);

        (await act.Should().ThrowAsync<RetrospectiveRefreshFailedException>()).Which.InnerException.Should().BeOfType<ObjectDisposedException>();
        PerPropertyGate.IsTracked(propertyId).Should().BeFalse();
    }

    [Fact]
    public void Constructor_WithoutTheDatabaseLock_Throws_TheRefresherNeverRunsWithoutIt()
    {
        var act = () => new RetrospectiveTaxRefresher(
            _rv.Object, Mock.Of<IServiceScopeFactory>(), calculationLock: null!, NullLogger<RetrospectiveTaxRefresher>.Instance);

        act.Should().Throw<ArgumentNullException>().WithParameterName("calculationLock");
    }

    [SqlServerFact]
    public async Task RefreshAsync_WithTheRealDatabaseLock_WaitsWhileAnotherProcessHoldsIt_ThenRecalculatesAndRunsTheEngine()
    {
        // Two SqlServerRetrospectiveCalculationLock instances open connections of their own, so one stands in for another
        // API instance (or the Worker) that is calculating the same property.
        var propertyId = 1_000_000_000 + Random.Shared.Next(0, 900_000_000);
        ArrangeRv();
        ArrangeEngine();
        var anotherProcess = new SqlServerRetrospectiveCalculationLock(SqlServerFactAttribute.ConnectionString!);
        var thisProcess = new SqlServerRetrospectiveCalculationLock(SqlServerFactAttribute.ConnectionString!);
        await using var heldByTheOtherProcess = await anotherProcess.AcquireAsync(propertyId);
        using var host = BuildHost(thisProcess);

        var refresh = host.Refresher.RefreshAsync(propertyId, 7);
        await Task.Delay(700);

        refresh.IsCompleted.Should().BeFalse();
        _events.Should().BeEmpty(); // not even the RV recalculation has started

        await heldByTheOtherProcess.DisposeAsync();
        await refresh.WaitAsync(TimeSpan.FromSeconds(30));

        _events.Should().Equal($"rv:{propertyId}", $"engine:{propertyId}");

        // and the lock is free again afterwards
        await using var again = await anotherProcess.AcquireAsync(propertyId).WaitAsync(TimeSpan.FromSeconds(15));
    }

    /// <summary>A scoped service that records whether its scope was disposed.</summary>
    private sealed class ScopeMarker : IDisposable
    {
        public bool Disposed { get; private set; }

        public void Dispose() => Disposed = true;
    }
}
