using NtisPlatform.Application.Services.RetrospectiveTax;
using Xunit;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// The gate that lets one retrospective calculation per property run at a time. The gate is process-wide static
/// state shared with every other test that calculates, so each test uses property ids no other test uses.
/// </summary>
public class PerPropertyGateTests
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(5);

    [Fact]
    public async Task SameProperty_TheSecondEntryWaitsUntilTheFirstIsDisposed()
    {
        const int propertyId = 9_000_001;
        var first = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);

        var second = PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        await Task.Delay(200);
        Assert.False(second.IsCompleted);

        first.Dispose();
        using var secondHandle = await second.WaitAsync(Patience);
    }

    [Theory]
    [InlineData(9_000_011, 9_000_012)]
    [InlineData(9_000_021, 9_000_021 + 256)] // ids that differ by a power of two: a lock keyed by a hash of the id could share one
    [InlineData(9_000_031, 9_000_031 + 65_536)]
    public async Task DifferentProperties_NeverWaitForEachOther(int firstProperty, int secondProperty)
    {
        using var first = await PerPropertyGate.EnterAsync(firstProperty, CancellationToken.None);

        using var second = await PerPropertyGate.EnterAsync(secondProperty, CancellationToken.None).WaitAsync(Patience);
    }

    [Fact]
    public async Task TheEntryIsRemovedOnceTheLastHolderLeaves()
    {
        const int propertyId = 9_000_041;
        Assert.False(PerPropertyGate.IsTracked(propertyId));

        var handle = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        Assert.True(PerPropertyGate.IsTracked(propertyId));

        handle.Dispose();
        Assert.False(PerPropertyGate.IsTracked(propertyId));
    }

    [Fact]
    public async Task TheEntryStaysWhileSomeoneIsWaiting_AndGoesWhenTheLastOneLeaves()
    {
        const int propertyId = 9_000_051;
        var first = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        var waiting = PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);

        first.Dispose();
        var second = await waiting.WaitAsync(Patience);
        Assert.True(PerPropertyGate.IsTracked(propertyId)); // the waiter now holds it

        second.Dispose();
        Assert.False(PerPropertyGate.IsTracked(propertyId));
    }

    [Fact]
    public async Task ACancelledWaiterLeavesNothingBehind()
    {
        const int propertyId = 9_000_061;
        var holder = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);

        using var cancellation = new CancellationTokenSource();
        var waiting = PerPropertyGate.EnterAsync(propertyId, cancellation.Token);
        await Task.Delay(100);
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => waiting);

        Assert.True(PerPropertyGate.IsTracked(propertyId)); // the holder is still there

        holder.Dispose();
        Assert.False(PerPropertyGate.IsTracked(propertyId));

        // and the property can be entered again straight away
        using var again = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None).WaitAsync(Patience);
    }

    [Fact]
    public async Task DisposingTwiceReleasesOnlyOnce()
    {
        const int propertyId = 9_000_071;
        var first = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        first.Dispose();
        first.Dispose(); // must neither throw nor hand out a second permit

        using var second = await PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        var third = PerPropertyGate.EnterAsync(propertyId, CancellationToken.None);
        await Task.Delay(200);
        Assert.False(third.IsCompleted); // still exclusive

        second.Dispose();
        using var thirdHandle = await third.WaitAsync(Patience);
    }
}
