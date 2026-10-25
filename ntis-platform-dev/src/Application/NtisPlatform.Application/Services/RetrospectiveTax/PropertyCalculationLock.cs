using NtisPlatform.Application.Interfaces.RetrospectiveTax;

namespace NtisPlatform.Application.Services.RetrospectiveTax;

/// <summary>
/// The retrospective lock of one property: the in-process <see cref="PerPropertyGate"/> and the database lock
/// (<see cref="IRetrospectiveCalculationLock"/>, which holds across processes). Both are taken before anything of the
/// critical section is read, so whoever comes second starts from what the first one saved:
/// <list type="bullet">
///   <item>the gate is taken first, so the waiters of one process queue in memory instead of each holding a database
///   connection while they wait for the database lock;</item>
///   <item>the database lock is the correctness boundary across processes (every API instance, the Worker).</item>
/// </list>
/// They are released in the reverse order, however the critical section ends.
/// </summary>
internal sealed class PropertyCalculationLock : IRetrospectivePropertyLock
{
    private IDisposable? _gate;
    private IAsyncDisposable? _databaseLock;

    private PropertyCalculationLock(int propertyId, IDisposable gate, IAsyncDisposable databaseLock)
    {
        PropertyId = propertyId;
        _gate = gate;
        _databaseLock = databaseLock;
    }

    public int PropertyId { get; }

    public bool IsHeld => Volatile.Read(ref _gate) is not null;

    /// <summary>
    /// Waits until no other calculation holds <paramref name="propertyId"/> (in this process, then in any other process)
    /// and holds it until the returned handle is disposed. The lock of one property never blocks another property. Fails with
    /// the database lock's own timeout exception when another process does not let go in time; nothing stays held then.
    /// </summary>
    public static async Task<PropertyCalculationLock> AcquireAsync(
        int propertyId, IRetrospectiveCalculationLock databaseLock, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(databaseLock);

        var gate = await PerPropertyGate.EnterAsync(propertyId, cancellationToken);
        try
        {
            var held = await databaseLock.AcquireAsync(propertyId, cancellationToken);
            return new PropertyCalculationLock(propertyId, gate, held);
        }
        catch
        {
            gate.Dispose();
            throw;
        }
    }

    public async ValueTask DisposeAsync()
    {
        var gate = Interlocked.Exchange(ref _gate, null);
        if (gate is null)
        {
            return;
        }

        var databaseLock = Interlocked.Exchange(ref _databaseLock, null);
        try
        {
            if (databaseLock is not null)
            {
                await databaseLock.DisposeAsync();
            }
        }
        finally
        {
            gate.Dispose();
        }
    }
}
