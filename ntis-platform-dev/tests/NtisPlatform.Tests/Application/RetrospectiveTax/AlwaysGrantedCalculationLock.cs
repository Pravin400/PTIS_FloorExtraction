using NtisPlatform.Application.Interfaces.RetrospectiveTax;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// A database lock that is always granted at once, for the tests of the engine that are not about the lock. The engine
/// requires a lock (it never runs without one); a test that does not exercise the lock hands it this instead of a null.
/// </summary>
internal sealed class AlwaysGrantedCalculationLock : IRetrospectiveCalculationLock
{
    public Task<IAsyncDisposable> AcquireAsync(int propertyId, CancellationToken cancellationToken = default) =>
        Task.FromResult<IAsyncDisposable>(new Handle());

    private sealed class Handle : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}