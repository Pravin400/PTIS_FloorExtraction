using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// A [Fact] that needs a real SQL Server (transactions, locking, raw SQL). Skipped unless the
/// NTIS_TEST_SQLSERVER environment variable holds a server connection string the tests may create
/// and drop throwaway databases on, e.g.
/// <c>Data Source=(localdb)\MSSQLLocalDB;Integrated Security=True;TrustServerCertificate=True</c>.
/// </summary>
public sealed class SqlServerFactAttribute : FactAttribute
{
    public const string ConnectionStringVariable = "NTIS_TEST_SQLSERVER";

    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            Skip = $"Set {ConnectionStringVariable} to a SQL Server connection string to run.";
    }

    public static string? ConnectionString => Environment.GetEnvironmentVariable(ConnectionStringVariable);
}

/// <summary>
/// Creates a throwaway SQL Server database for <see cref="LeaseRentBillingServiceSqlServerTests"/> and
/// drops it afterwards. Only runs when NTIS_TEST_SQLSERVER is set (see <see cref="SqlServerFactAttribute"/>).
/// Only the payment tables are created, from the EF model itself (columns, computed columns, defaults,
/// CHECK constraints and indexes exactly as mapped); foreign keys to tables outside that set are left
/// out, so no asset masters need seeding.
/// </summary>
public sealed class LeaseRentSqlServerFixture : IAsyncLifetime
{
    private const string Schema = "AMS";

    private static readonly HashSet<string> PaymentTables = new()
    {
        "AssetLeaseRentDetails", "MonthWiseDemand", "PenaltyRuleMaster",
        "LeaseRentBillTransactions", "LeaseRentBillTransactionDetails", "ChequePaymentTransactions"
    };

    public DbContextOptions<ApplicationDbContext> Options { get; private set; } = null!;
    public bool IsAvailable { get; private set; }

    public async Task InitializeAsync()
    {
        var serverConnectionString = SqlServerFactAttribute.ConnectionString;
        if (string.IsNullOrWhiteSpace(serverConnectionString))
            return;

        var connectionString = new SqlConnectionStringBuilder(serverConnectionString)
        {
            InitialCatalog = $"NtisLeaseRentTests_{Guid.NewGuid():N}",
            MaxPoolSize = 200
        }.ConnectionString;
        Options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connectionString).Options;

        await using var context = new ApplicationDbContext(Options);
        var creator = context.GetService<IRelationalDatabaseCreator>();
        await creator.CreateAsync();
        try
        {
            await CreatePaymentTablesAsync(context);
        }
        catch
        {
            await creator.DeleteAsync();
            throw;
        }

        context.Set<PenaltyRuleMasterEntity>().Add(new PenaltyRuleMasterEntity
        {
            PenaltyCode = "LATE2PCT",
            PenaltyName = "Late payment 2%",
            CalculationType = "Percentage",
            PenaltyValue = 2m,
            GracePeriodDays = 5,
            IsActive = true,
            CreatedDate = DateTime.Now
        });
        await context.SaveChangesAsync();
        IsAvailable = true;
    }

    private static async Task CreatePaymentTablesAsync(ApplicationDbContext context)
    {
        var model = context.GetService<IDesignTimeModel>().Model;
        var operations = context.GetService<IMigrationsModelDiffer>()
            .GetDifferences(null, model.GetRelationalModel())
            .Where(operation => operation switch
            {
                CreateTableOperation table => table.Schema == Schema && PaymentTables.Contains(table.Name),
                CreateIndexOperation index => index.Schema == Schema && PaymentTables.Contains(index.Table),
                _ => false
            })
            .ToList();

        foreach (var table in operations.OfType<CreateTableOperation>())
            table.ForeignKeys.RemoveAll(fk => !PaymentTables.Contains(fk.PrincipalTable));

        await context.Database.ExecuteSqlRawAsync($"IF SCHEMA_ID(N'{Schema}') IS NULL EXEC(N'CREATE SCHEMA [{Schema}]')");
        foreach (var command in context.GetService<IMigrationsSqlGenerator>().Generate(operations, model))
            await context.Database.ExecuteSqlRawAsync(command.CommandText);
    }

    public async Task DisposeAsync()
    {
        if (!IsAvailable)
            return;

        await using var context = new ApplicationDbContext(Options);
        await context.Database.EnsureDeletedAsync();
    }
}

/// <summary>
/// <see cref="LeaseRentBillingService"/> against real SQL Server, for what the InMemory provider can't
/// show: a failed payment rolls back completely (§11 #25), concurrent payments on one month settle it
/// once (§11 #21), concurrent payments never share a number (§11 #22), and the persisted computed
/// columns and CHECK constraints agree with the service. Same fixture as the InMemory tests: each
/// month rent 5000 + GST 900 + penalty 100 (2%, paid 2026-09-30) = 6000. Each test seeds its own lease.
/// </summary>
[Trait("Category", "SqlServer")]
public class LeaseRentBillingServiceSqlServerTests : IClassFixture<LeaseRentSqlServerFixture>
{
    private const int UserId = 42;
    private const int AssetId = 10;
    private static readonly DateTime PaymentDate = new(2026, 9, 30);

    private readonly LeaseRentSqlServerFixture _database;
    private readonly Mock<TimeProvider> _clock = new();

    public LeaseRentBillingServiceSqlServerTests(LeaseRentSqlServerFixture database)
    {
        _database = database;
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(2026, 9, 30, 12, 0, 0, TimeSpan.Zero));
        _clock.Setup(c => c.LocalTimeZone).Returns(TimeZoneInfo.Utc);
    }

    private ApplicationDbContext NewContext() => new(_database.Options);

    private LeaseRentBillingService CreateService(
        ApplicationDbContext context,
        Func<ILeaseRentNumberGenerator, ILeaseRentNumberGenerator>? wrapNumbers = null,
        IRepository<LeaseRentBillTransactionDetailEntity, int>? detailRepository = null)
    {
        ILeaseRentNumberGenerator numbers = new LeaseRentNumberGenerator(context);
        return new LeaseRentBillingService(
            new Repository<LeaseRentBillTransactionEntity, int>(context),
            detailRepository ?? new Repository<LeaseRentBillTransactionDetailEntity, int>(context),
            new Repository<MonthWiseDemandEntity, int>(context),
            new Repository<AssetLeaseRentDetailsEntity, int>(context),
            new Repository<PenaltyRuleMasterEntity, int>(context),
            new Repository<ChequePaymentTransactionEntity, int>(context),
            wrapNumbers?.Invoke(numbers) ?? numbers,
            new UnitOfWork(context),
            _clock.Object);
    }

    /// <summary>A new Approved lease with Pending demands for the given months of 2026.</summary>
    private async Task<(int LeaseId, int[] DemandIds)> SeedLeaseAsync(decimal advanceBalance = 0m, params byte[] months)
    {
        await using var context = NewContext();
        var lease = new AssetLeaseRentDetailsEntity
        {
            AssetId = AssetId,
            TenantName = "Ramesh Patil",
            TenantMobile = "9876543210",
            LeaseType = "Rent",
            LeaseStartDate = new DateTime(2026, 4, 1),
            RentAmount = 5000m,
            PaymentFrequency = "Monthly",
            WorkflowStatus = "Approved",
            AdvanceBalance = advanceBalance,
            IsActive = true,
            CreatedDate = DateTime.Now
        };
        context.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await context.SaveChangesAsync();

        var demands = months.Select(month => new MonthWiseDemandEntity
        {
            AssetId = AssetId,
            LeaseRegistrationId = lease.Id,
            FinanceYear = 2026,
            DemandYear = 2026,
            QuarterNo = 2,
            DemandMonth = month,
            MonthlyRentAmount = 5000m,
            GSTAmount = 900m,
            PenaltyAmount = 0m,
            PaidAmount = 0m,
            DemandStatus = "Pending",
            DueDate = new DateTime(2026, month, 10),
            IsActive = true,
            CreatedDate = DateTime.Now
        }).ToList();
        context.Set<MonthWiseDemandEntity>().AddRange(demands);
        await context.SaveChangesAsync();

        return (lease.Id, demands.Select(d => d.Id).ToArray());
    }

    private static CreateBillPaymentDto Request(string paymentType, decimal paidAmount, string paymentMode = "Cash", params int[] demandIds)
    {
        var dto = new CreateBillPaymentDto
        {
            PaymentType = paymentType,
            PaymentMode = paymentMode,
            PaymentDate = PaymentDate,
            PayerMobile = "9876543210",
            PaidAmount = paidAmount,
            Allocations = demandIds.Select(id => new BillPaymentAllocationDto { MonthWiseDemandId = id }).ToList()
        };
        if (paymentMode == "Cheque")
        {
            dto.BankName = "HDFC";
            dto.ChequeOrTransactionNo = "004512";
            dto.ChequeDate = new DateTime(2026, 9, 28);
        }
        return dto;
    }

    /// <summary>The highest TXN number issued in 2026 so far (0 when none).</summary>
    private async Task<int> LastTransactionNumberAsync()
    {
        await using var context = NewContext();
        var numbers = await context.Set<LeaseRentBillTransactionEntity>().AsNoTracking()
            .Where(t => t.TransactionNo.StartsWith("TXN-2026-"))
            .Select(t => t.TransactionNo)
            .ToListAsync();
        return numbers.Select(n => int.Parse(n["TXN-2026-".Length..])).DefaultIfEmpty(0).Max();
    }

    private void RequireDatabase() => Assert.True(_database.IsAvailable, "The SQL Server test database was not created.");

    [SqlServerFact]
    public async Task FullPayment_PersistsAndDatabaseComputedColumnsAgree()
    {
        RequireDatabase();
        var (leaseId, demandIds) = await SeedLeaseAsync(months: new byte[] { 7, 8, 9 });

        BillReceiptDto receipt;
        await using (var context = NewContext())
            receipt = await CreateService(context).ProcessPaymentAsync(leaseId, Request("Full", 20000m), UserId);

        await using var read = NewContext();
        var header = await read.Set<LeaseRentBillTransactionEntity>().AsNoTracking().SingleAsync(t => t.LeaseRegistrationId == leaseId);
        Assert.Equal((18000m, 18000m, 20000m), (header.TotalDemandAmount, header.NetPayableAmount, header.PaidAmount));
        Assert.Equal(receipt.Uuid, header.Uuid);
        Assert.StartsWith("TXN-2026-", header.TransactionNo);
        Assert.StartsWith("RCPT-2026-", header.ReceiptNo);
        Assert.Equal(("Ramesh Patil", "9876543210", 5000m, new DateTime(2026, 4, 1)),
            (header.Snap_TenantName, header.Snap_TenantMobile, header.Snap_RentAmount!.Value, header.Snap_LeaseStartDate!.Value));

        var details = await read.Set<LeaseRentBillTransactionDetailEntity>().AsNoTracking().Where(d => d.LeaseRentBillTransactionId == header.Id).ToListAsync();
        Assert.Equal(3, details.Count);
        Assert.All(details, d => Assert.Equal(6000m, d.TotalDemandAmount));

        var demands = await read.Set<MonthWiseDemandEntity>().AsNoTracking().Where(d => demandIds.Contains(d.Id)).ToListAsync();
        Assert.All(demands, d => Assert.Equal((6000m, 0m, 100m, "Paid"), (d.TotalDemandAmount, d.PendingAmount, d.PenaltyAmount, d.DemandStatus)));

        Assert.Equal(2000m, await read.Set<AssetLeaseRentDetailsEntity>().Where(l => l.Id == leaseId).Select(l => l.AdvanceBalance).SingleAsync());
    }

    [SqlServerFact]
    public async Task PersistedNetPayable_IgnoresTheDiscount_AndMatchesTheReceipt()
    {
        RequireDatabase();
        var (leaseId, _) = await SeedLeaseAsync(advanceBalance: 1000m, months: new byte[] { 7, 8, 9 });

        var dto = Request("Full", 17000m);
        dto.DiscountAmount = 500m;
        dto.AdjustmentAmount = -1000m; // the whole wallet

        BillReceiptDto receipt;
        await using (var context = NewContext())
            receipt = await CreateService(context).ProcessPaymentAsync(leaseId, dto, UserId);

        await using var read = NewContext();
        var header = await read.Set<LeaseRentBillTransactionEntity>().AsNoTracking().SingleAsync(t => t.LeaseRegistrationId == leaseId);
        Assert.Equal((18000m, 500m, 17000m), (header.TotalDemandAmount, header.DiscountAmount, header.NetPayableAmount)); // 18000 + (-1000)
        Assert.Equal(header.NetPayableAmount, receipt.NetPayableAmount);
        Assert.Equal(header.PaidAmount, header.NetPayableAmount); // exactly what had to be paid in cash
    }

    [SqlServerFact] // §11 #25
    public async Task FailureAfterHeaderInsert_RollsEverythingBack()
    {
        RequireDatabase();
        var (leaseId, demandIds) = await SeedLeaseAsync(advanceBalance: 6000m, months: new byte[] { 7, 8, 9 });
        var lastNumberBefore = await LastTransactionNumberAsync();

        var failingDetails = new Mock<IRepository<LeaseRentBillTransactionDetailEntity, int>>();
        failingDetails
            .Setup(r => r.AddAsync(It.IsAny<LeaseRentBillTransactionDetailEntity>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated failure after the header insert"));

        await using (var context = NewContext())
        {
            var dto = Request("Full", 12000m);
            dto.AdjustmentAmount = -6000m;
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => CreateService(context, detailRepository: failingDetails.Object).ProcessPaymentAsync(leaseId, dto, UserId));
        }

        await using (var read = NewContext())
        {
            Assert.False(await read.Set<LeaseRentBillTransactionEntity>().AnyAsync(t => t.LeaseRegistrationId == leaseId));
            Assert.False(await read.Set<LeaseRentBillTransactionDetailEntity>().AnyAsync(d => d.LeaseRegistrationId == leaseId));
            var demands = await read.Set<MonthWiseDemandEntity>().AsNoTracking().Where(d => demandIds.Contains(d.Id)).ToListAsync();
            Assert.All(demands, d => Assert.Equal((0m, 0m, "Pending"), (d.PaidAmount, d.PenaltyAmount, d.DemandStatus)));
            Assert.Equal(6000m, await read.Set<AssetLeaseRentDetailsEntity>().Where(l => l.Id == leaseId).Select(l => l.AdvanceBalance).SingleAsync());
        }

        // The failed payment's numbers were handed back: the next payment gets them.
        await using (var context = NewContext())
        {
            var receipt = await CreateService(context).ProcessPaymentAsync(leaseId, Request("Full", 18000m), UserId);
            Assert.Equal($"TXN-2026-{lastNumberBefore + 1:D6}", receipt.TransactionNo);
            Assert.Equal($"RCPT-2026-{lastNumberBefore + 1:D6}", receipt.ReceiptNo);
        }
    }

    [SqlServerFact] // §11 #21 (D6)
    public async Task ConcurrentPaymentsOnTheSameMonth_SettleItOnce()
    {
        RequireDatabase();
        var (leaseId, demandIds) = await SeedLeaseAsync(months: new byte[] { 7 });
        var julId = demandIds[0];

        // Both requests read Jul before either writes: each waits at the gate just before its first
        // write (the number), inside its transaction.
        var gate = new AsyncGate(2);
        async Task<Exception?> PayJulAsync()
        {
            await using var context = NewContext();
            try
            {
                await CreateService(context, inner => new GatedNumberGenerator(inner, gate))
                    .ProcessPaymentAsync(leaseId, Request("Monthwise", 6000m, demandIds: julId), UserId);
                return null;
            }
            catch (Exception ex)
            {
                return ex;
            }
        }

        var outcomes = await Task.WhenAll(PayJulAsync(), PayJulAsync());

        Assert.Single(outcomes, o => o == null);
        var failure = Assert.Single(outcomes, o => o != null)!;
        Assert.True(
            failure is InvalidOperationException { Message: LeaseRentBillingService.ConcurrencyConflictCode or "Payment_Demand_AlreadyPaid" },
            $"Unexpected failure: {failure}");

        await using var read = NewContext();
        var jul = await read.Set<MonthWiseDemandEntity>().AsNoTracking().SingleAsync(d => d.Id == julId);
        Assert.Equal((6000m, "Paid"), (jul.PaidAmount, jul.DemandStatus));
        Assert.Equal(1, await read.Set<LeaseRentBillTransactionEntity>().CountAsync(t => t.LeaseRegistrationId == leaseId));
        Assert.Equal(1, await read.Set<LeaseRentBillTransactionDetailEntity>().CountAsync(d => d.MonthWiseDemandId == julId));
    }

    [SqlServerFact] // §11 #22 (D5)
    public async Task ConcurrentPaymentsOnDifferentLeases_GetDistinctNumbers()
    {
        RequireDatabase();
        const int payments = 20;
        var leases = new List<int>();
        for (var i = 0; i < payments; i++)
            leases.Add((await SeedLeaseAsync(months: new byte[] { 9 })).LeaseId);

        var receipts = await Task.WhenAll(leases.Select(async leaseId =>
        {
            await using var context = NewContext();
            return await CreateService(context).ProcessPaymentAsync(leaseId, Request("Full", 6000m), UserId);
        }));

        Assert.Equal(payments, receipts.Select(r => r.TransactionNo).Distinct().Count());
        Assert.Equal(payments, receipts.Select(r => r.ReceiptNo).Distinct().Count());

        var sequence = receipts.Select(r => int.Parse(r.TransactionNo[^6..])).OrderBy(n => n).ToList();
        Assert.Equal(payments - 1, sequence[^1] - sequence[0]); // consecutive: no gaps, no repeats
    }

    [SqlServerFact] // §11 #15, #17
    public async Task Cheque_StagedThenCleared_PostsOnce()
    {
        RequireDatabase();
        var (leaseId, demandIds) = await SeedLeaseAsync(months: new byte[] { 7, 8 });

        ChequeAcknowledgementDto ack;
        await using (var context = NewContext())
            ack = await CreateService(context).ProcessChequePaymentAsync(leaseId, Request("Full", 12000m, "Cheque"), UserId);
        Assert.StartsWith("CHQ-2026-", ack.AcknowledgementNo);

        await using (var context = NewContext())
        {
            Assert.False(await context.Set<LeaseRentBillTransactionEntity>().AnyAsync(t => t.LeaseRegistrationId == leaseId));
            Assert.All(await context.Set<MonthWiseDemandEntity>().Where(d => demandIds.Contains(d.Id)).ToListAsync(),
                d => Assert.Equal((0m, 0m), (d.PaidAmount, d.PenaltyAmount)));
        }

        foreach (var status in new[] { "Deposited", "Cleared" })
        {
            await using var context = NewContext();
            await CreateService(context).UpdateChequeStatusAsync(leaseId, ack.Id, new UpdateChequeStatusDto { Status = status }, UserId);
        }

        await using var read = NewContext();
        var header = await read.Set<LeaseRentBillTransactionEntity>().AsNoTracking().SingleAsync(t => t.LeaseRegistrationId == leaseId);
        Assert.Equal(("Cheque", 12000m, 12000m), (header.PaymentMode, header.TotalDemandAmount, header.PaidAmount));
        var cheque = await read.Set<ChequePaymentTransactionEntity>().AsNoTracking().SingleAsync(c => c.Id == ack.Id);
        Assert.Equal(("Cleared", (int?)header.Id), (cheque.Status, cheque.LeaseRentBillTransactionId));
        Assert.All(await read.Set<MonthWiseDemandEntity>().AsNoTracking().Where(d => demandIds.Contains(d.Id)).ToListAsync(),
            d => Assert.Equal((6000m, 100m, "Paid"), (d.PaidAmount, d.PenaltyAmount, d.DemandStatus)));
    }

    [SqlServerFact] // D7 and the §8 bank-details rule, enforced by the database itself
    public async Task Database_RejectsAdvanceChequeRows_AndBankModesWithoutBankDetails()
    {
        RequireDatabase();
        var (leaseId, _) = await SeedLeaseAsync(months: new byte[] { 7 });

        await using (var context = NewContext())
        {
            context.Set<ChequePaymentTransactionEntity>().Add(new ChequePaymentTransactionEntity
            {
                AcknowledgementNo = $"CHQ-TEST-{Guid.NewGuid():N}"[..30],
                AssetId = AssetId,
                LeaseRegistrationId = leaseId,
                FinanceYear = 2026,
                PaymentType = "Advance",
                AllocationsJson = "[]",
                PaymentDate = PaymentDate,
                BankName = "HDFC",
                ChequeOrTransactionNo = "004512",
                ChequeDate = PaymentDate,
                PayerMobile = "9876543210",
                CreatedDate = DateTime.Now
            });
            var ex = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            Assert.Contains("CK_ChequePaymentTransactions_PaymentType", ex.InnerException?.Message);
        }

        await using (var context = NewContext())
        {
            context.Set<LeaseRentBillTransactionEntity>().Add(new LeaseRentBillTransactionEntity
            {
                TransactionNo = $"TXN-TEST-{Guid.NewGuid():N}"[..30],
                AssetId = AssetId,
                LeaseRegistrationId = leaseId,
                FinanceYear = 2026,
                PaymentMode = "NEFT",
                PaymentDate = PaymentDate,
                CreatedDate = DateTime.Now
            });
            var ex = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            Assert.Contains("CK_LeaseRentBillTransactions_BankDetails", ex.InnerException?.Message);
        }
    }

    /// <summary>A bare ledger header holding <paramref name="transactionNo"/>, for seeding a number series.</summary>
    private static LeaseRentBillTransactionEntity NumberedHeader(string transactionNo) => new()
    {
        TransactionNo = transactionNo,
        AssetId = AssetId,
        LeaseRegistrationId = 1,
        FinanceYear = 2026,
        PaymentMode = "Cash",
        PaymentDate = PaymentDate,
        CreatedDate = DateTime.Now
    };

    [SqlServerFact]
    public async Task NumberGenerator_ReturnsHighestSixDigitNumberPlusOne_IgnoringOtherValues()
    {
        RequireDatabase();

        // Years no payment test posts in, inside a transaction that is never committed.
        await using var context = NewContext();
        await using var transaction = await context.Database.BeginTransactionAsync();
        context.Set<LeaseRentBillTransactionEntity>().AddRange(
            NumberedHeader("TXN-2099-000009"),
            NumberedHeader("TXN-2099-000010"),  // highest: string order is numeric order at six digits
            NumberedHeader("TXN-2099-0000100"), // not six digits
            NumberedHeader("TXN-2099-MANUAL"));
        await context.SaveChangesAsync();

        var numbers = new LeaseRentNumberGenerator(context);

        Assert.Equal(11, await numbers.NextAsync("TXN", 2099));
        Assert.Equal(1, await numbers.NextAsync("TXN", 2098)); // a year with no numbers starts at 1
        Assert.Equal(1, await numbers.NextAsync("CHQ", 2099)); // each key is its own series
    }

    [SqlServerFact]
    public async Task NumberGenerator_RefusesToIssueASeventhDigit()
    {
        RequireDatabase();

        await using var context = NewContext();
        await using var transaction = await context.Database.BeginTransactionAsync();
        context.Set<LeaseRentBillTransactionEntity>().Add(NumberedHeader("TXN-2097-999999"));
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new LeaseRentNumberGenerator(context).NextAsync("TXN", 2097));
        Assert.Contains("exhausted", ex.Message);
    }

    /// <summary>Lets <c>count</c> callers through only once all of them have arrived.</summary>
    private sealed class AsyncGate
    {
        private readonly TaskCompletionSource _allArrived = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _remaining;

        public AsyncGate(int count) => _remaining = count;

        public Task ArriveAndWaitAsync()
        {
            if (Interlocked.Decrement(ref _remaining) == 0)
                _allArrived.SetResult();
            return _allArrived.Task.WaitAsync(TimeSpan.FromSeconds(30));
        }
    }

    /// <summary>Holds its payment at the gate before taking its first number, then numbers normally.</summary>
    private sealed class GatedNumberGenerator : ILeaseRentNumberGenerator
    {
        private readonly ILeaseRentNumberGenerator _inner;
        private readonly AsyncGate _gate;
        private bool _passed;

        public GatedNumberGenerator(ILeaseRentNumberGenerator inner, AsyncGate gate)
        {
            _inner = inner;
            _gate = gate;
        }

        public async Task<int> NextAsync(string sequenceKey, int year, CancellationToken cancellationToken = default)
        {
            if (!_passed)
            {
                _passed = true;
                await _gate.ArriveAndWaitAsync();
            }
            return await _inner.NextAsync(sequenceKey, year, cancellationToken);
        }
    }
}
