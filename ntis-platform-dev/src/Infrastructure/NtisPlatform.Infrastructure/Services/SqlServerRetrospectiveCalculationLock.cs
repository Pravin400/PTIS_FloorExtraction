using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;

namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// <see cref="IRetrospectiveCalculationLock"/> on a SQL Server application lock (<c>sp_getapplock</c>), keyed by
/// property id, so that two retrospective calculations for the same property cannot run at the same time in any
/// process that talks to the same database. A holder keeps it across an RV recalculation and the engine run that follows
/// it (<c>IRetrospectiveTaxRefresher</c>), not only across the engine run.
/// <para>
/// The lock is taken on a connection of its own, inside a transaction that does nothing else (lock owner =
/// Transaction): committing, rolling back or losing that connection always frees it, so a failed release can never
/// leave a property locked, and it takes no part in the transactions of the calculation itself. The lock is scoped to
/// the database of the connection, which is what is wanted (one lock per property of one database), and a property's
/// lock never blocks another property's.
/// </para>
/// <para>
/// The connection comes from a connection pool of its own (see <see cref="WithOwnPool"/>), not from the pool EF uses.
/// </para>
/// </summary>
public sealed class SqlServerRetrospectiveCalculationLock : IRetrospectiveCalculationLock
{
    /// <summary>How long a run waits for another process to finish the same property before giving up.</summary>
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(2);

    /// <summary>What the lock adds to the connection string's Application Name; a pool is keyed by the whole connection string.</summary>
    private const string PoolNameSuffix = ".RetroLock";

    /// <summary>The longest Application Name SQL Server keeps.</summary>
    private const int MaxApplicationNameLength = 128;

    private readonly string _connectionString;
    private readonly TimeSpan _timeout;
    private readonly ILogger<SqlServerRetrospectiveCalculationLock>? _logger;

    public SqlServerRetrospectiveCalculationLock(
        string connectionString, TimeSpan? timeout = null, ILogger<SqlServerRetrospectiveCalculationLock>? logger = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("A connection string is required.", nameof(connectionString));

        _connectionString = WithOwnPool(connectionString);
        _timeout = ValidateTimeout(timeout ?? DefaultTimeout);
        _logger = logger;
    }

    /// <summary>
    /// The longest wait sp_getapplock accepts: its @LockTimeout is an int of milliseconds (about 24.8 days). A larger value
    /// would overflow the cast, and a negative one has a meaning of its own there (-1 waits for ever, other values are errors).
    /// </summary>
    internal static readonly TimeSpan MaxTimeout = TimeSpan.FromMilliseconds(int.MaxValue);

    /// <summary>
    /// The shortest wait: @LockTimeout is whole milliseconds and the value is truncated, so anything below one millisecond
    /// (one tick, say) would reach SQL Server as 0 = "do not wait" and fail every contended calculation at once.
    /// </summary>
    internal static readonly TimeSpan MinTimeout = TimeSpan.FromMilliseconds(1);

    /// <summary>
    /// A timeout is a real, finite wait: at least <see cref="MinTimeout"/> (less would become 0 = "do not wait at all" and fail every contended run) and
    /// at most <see cref="MaxTimeout"/>. Anything else is a configuration mistake that must stop at construction, not turn into
    /// an unbounded wait or an overflowed SQL parameter at the first contended calculation.
    /// </summary>
    internal static TimeSpan ValidateTimeout(TimeSpan timeout)
    {
        if (timeout < MinTimeout || timeout > MaxTimeout)
        {
            throw new ArgumentOutOfRangeException(
                nameof(timeout), timeout,
                $"The lock timeout must be at least one millisecond and at most {MaxTimeout.TotalSeconds:0} seconds (the largest wait sp_getapplock accepts).");
        }

        return timeout;
    }

    /// <summary>The application-lock resource name of a property.</summary>
    internal static string ResourceName(int propertyId) => $"NTIS.RetrospectiveTax.Property.{propertyId}";

    /// <summary>
    /// The connection string the lock connects with: the given one with another <c>Application Name</c>, which makes it
    /// another connection pool. A lock connection stays checked out for a whole calculation, and the calculation needs
    /// connections of the pool EF uses to read and save. Lock connections taken from that same pool could use up every
    /// slot (one per running or waiting calculation) and leave the calculations that hold them without the connection
    /// they need to finish and let go. With a pool of its own, a lock can at worst run out of lock connections, which
    /// fails that one lock attempt with the pool's timeout message, and <see cref="SqlConnection.ClearPool"/> after a
    /// failed release no longer drops EF's connections. The lock's sessions also show up under their own name in
    /// <c>sys.dm_exec_sessions</c>.
    /// </summary>
    internal static string WithOwnPool(string connectionString)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var name = builder.ApplicationName;
        if (name.Length + PoolNameSuffix.Length > MaxApplicationNameLength)
        {
            name = name[..(MaxApplicationNameLength - PoolNameSuffix.Length)];
        }

        builder.ApplicationName = name + PoolNameSuffix;
        return builder.ConnectionString;
    }

    public async Task<IAsyncDisposable> AcquireAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var connection = new SqlConnection(_connectionString);
        SqlTransaction? transaction = null;
        try
        {
            await connection.OpenAsync(cancellationToken);
            transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = "sp_getapplock";
            // The client must not give up before the server's own lock timeout has had its say.
            command.CommandTimeout = (int)Math.Ceiling(_timeout.TotalSeconds) + 30;
            command.Parameters.Add(new SqlParameter("@Resource", SqlDbType.NVarChar, 255) { Value = ResourceName(propertyId) });
            command.Parameters.Add(new SqlParameter("@LockMode", SqlDbType.VarChar, 32) { Value = "Exclusive" });
            command.Parameters.Add(new SqlParameter("@LockOwner", SqlDbType.VarChar, 32) { Value = "Transaction" });
            command.Parameters.Add(new SqlParameter("@LockTimeout", SqlDbType.Int) { Value = (int)_timeout.TotalMilliseconds });
            var result = new SqlParameter("@Result", SqlDbType.Int) { Direction = ParameterDirection.ReturnValue };
            command.Parameters.Add(result);

            await command.ExecuteNonQueryAsync(cancellationToken);

            // 0 = granted at once, 1 = granted after waiting; below 0 the lock was not granted.
            var code = Convert.ToInt32(result.Value);
            if (code == -1)
            {
                throw new RetrospectiveCalculationInProgressException(propertyId,
                    $"Another retrospective calculation for property {propertyId} did not finish within {_timeout.TotalSeconds:0} seconds; this one was not started. Try again.");
            }

            if (code < 0)
            {
                throw new InvalidOperationException(
                    $"The retrospective calculation lock for property {propertyId} could not be taken (sp_getapplock returned {code}).");
            }

            _logger?.LogDebug("Retrospective calculation lock taken for property {PropertyId} (sp_getapplock returned {Code}).", propertyId, code);
            return new Handle(propertyId, connection, transaction, _logger);
        }
        catch
        {
            await DiscardAsync(connection, transaction);
            throw;
        }
    }

    /// <summary>Gets rid of a connection whose lock attempt did not succeed; closing it also frees anything it holds.</summary>
    private static async Task DiscardAsync(SqlConnection connection, SqlTransaction? transaction)
    {
        try
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync(); // rolls back what is still open
            }
        }
        catch
        {
            // the connection is disposed next either way
        }

        await connection.DisposeAsync();
    }

    private sealed class Handle : IAsyncDisposable
    {
        private readonly int _propertyId;
        private readonly ILogger<SqlServerRetrospectiveCalculationLock>? _logger;
        private SqlConnection? _connection;
        private SqlTransaction? _transaction;

        public Handle(int propertyId, SqlConnection connection, SqlTransaction transaction, ILogger<SqlServerRetrospectiveCalculationLock>? logger)
        {
            _propertyId = propertyId;
            _connection = connection;
            _transaction = transaction;
            _logger = logger;
        }

        public async ValueTask DisposeAsync()
        {
            var connection = Interlocked.Exchange(ref _connection, null);
            var transaction = Interlocked.Exchange(ref _transaction, null);
            if (connection is null)
            {
                return;
            }

            try
            {
                if (transaction is not null)
                {
                    await transaction.RollbackAsync(); // ends the transaction and with it the application lock
                    await transaction.DisposeAsync();
                }
            }
            catch (Exception ex)
            {
                // A broken connection loses its lock when it is closed; make sure it is really closed and not pooled.
                _logger?.LogWarning(ex, "Releasing the retrospective calculation lock of property {PropertyId} failed; the connection is dropped, which frees it.", _propertyId);
                SqlConnection.ClearPool(connection);
            }
            finally
            {
                await connection.DisposeAsync();
            }
        }
    }
}
