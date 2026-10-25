using System.Collections.Concurrent;

namespace NtisPlatform.Application.Services.WaterBill.Master;

/// <summary>
/// Provides key-based asynchronous locking per TariffId to prevent race conditions
/// during concurrent slab or charge modifications (e.g., global-vs-specific scope mixing, range overlaps).
/// </summary>
public static class TariffConcurrencyLock
{
    private static readonly ConcurrentDictionary<long, SemaphoreSlim> _locks = new();

    /// <summary>
    /// Acquires an asynchronous lock for the specified TariffId.
    /// Dispose the returned handle to release the lock.
    /// </summary>
    public static async Task<IDisposable> LockAsync(long tariffId, CancellationToken cancellationToken = default)
    {
        var semaphore = _locks.GetOrAdd(tariffId, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(cancellationToken);
        return new Releaser(semaphore);
    }

    private sealed class Releaser : IDisposable
    {
        private readonly SemaphoreSlim _semaphore;
        private bool _disposed;

        public Releaser(SemaphoreSlim semaphore)
        {
            _semaphore = semaphore;
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _semaphore.Release();
                _disposed = true;
            }
        }
    }
}
