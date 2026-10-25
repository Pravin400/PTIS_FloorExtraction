using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Services.RetrospectiveTax;
using Xunit;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// The retrospective lock of one property: the in-process gate first, then the database lock (mandatory: without it two
/// hosts could calculate one property at once); released in the reverse order. The gate is process-wide static state shared with every other test that calculates, so
/// each test uses property ids no other test uses.
/// </summary>
public class PropertyCalculationLockTests
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(5);

    [Fact]
    public async Task TheHolderExcludesAnotherAcquirerOfTheSameProperty_EvenWhenTheDatabaseLockIsGrantedToBoth()
    {
        // the in-process gate is what makes the second acquirer wait; the database lock is not what holds it back here
        const int propertyId = 9_100_001;
        var databaseLock = new AlwaysGrantedCalculationLock();
        var first = await PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None);

        var second = PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None);
        await Task.Delay(200);
        Assert.False(second.IsCompleted);

        await first.DisposeAsync();
        await using var secondHandle = await second.WaitAsync(Patience);
        Assert.True(secondHandle.IsHeld);
    }

    [Fact]
    public async Task WithoutADatabaseLock_ThereIsNoLock_AndNothingIsHeldInProcess()
    {
        // the database lock is the correctness boundary across processes: a critical section that could run without it
        // would let two hosts calculate one property at once
        const int propertyId = 9_100_005;

        var failure = await Assert.ThrowsAsync<ArgumentNullException>(
            () => PropertyCalculationLock.AcquireAsync(propertyId, null!, CancellationToken.None));

        Assert.Equal("databaseLock", failure.ParamName);
        Assert.False(PerPropertyGate.IsTracked(propertyId));
    }

    [Fact]
    public async Task DifferentProperties_NeverWaitForEachOther()
    {
        const int firstProperty = 9_100_011;
        const int secondProperty = firstProperty + 256; // ids that differ by a power of two: a lock keyed by a hash of the id could share one
        var databaseLock = new AlwaysGrantedCalculationLock();
        await using var first = await PropertyCalculationLock.AcquireAsync(firstProperty, databaseLock, CancellationToken.None);

        await using var second = await PropertyCalculationLock.AcquireAsync(secondProperty, databaseLock, CancellationToken.None).WaitAsync(Patience);
    }

    [Fact]
    public async Task TheHandleKnowsItsPropertyAndIsHeldUntilDisposed_AndDisposingTwiceReleasesOnce()
    {
        const int propertyId = 9_100_021;
        var events = new List<string>();
        var handle = await PropertyCalculationLock.AcquireAsync(propertyId, new RecordingDatabaseLock(events), CancellationToken.None);

        Assert.Equal(propertyId, handle.PropertyId);
        Assert.True(handle.IsHeld);

        await handle.DisposeAsync();
        await handle.DisposeAsync();

        Assert.False(handle.IsHeld);
        Assert.Equal(1, events.Count(e => e.StartsWith("db lock released")));
        Assert.False(PerPropertyGate.IsTracked(propertyId));
    }

    [Fact]
    public async Task TheGateIsTakenBeforeTheDatabaseLock_AndTheDatabaseLockIsReleasedBeforeTheGate()
    {
        // A second acquirer in this process queues on the gate in memory; it only asks the database for the lock once the
        // gate is its own, i.e. after the first holder let go of both, the database lock first.
        const int propertyId = 9_100_031;
        var events = new List<string>();
        var databaseLock = new RecordingDatabaseLock(events);
        var first = await PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None);

        var second = PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None);
        await Task.Delay(200);

        Assert.Equal(1, databaseLock.Requests); // the waiter does not hold a database connection while it waits
        Assert.False(second.IsCompleted);

        await first.DisposeAsync();
        await using var secondHandle = await second.WaitAsync(Patience);

        Assert.Equal(
            new[]
            {
                $"db lock requested {propertyId}", $"db lock granted {propertyId}",
                $"db lock released {propertyId}",
                $"db lock requested {propertyId}", $"db lock granted {propertyId}",
            },
            events);
    }

    [Fact]
    public async Task WhenTheDatabaseLockIsNotGrantedInTime_TheGateIsReleased_AndTheFailureReachesTheCaller()
    {
        const int propertyId = 9_100_041;
        var failure = new RetrospectiveCalculationInProgressException(propertyId, "another calculation holds it");
        var databaseLock = new RecordingDatabaseLock(new List<string>()) { FailToAcquireWith = failure };

        var thrown = await Assert.ThrowsAsync<RetrospectiveCalculationInProgressException>(
            () => PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None));

        Assert.Same(failure, thrown);
        Assert.False(PerPropertyGate.IsTracked(propertyId)); // nothing stays held: the next acquirer is not blocked
        await using var next = await PropertyCalculationLock.AcquireAsync(propertyId, new AlwaysGrantedCalculationLock(), CancellationToken.None).WaitAsync(Patience);
    }

    [Fact]
    public async Task WhenTheDatabaseLockIsHeldElsewhere_TheAcquirerWaits_AndIsCancellable()
    {
        const int propertyId = 9_100_051;
        var heldElsewhere = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var databaseLock = new RecordingDatabaseLock(new List<string>()) { HeldElsewhere = heldElsewhere };
        using var cancellation = new CancellationTokenSource();

        var waiting = PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, cancellation.Token);
        await Task.Delay(200);
        Assert.False(waiting.IsCompleted);

        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => waiting);
        Assert.False(PerPropertyGate.IsTracked(propertyId)); // a cancelled waiter leaves nothing behind
    }

    [Fact]
    public async Task ACancelledWaiterOfTheGate_NeverAsksTheDatabaseForTheLock()
    {
        const int propertyId = 9_100_061;
        var events = new List<string>();
        var databaseLock = new RecordingDatabaseLock(events);
        await using var holder = await PropertyCalculationLock.AcquireAsync(propertyId, new AlwaysGrantedCalculationLock(), CancellationToken.None);

        using var cancellation = new CancellationTokenSource();
        var waiting = PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, cancellation.Token);
        await Task.Delay(100);
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => waiting);

        Assert.Equal(0, databaseLock.Requests);
        Assert.True(PerPropertyGate.IsTracked(propertyId)); // the holder is still there
    }

    [Fact]
    public async Task WhenReleasingTheDatabaseLockFails_TheGateIsStillReleased()
    {
        const int propertyId = 9_100_071;
        var databaseLock = new RecordingDatabaseLock(new List<string>()) { FailToReleaseWith = new InvalidOperationException("release failed") };
        var handle = await PropertyCalculationLock.AcquireAsync(propertyId, databaseLock, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(async () => await handle.DisposeAsync());

        Assert.False(handle.IsHeld);
        Assert.False(PerPropertyGate.IsTracked(propertyId)); // a failed release must not leave the property locked in this process
    }
}
