namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Issues lease-rent document numbers (TXN / RCPT / CHQ) from the numbers already stored in the
/// payment tables, per key and year.
/// </summary>
public interface ILeaseRentNumberGenerator
{
    /// <summary>
    /// Returns the next value (starting at 1) of the <paramref name="sequenceKey"/> series for
    /// <paramref name="year"/>. Must be called inside the caller's open database transaction: the
    /// series stays locked until that transaction ends, so concurrent requests — on any number of app
    /// instances — get distinct numbers, and a rollback hands the number back (no gaps). A series
    /// holds at most 999,999 numbers (they are stored as six digits).
    /// </summary>
    Task<int> NextAsync(string sequenceKey, int year, CancellationToken cancellationToken = default);
}
