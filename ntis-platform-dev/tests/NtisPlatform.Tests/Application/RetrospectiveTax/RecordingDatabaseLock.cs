using NtisPlatform.Application.Interfaces.RetrospectiveTax;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// A database lock (<see cref="IRetrospectiveCalculationLock"/>) that writes what happens to an event log shared with the
/// test, can be held back like another process that holds the lock of the property, and can be made to fail.
/// </summary>
internal sealed class RecordingDatabaseLock : IRetrospectiveCalculationLock
{
    private readonly List<string> _events;

    public RecordingDatabaseLock(List<string> events) => _events = events;

    /// <summary>When set, the lock is not granted until this completes (another process holds it).</summary>
    public TaskCompletionSource<bool>? HeldElsewhere { get; init; }

    /// <summary>When set, asking for the lock throws this, as the SQL Server lock does when the holder does not let go in time.</summary>
    public Exception? FailToAcquireWith { get; init; }

    /// <summary>When set, releasing the lock throws this.</summary>
    public Exception? FailToReleaseWith { get; init; }

    /// <summary>How often the lock was asked for.</summary>
    public int Requests { get; private set; }

    public async Task<IAsyncDisposable> AcquireAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        Requests++;
        Record($"db lock requested {propertyId}");
        if (HeldElsewhere is not null)
        {
            await HeldElsewhere.Task.WaitAsync(cancellationToken);
        }

        if (FailToAcquireWith is not null)
        {
            throw FailToAcquireWith;
        }

        Record($"db lock granted {propertyId}");
        return new Releaser(this, propertyId);
    }

    public void Record(string text)
    {
        lock (_events)
        {
            _events.Add(text);
        }
    }

    private sealed class Releaser : IAsyncDisposable
    {
        private readonly RecordingDatabaseLock _owner;
        private readonly int _propertyId;

        public Releaser(RecordingDatabaseLock owner, int propertyId)
        {
            _owner = owner;
            _propertyId = propertyId;
        }

        public ValueTask DisposeAsync()
        {
            _owner.Record($"db lock released {_propertyId}");
            return _owner.FailToReleaseWith is null
                ? ValueTask.CompletedTask
                : ValueTask.FromException(_owner.FailToReleaseWith);
        }
    }
}
