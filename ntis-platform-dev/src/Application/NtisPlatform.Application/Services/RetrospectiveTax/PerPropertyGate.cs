namespace NtisPlatform.Application.Services.RetrospectiveTax;

/// <summary>
/// Lets one retrospective calculation per property run at a time (inside this process); runs for different
/// properties never wait for each other.
/// <para>
/// A run reads the property's existing TransMast / PolicyTaxDetails rows into its own DbContext, upserts the
/// rows it wants and deactivates every row it did not write. Two runs for the same property that overlap (the
/// direct calculate endpoints, the queued certificate pipeline and a society / wing job can all start one) each
/// work on their own snapshot: neither sees the rows the other is about to write, so neither deactivates them
/// and -- the unique index includes PolicyCodeId -- a CC row and an OC row of the same year both stay active
/// (double demand). Running them one after the other makes the second run read what the first one wrote. The RV
/// recalculation that precedes a run writes the same rows, so it takes part in the same exclusion (see
/// <see cref="Interfaces.RetrospectiveTax.IRetrospectiveTaxRefresher"/>).
/// </para>
/// <para>
/// Every property id gets its own lock entry. An entry counts its users (the holder and everyone waiting) and is
/// removed when the last one is done, so the table only holds the properties being calculated right now.
/// This does not span processes: <see cref="Interfaces.RetrospectiveTax.IRetrospectiveCalculationLock"/> (a database
/// application lock) does, and <see cref="PropertyCalculationLock"/> takes it right after this gate, so the waiters of
/// one process queue here in memory instead of each holding a database connection.
/// </para>
/// </summary>
internal static class PerPropertyGate
{
    private static readonly object _sync = new();
    private static readonly Dictionary<int, Entry> _entries = new();

    /// <summary>Whether the property currently has a holder or a waiter, i.e. has a lock entry (for tests).</summary>
    internal static bool IsTracked(int propertyId)
    {
        lock (_sync)
        {
            return _entries.ContainsKey(propertyId);
        }
    }

    /// <summary>Waits until no other run holds this property, then holds it until the returned handle is disposed.</summary>
    public static async Task<IDisposable> EnterAsync(int propertyId, CancellationToken cancellationToken)
    {
        Entry entry;
        lock (_sync)
        {
            if (!_entries.TryGetValue(propertyId, out entry!))
            {
                entry = new Entry();
                _entries[propertyId] = entry;
            }

            entry.Users++; // counted from the moment it starts waiting
        }

        try
        {
            await entry.Semaphore.WaitAsync(cancellationToken);
        }
        catch
        {
            Leave(propertyId, entry, holdsLock: false);
            throw;
        }

        return new Releaser(propertyId, entry);
    }

    private static void Leave(int propertyId, Entry entry, bool holdsLock)
    {
        if (holdsLock)
        {
            entry.Semaphore.Release();
        }

        lock (_sync)
        {
            if (--entry.Users == 0)
            {
                _entries.Remove(propertyId);
            }
        }
    }

    private sealed class Entry
    {
        public readonly SemaphoreSlim Semaphore = new(1, 1);

        /// <summary>The holder plus the waiters; guarded by <c>_sync</c>.</summary>
        public int Users;
    }

    private sealed class Releaser : IDisposable
    {
        private readonly int _propertyId;
        private Entry? _entry;

        public Releaser(int propertyId, Entry entry)
        {
            _propertyId = propertyId;
            _entry = entry;
        }

        public void Dispose()
        {
            var entry = Interlocked.Exchange(ref _entry, null);
            if (entry is not null)
            {
                Leave(_propertyId, entry, holdsLock: true);
            }
        }
    }
}
