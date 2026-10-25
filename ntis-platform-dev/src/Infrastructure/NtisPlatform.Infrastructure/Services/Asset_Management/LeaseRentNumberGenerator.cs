using System.Data;
using System.Data.Common;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Services.Asset_Management;

/// <summary>
/// <see cref="ILeaseRentNumberGenerator"/> over the columns that hold the numbers themselves:
/// TXN → LeaseRentBillTransactions.TransactionNo, RCPT → LeaseRentBillTransactions.ReceiptNo,
/// CHQ → ChequePaymentTransactions.AcknowledgementNo. The next number is the highest one issued for
/// the key and year, plus 1. Runs on the DbContext's own connection and current transaction (the
/// same scoped context the UnitOfWork uses).
///
/// Numbers are stored as {key}-{year}-{six digits} (LeaseRentBillingService formats them D6), so
/// string order is numeric order and the highest one is the last key in the column's unique index:
/// one backward seek reads it, however many numbers the year already holds.
/// </summary>
public class LeaseRentNumberGenerator : ILeaseRentNumberGenerator
{
    /// <summary>Largest number a six-digit series can hold.</summary>
    public const int MaxNumber = 999_999;

    // LIKE suffix matching exactly the six digits; other values under the prefix are ignored.
    private const string SixDigits = "[0-9][0-9][0-9][0-9][0-9][0-9]";

    // Fixed table/column per key — identifiers can't be parameters, and this whitelist is the only
    // thing ever formatted into the SQL.
    private static readonly IReadOnlyDictionary<string, (string Table, string Column)> NumberColumns =
        new Dictionary<string, (string, string)>
        {
            ["TXN"] = ("[AMS].[LeaseRentBillTransactions]", "[TransactionNo]"),
            ["RCPT"] = ("[AMS].[LeaseRentBillTransactions]", "[ReceiptNo]"),
            ["CHQ"] = ("[AMS].[ChequePaymentTransactions]", "[AcknowledgementNo]"),
        };

    private readonly ApplicationDbContext _context;

    public LeaseRentNumberGenerator(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> NextAsync(string sequenceKey, int year, CancellationToken cancellationToken = default)
    {
        if (!NumberColumns.TryGetValue(sequenceKey, out var target))
            throw new ArgumentOutOfRangeException(nameof(sequenceKey), sequenceKey, "Unknown lease-rent number series.");

        var transaction = _context.Database.CurrentTransaction
            ?? throw new InvalidOperationException("Lease-rent numbers must be generated inside the payment's database transaction.");

        // TOP (1) ... ORDER BY DESC seeks backward to the highest number only. UPDLOCK + HOLDLOCK lock
        // that key and the range above it (the whole range when the year has no numbers yet) until
        // the caller's transaction ends, so a concurrent payment waits here and then sees the row this
        // one inserted. A rolled-back payment leaves no row, so its number is reused (no gaps).
        var prefix = $"{sequenceKey}-{year}-";
        var command = _context.Database.GetDbConnection().CreateCommand();
        await using (command)
        {
            command.CommandText = $"""
                SELECT TOP (1) {target.Column}
                FROM {target.Table} WITH (UPDLOCK, HOLDLOCK)
                WHERE {target.Column} LIKE @Pattern
                ORDER BY {target.Column} DESC
                """;
            command.CommandType = CommandType.Text;
            command.Transaction = transaction.GetDbTransaction();
            // AnsiString: a varchar parameter never forces a conversion of the column (an nvarchar one
            // would on a varchar column, turning the index seek and its narrow range lock into a scan).
            AddParameter(command, "@Pattern", prefix + SixDigits, DbType.AnsiString);

            var last = await command.ExecuteScalarAsync(cancellationToken) as string;
            var next = last == null ? 1 : int.Parse(last.AsSpan(prefix.Length), CultureInfo.InvariantCulture) + 1;

            // A seventh digit would sort below the six-digit numbers and be issued again.
            if (next > MaxNumber)
                throw new InvalidOperationException($"The {prefix} lease-rent number series is exhausted ({MaxNumber} numbers).");

            return next;
        }
    }

    private static void AddParameter(DbCommand command, string name, object value, DbType type)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.DbType = type;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
