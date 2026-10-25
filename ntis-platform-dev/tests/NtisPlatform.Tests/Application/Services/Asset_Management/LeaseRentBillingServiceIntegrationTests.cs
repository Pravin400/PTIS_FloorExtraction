using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Integration tests for <see cref="LeaseRentBillingService"/> against a real
/// <see cref="ApplicationDbContext"/> (EF Core InMemory provider), one fresh context per call like a
/// request, asserting on what a later request would read back. Covers the acceptance scenarios that
/// don't need real SQL Server transactions; those (atomic rollback, concurrent numbering, truly
/// parallel payments) are in <see cref="LeaseRentBillingServiceSqlServerTests"/>.
///
/// Fixture: lease L1 Approved, AdvanceBalance 0, demands Jul/Aug/Sep 2026 (FY 2026) each rent 5000,
/// GST 900, due on the 10th; penalty rule Percentage 2% with 5 grace days; today and the payment
/// date are 2026-09-30, so each month's penalty is 100, each month totals 6000 and 18000 is pending.
/// </summary>
[Trait("Category", "Integration")]
public class LeaseRentBillingServiceIntegrationTests : IAsyncLifetime
{
    private const int UserId = 42;
    private const int AssetId = 10;
    private static readonly DateTime PaymentDate = new(2026, 9, 30);

    private readonly List<ApplicationDbContext> _contexts = new();
    private readonly InMemoryNumberGenerator _numbers = new();
    private readonly Mock<TimeProvider> _clock = new();
    private DbContextOptions<ApplicationDbContext> _options = null!;

    private int _leaseId;
    private int _julId, _augId, _sepId;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"LeaseRentBillingServiceIntegrationTests_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;

        SetNow(new DateTimeOffset(2026, 9, 30, 12, 0, 0, TimeSpan.Zero));

        await using var context = new ApplicationDbContext(_options);
        await context.Database.EnsureCreatedAsync();

        context.Set<PenaltyRuleMasterEntity>().Add(PercentageRule());
        var lease = NewLease();
        context.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await context.SaveChangesAsync();
        _leaseId = lease.Id;

        var demands = new[] { NewDemand(_leaseId, 7), NewDemand(_leaseId, 8), NewDemand(_leaseId, 9) };
        context.Set<MonthWiseDemandEntity>().AddRange(demands);
        await context.SaveChangesAsync();
        (_julId, _augId, _sepId) = (demands[0].Id, demands[1].Id, demands[2].Id);
    }

    public async Task DisposeAsync()
    {
        foreach (var context in _contexts)
            await context.DisposeAsync();

        await using var cleanup = new ApplicationDbContext(_options);
        await cleanup.Database.EnsureDeletedAsync();
    }

    #region Fixture

    private void SetNow(DateTimeOffset utcNow)
    {
        _clock.Setup(c => c.GetUtcNow()).Returns(utcNow);
        _clock.Setup(c => c.LocalTimeZone).Returns(TimeZoneInfo.Utc);
    }

    private static PenaltyRuleMasterEntity PercentageRule() => new()
    {
        PenaltyCode = "LATE2PCT",
        PenaltyName = "Late payment 2%",
        CalculationType = "Percentage",
        PenaltyValue = 2m,
        GracePeriodDays = 5,
        IsActive = true,
        CreatedDate = DateTime.Now
    };

    private static AssetLeaseRentDetailsEntity NewLease(string workflowStatus = "Approved", decimal advanceBalance = 0m) => new()
    {
        AssetId = AssetId,
        TenantName = "Ramesh Patil",
        TenantMobile = "9876543210",
        LeaseType = "Rent",
        LeaseStartDate = new DateTime(2026, 4, 1),
        RentAmount = 5000m,
        PaymentFrequency = "Monthly",
        WorkflowStatus = workflowStatus,
        AdvanceBalance = advanceBalance,
        IsActive = true,
        CreatedDate = DateTime.Now
    };

    private static MonthWiseDemandEntity NewDemand(int leaseId, byte month, string status = "Pending", decimal paid = 0m) => new()
    {
        AssetId = AssetId,
        LeaseRegistrationId = leaseId,
        FinanceYear = 2026,
        DemandYear = 2026,
        QuarterNo = (byte)(month <= 6 ? 1 : month <= 9 ? 2 : month <= 12 ? 3 : 4),
        DemandMonth = month,
        MonthlyRentAmount = 5000m,
        GSTAmount = 900m,
        PenaltyAmount = 0m,
        PaidAmount = paid,
        DemandStatus = status,
        DueDate = new DateTime(2026, month, 10),
        IsActive = true,
        CreatedDate = DateTime.Now
    };

    private async Task<int> SeedLeaseAsync(string workflowStatus = "Approved", decimal advanceBalance = 0m, params (byte Month, string Status)[] demands)
    {
        await using var context = new ApplicationDbContext(_options);
        var lease = NewLease(workflowStatus, advanceBalance);
        context.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await context.SaveChangesAsync();

        foreach (var (month, status) in demands)
            context.Set<MonthWiseDemandEntity>().Add(NewDemand(lease.Id, month, status, paid: status == "Paid" ? 5900m : 0m));
        await context.SaveChangesAsync();
        return lease.Id;
    }

    private async Task SetWalletAsync(decimal advanceBalance, int? leaseId = null)
    {
        await using var context = new ApplicationDbContext(_options);
        var lease = await context.Set<AssetLeaseRentDetailsEntity>().SingleAsync(l => l.Id == (leaseId ?? _leaseId));
        lease.AdvanceBalance = advanceBalance;
        await context.SaveChangesAsync();
    }

    private LeaseRentBillingService CreateService(ILeaseRentNumberGenerator? numbers = null)
    {
        var context = new ApplicationDbContext(_options);
        _contexts.Add(context);

        return new LeaseRentBillingService(
            new Repository<LeaseRentBillTransactionEntity, int>(context),
            new Repository<LeaseRentBillTransactionDetailEntity, int>(context),
            new Repository<MonthWiseDemandEntity, int>(context),
            new Repository<AssetLeaseRentDetailsEntity, int>(context),
            new Repository<PenaltyRuleMasterEntity, int>(context),
            new Repository<ChequePaymentTransactionEntity, int>(context),
            numbers ?? _numbers,
            new UnitOfWork(context),
            _clock.Object);
    }

    private static CreateBillPaymentDto Request(
        string paymentType, decimal paidAmount, string paymentMode = "Cash", decimal customAmount = 0m,
        decimal adjustmentAmount = 0m, DateTime? paymentDate = null, params int[] demandIds)
    {
        var dto = new CreateBillPaymentDto
        {
            PaymentType = paymentType,
            PaymentMode = paymentMode,
            PaymentDate = paymentDate ?? PaymentDate,
            PayerMobile = "9876543210",
            PaidAmount = paidAmount,
            CustomAmount = customAmount,
            AdjustmentAmount = adjustmentAmount,
            Allocations = demandIds.Select(id => new BillPaymentAllocationDto { MonthWiseDemandId = id }).ToList()
        };

        if (paymentMode is "Cheque" or "DD" or "NEFT" or "RTGS")
        {
            dto.BankName = "HDFC";
            dto.BranchName = "Deccan";
            dto.ChequeOrTransactionNo = "004512";
            dto.ChequeDate = new DateTime(2026, 9, 28);
        }
        if (paymentMode == "DD")
            dto.DDPayeeName = "Municipal Corporation";

        return dto;
    }

    private Task<BillReceiptDto> PayAsync(CreateBillPaymentDto dto, int? leaseId = null)
        => CreateService().ProcessPaymentAsync(leaseId ?? _leaseId, dto, UserId);

    private Task<ChequeAcknowledgementDto> StageChequeAsync(CreateBillPaymentDto dto)
        => CreateService().ProcessChequePaymentAsync(_leaseId, dto, UserId);

    private Task SetChequeStatusAsync(int chequeId, string status, string? reason = null)
        => CreateService().UpdateChequeStatusAsync(_leaseId, chequeId, new UpdateChequeStatusDto { Status = status, Reason = reason }, UserId);

    private static async Task<string> ExpectRejectedAsync(Func<Task> act)
        => (await Assert.ThrowsAsync<PaymentRuleException>(act)).Message;

    private async Task<T> ReadAsync<T>(Func<ApplicationDbContext, Task<T>> query)
    {
        await using var context = new ApplicationDbContext(_options);
        return await query(context);
    }

    private Task<MonthWiseDemandEntity> DemandAsync(int demandId)
        => ReadAsync(c => c.Set<MonthWiseDemandEntity>().AsNoTracking().SingleAsync(d => d.Id == demandId));

    private Task<decimal> WalletAsync(int? leaseId = null)
        => ReadAsync(c => c.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().Where(l => l.Id == (leaseId ?? _leaseId)).Select(l => l.AdvanceBalance).SingleAsync());

    private Task<List<LeaseRentBillTransactionEntity>> HeadersAsync()
        => ReadAsync(c => c.Set<LeaseRentBillTransactionEntity>().AsNoTracking().OrderBy(t => t.Id).ToListAsync());

    private Task<List<LeaseRentBillTransactionDetailEntity>> DetailsAsync()
        => ReadAsync(c => c.Set<LeaseRentBillTransactionDetailEntity>().AsNoTracking().OrderBy(d => d.Id).ToListAsync());

    private async Task AssertNothingPostedAsync()
    {
        Assert.Empty(await HeadersAsync());
        Assert.Empty(await DetailsAsync());
        foreach (var id in new[] { _julId, _augId, _sepId })
        {
            var demand = await DemandAsync(id);
            Assert.Equal(0m, demand.PaidAmount);
            Assert.Equal(0m, demand.PenaltyAmount);
            Assert.Equal("Pending", demand.DemandStatus);
        }
        Assert.Equal(0m, await WalletAsync());
    }

    #endregion

    #region Full, Partial, Monthwise, Advance (§11 rows 1–13)

    [Fact] // §11 #1
    public async Task Full_Cash_PaysAllThreeMonths()
    {
        var receipt = await PayAsync(Request("Full", 18000m));

        Assert.Equal("TXN-2026-000001", receipt.TransactionNo);
        Assert.Equal("RCPT-2026-000001", receipt.ReceiptNo);
        Assert.Equal("Full", receipt.PaymentType);
        Assert.Equal(PaymentDate, receipt.PaymentDate);
        Assert.Equal(18000m, receipt.TotalDemandAmount);
        Assert.Equal(18000m, receipt.NetPayableAmount);
        Assert.Equal(18000m, receipt.PaidAmount);
        Assert.Equal("Ramesh Patil", receipt.TenantName);
        Assert.Equal(new[] { _julId, _augId, _sepId }, receipt.Lines.Select(l => l.MonthWiseDemandId));
        Assert.All(receipt.Lines, l =>
        {
            Assert.Equal(6000m, l.CurrentPaidAmount);
            Assert.Equal(0m, l.BalanceAmount);
            Assert.Equal("Paid", l.PaymentStatus);
        });

        var header = Assert.Single(await HeadersAsync());
        Assert.Equal(receipt.TransactionId, header.Id);
        Assert.Equal(receipt.Uuid, header.Uuid);
        Assert.NotEqual(Guid.Empty, header.Uuid);
        Assert.Equal((15000m, 300m, 2700m), (header.TotalMonthlyRentAmount, header.TotalPenaltyAmount, header.TotalGSTAmount));
        Assert.Equal(18000m, header.PaidAmount);
        Assert.Equal(("Cash", "Success", 2026, AssetId, (int?)UserId), (header.PaymentMode, header.PaymentStatus, header.FinanceYear, header.AssetId, header.CreatedBy));

        var details = await DetailsAsync();
        Assert.Equal(3, details.Count);
        Assert.All(details, d =>
        {
            Assert.Equal(header.Id, d.LeaseRentBillTransactionId);
            Assert.Equal((5000m, 100m, 900m), (d.MonthlyRentAmount, d.PenaltyAmount, d.GSTAmount));
            Assert.Equal((0m, 6000m, 0m, "Paid"), (d.PreviousPaidAmount, d.CurrentPaidAmount, d.BalanceAmount, d.PaymentStatus));
            Assert.Equal(((byte)2, 2026), (d.QuarterNo, d.FinanceYear));
        });

        foreach (var id in new[] { _julId, _augId, _sepId })
        {
            var demand = await DemandAsync(id);
            Assert.Equal((6000m, 100m, "Paid"), (demand.PaidAmount, demand.PenaltyAmount, demand.DemandStatus));
            Assert.Equal(PaymentDate, demand.LastPaymentDate);
            Assert.Equal(UserId, demand.UpdatedBy);
        }
        Assert.Equal(0m, await WalletAsync());
    }

    [Fact] // §11 #2
    public async Task Full_Overpaid_CreditsExcessToWallet()
    {
        await PayAsync(Request("Full", 20000m));

        Assert.Equal(2000m, await WalletAsync());
        Assert.Equal(20000m, Assert.Single(await HeadersAsync()).PaidAmount);
    }

    [Fact] // §11 #3
    public async Task Full_Underpaid_IsRejected()
    {
        Assert.Equal("Payment_Insufficient_Funds", await ExpectRejectedAsync(() => PayAsync(Request("Full", 17000m))));
        await AssertNothingPostedAsync();
    }

    [Fact] // §11 #4
    public async Task Partial_DistributesOldestFirst()
    {
        var receipt = await PayAsync(Request("Partial", 8000m, "UPI", customAmount: 8000m));

        Assert.Equal(2, receipt.Lines.Count);
        var jul = await DemandAsync(_julId);
        Assert.Equal((6000m, "Paid"), (jul.PaidAmount, jul.DemandStatus));
        var aug = await DemandAsync(_augId);
        Assert.Equal((2000m, "Partial"), (aug.PaidAmount, aug.DemandStatus));
        Assert.Equal(4000m, receipt.Lines[1].BalanceAmount);

        // Sep isn't reached: untouched, including its stored penalty.
        var sep = await DemandAsync(_sepId);
        Assert.Equal((0m, 0m, "Pending"), (sep.PaidAmount, sep.PenaltyAmount, sep.DemandStatus));
        Assert.Null(sep.LastPaymentDate);

        // Header totals are the gross of the months touched.
        Assert.Equal(12000m, receipt.TotalDemandAmount);
        Assert.Equal(0m, await WalletAsync());
    }

    [Fact] // §11 #5 (D1)
    public async Task Partial_CustomAmountNotCoveredByMoney_IsRejected()
    {
        Assert.Equal("Payment_Insufficient_Funds",
            await ExpectRejectedAsync(() => PayAsync(Request("Partial", 100m, customAmount: 8000m))));
        await AssertNothingPostedAsync();
    }

    [Fact] // §11 #6
    public async Task Partial_CustomAmountAbovePending_IsRejected()
    {
        Assert.Equal("Payment_Amount_Exceeds_Pending",
            await ExpectRejectedAsync(() => PayAsync(Request("Partial", 19000m, customAmount: 19000m))));
    }

    [Fact] // §11 #7 (D2)
    public async Task Partial_OverpaidCustomAmount_CreditsExcessToWallet()
    {
        var receipt = await PayAsync(Request("Partial", 5000m, customAmount: 3000m));

        var jul = await DemandAsync(_julId);
        Assert.Equal((3000m, "Partial"), (jul.PaidAmount, jul.DemandStatus));
        Assert.Equal(3000m, Assert.Single(receipt.Lines).CurrentPaidAmount);
        Assert.Equal(2000m, await WalletAsync());
    }

    [Fact] // §11 #8
    public async Task Monthwise_PaysOnlySelectedMonth()
    {
        var receipt = await PayAsync(Request("Monthwise", 6000m, demandIds: _augId));

        Assert.Equal(_augId, Assert.Single(receipt.Lines).MonthWiseDemandId);
        Assert.Equal("Paid", (await DemandAsync(_augId)).DemandStatus);
        Assert.Equal("Pending", (await DemandAsync(_julId)).DemandStatus);
        Assert.Equal("Pending", (await DemandAsync(_sepId)).DemandStatus);
        Assert.Equal(0m, (await DemandAsync(_julId)).PenaltyAmount);
    }

    [Fact] // §11 #9
    public async Task Monthwise_DuplicateIds_IsRejected()
    {
        Assert.Equal("Payment_DuplicateAllocation",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 12000m, demandIds: new[] { _julId, _julId }))));
    }

    [Fact] // §11 #9
    public async Task Monthwise_AnotherLeasesDemand_IsRejected()
    {
        var otherLeaseId = await SeedLeaseAsync(demands: ((byte)7, "Pending"));
        var otherDemandId = await ReadAsync(c => c.Set<MonthWiseDemandEntity>().Where(d => d.LeaseRegistrationId == otherLeaseId).Select(d => d.Id).SingleAsync());

        Assert.Equal("Payment_Demand_LeaseMismatch",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 6000m, demandIds: otherDemandId))));
    }

    [Fact] // §11 #9
    public async Task Monthwise_AlreadyPaidMonth_IsRejected()
    {
        await PayAsync(Request("Monthwise", 6000m, demandIds: _julId));

        Assert.Equal("Payment_Demand_AlreadyPaid",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 6000m, demandIds: _julId))));
    }

    [Fact]
    public async Task Monthwise_UnknownDemand_IsNotFound()
    {
        var ex = await Assert.ThrowsAsync<PaymentNotFoundException>(
            () => PayAsync(Request("Monthwise", 6000m, demandIds: 99999)));
        Assert.Equal("Payment_Demand_NotFound", ex.Message);
    }

    [Fact]
    public async Task Monthwise_CancelledDemand_IsNotPayable()
    {
        await using (var context = new ApplicationDbContext(_options))
        {
            var jul = await context.Set<MonthWiseDemandEntity>().SingleAsync(d => d.Id == _julId);
            jul.DemandStatus = "Cancelled";
            await context.SaveChangesAsync();
        }

        Assert.Equal("Payment_Demand_NotPayable",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 6000m, demandIds: _julId))));
    }

    [Fact] // D10
    public async Task Monthwise_ProcessesMonthsOldestFirst_WhateverTheClientOrder()
    {
        var receipt = await PayAsync(Request("Monthwise", 12000m, demandIds: new[] { _sepId, _julId }));

        Assert.Equal(new[] { _julId, _sepId }, receipt.Lines.Select(l => l.MonthWiseDemandId));
        Assert.Equal(new[] { _julId, _sepId }, (await DetailsAsync()).Select(d => d.MonthWiseDemandId));
    }

    [Fact] // §11 #10 (D3)
    public async Task WalletOnlyPayment_SpendsExactlyTheWallet()
    {
        await SetWalletAsync(6000m);

        var receipt = await PayAsync(Request("Monthwise", 0m, adjustmentAmount: -6000m, demandIds: _julId));

        Assert.Equal("Paid", (await DemandAsync(_julId)).DemandStatus);
        Assert.Equal(0m, await WalletAsync());
        Assert.Equal(0m, Assert.Single(await HeadersAsync()).PaidAmount);
        Assert.Equal(0m, receipt.NetPayableAmount); // 6000 + (-6000)
    }

    [Fact]
    public async Task PositiveAdjustment_IsRejected_ForCounterPaymentAndCheque()
    {
        Assert.Equal("Payment_AdjustmentAmount_Invalid",
            await ExpectRejectedAsync(() => PayAsync(Request("Full", 18100m, adjustmentAmount: 100m))));
        Assert.Equal("Payment_AdjustmentAmount_Invalid",
            await ExpectRejectedAsync(() => StageChequeAsync(Request("Full", 18100m, paymentMode: "Cheque", adjustmentAmount: 100m))));

        await AssertNothingPostedAsync();
        Assert.Equal(0, await ReadAsync(db => db.Set<ChequePaymentTransactionEntity>().CountAsync()));
    }

    [Fact] // §11 #11
    public async Task Adjustment_BeyondWallet_IsRejected()
    {
        await SetWalletAsync(6000m);

        Assert.Equal("Payment_Adjustment_Exceeds_Advance",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 0m, adjustmentAmount: -7000m, demandIds: _julId))));
        Assert.Equal(6000m, await WalletAsync());
    }

    [Fact]
    public async Task ZeroMoney_IsRejected()
    {
        Assert.Equal("Payment_Zero_Amount_Not_Allowed",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 0m, demandIds: _julId))));
    }

    [Fact] // §11 #12
    public async Task Advance_WithNothingPending_TopsUpTheWallet()
    {
        var leaseId = await SeedLeaseAsync(demands: new[] { ((byte)7, "Paid"), ((byte)8, "Paid") });

        var receipt = await PayAsync(Request("Advance", 5000m), leaseId);

        Assert.Empty(receipt.Lines);
        Assert.Equal(0m, receipt.TotalDemandAmount);
        var header = Assert.Single(await HeadersAsync());
        Assert.Equal((5000m, 2026), (header.PaidAmount, header.FinanceYear));
        Assert.Empty(await DetailsAsync());
        Assert.Equal(5000m, await WalletAsync(leaseId));
    }

    [Fact] // §11 #13 (D1)
    public async Task Advance_WithPendingDues_MustCoverThem()
    {
        Assert.Equal("Payment_Insufficient_Funds", await ExpectRejectedAsync(() => PayAsync(Request("Advance", 100m))));
        await AssertNothingPostedAsync();
    }

    [Fact]
    public async Task Advance_WithPendingDues_SettlesThemAndCreditsTheRest()
    {
        await PayAsync(Request("Advance", 20000m));

        Assert.Equal(3, (await DetailsAsync()).Count);
        Assert.Equal(2000m, await WalletAsync());
    }

    [Fact]
    public async Task Advance_WithoutCash_IsRejected()
    {
        var leaseId = await SeedLeaseAsync(advanceBalance: 1000m, demands: ((byte)7, "Paid"));

        Assert.Equal("Payment_Advance_Requires_Cash",
            await ExpectRejectedAsync(() => PayAsync(Request("Advance", 0m, adjustmentAmount: -500m), leaseId)));
    }

    [Fact]
    public async Task Full_WithNothingPending_IsRejected()
    {
        var leaseId = await SeedLeaseAsync(demands: ((byte)7, "Paid"));

        Assert.Equal("Payment_NoPendingDemands", await ExpectRejectedAsync(() => PayAsync(Request("Full", 6000m), leaseId)));
    }

    [Fact] // §11 #27
    public async Task Full_IgnoresSwaggerPlaceholderAllocation()
    {
        var dto = Request("Full", 18000m);
        dto.Allocations = new List<BillPaymentAllocationDto> { new() { MonthWiseDemandId = 0, PayAmount = 0m } };

        var receipt = await PayAsync(dto);

        Assert.Equal(3, receipt.Lines.Count);
    }

    [Fact] // D2
    public async Task Discount_IsRecordedOnly_NotDeductedFromDues_NorCredited()
    {
        var dto = Request("Full", 18000m);
        dto.DiscountAmount = 500m;

        var receipt = await PayAsync(dto);

        Assert.Equal(500m, receipt.DiscountAmount);
        Assert.Equal(18000m, receipt.NetPayableAmount); // the discount isn't subtracted: 18000 was required
        Assert.Equal(receipt.PaidAmount, receipt.NetPayableAmount);
        Assert.Equal(500m, Assert.Single(await HeadersAsync()).DiscountAmount);
        Assert.Equal(0m, await WalletAsync());

        // ...and it doesn't lower what must be paid.
        var other = await SeedLeaseAsync(demands: ((byte)9, "Pending"));
        var short500 = Request("Full", 5500m);
        short500.DiscountAmount = 500m;
        Assert.Equal("Payment_Insufficient_Funds", await ExpectRejectedAsync(() => PayAsync(short500, other)));
    }

    [Fact]
    public async Task CounterPayment_RecordsTheLeaseAndTenantItsReceiptPrints()
    {
        await PayAsync(Request("Full", 18000m));

        var header = Assert.Single(await HeadersAsync());
        Assert.Equal(("Ramesh Patil", "9876543210"), (header.Snap_TenantName, header.Snap_TenantMobile));
        Assert.Equal((new DateTime(2026, 4, 1), (DateTime?)null), (header.Snap_LeaseStartDate!.Value, header.Snap_LeaseEndDate));
        Assert.Equal((5000m, 0m), (header.Snap_RentAmount!.Value, header.Snap_SecurityDeposit!.Value));
        Assert.Null(header.Snap_AgreementId);
    }

    #endregion

    #region Exact amounts (no rounding slack)

    [Fact]
    public async Task OnePaisaShort_IsRejected()
    {
        Assert.Equal("Payment_Insufficient_Funds", await ExpectRejectedAsync(() => PayAsync(Request("Full", 17999.99m))));
        await AssertNothingPostedAsync();
    }

    [Fact]
    public async Task OnePaisaLeftOnAMonth_KeepsItPartial_AndCollectable()
    {
        var receipt = await PayAsync(Request("Partial", 5999.99m, customAmount: 5999.99m));

        var line = Assert.Single(receipt.Lines);
        Assert.Equal((_julId, 0.01m, "Partial"), (line.MonthWiseDemandId, line.BalanceAmount, line.PaymentStatus));
        var july = await DemandAsync(_julId);
        Assert.Equal((5999.99m, "Partial"), (july.PaidAmount, july.DemandStatus));

        // The paisa is still pending, so it can be paid.
        await PayAsync(Request("Monthwise", 0.01m, demandIds: _julId));
        Assert.Equal("Paid", (await DemandAsync(_julId)).DemandStatus);
    }

    [Fact]
    public async Task OnePaisaOverpayment_IsCreditedToTheWallet()
    {
        await PayAsync(Request("Full", 18000.01m));

        Assert.Equal(0.01m, await WalletAsync());
    }

    [Fact]
    public async Task CustomAmount_OnePaisaOverPending_IsRejected()
    {
        Assert.Equal("Payment_Amount_Exceeds_Pending",
            await ExpectRejectedAsync(() => PayAsync(Request("Partial", 18000.01m, customAmount: 18000.01m))));
    }

    [Fact]
    public async Task Adjustment_OnePaisaBeyondWallet_IsRejected()
    {
        await SetWalletAsync(6000m);

        Assert.Equal("Payment_Adjustment_Exceeds_Advance",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 0m, adjustmentAmount: -6000.01m, demandIds: _julId))));
    }

    [Fact]
    public async Task AmountWithAFractionOfAPaisa_IsRejected_NotRounded()
    {
        Assert.Equal("Payment_PaidAmount_MaxDecimals_2", await ExpectRejectedAsync(() => PayAsync(Request("Full", 17999.995m))));
        Assert.Equal("Payment_PaidAmount_MaxDecimals_2",
            await ExpectRejectedAsync(() => StageChequeAsync(ChequeRequest(paidAmount: 18000.001m))));
        await AssertNothingPostedAsync();
    }

    #endregion

    #region Partial narrowing (D11)

    [Fact]
    public async Task Partial_WithAllocations_NarrowsTheDistribution()
    {
        var receipt = await PayAsync(Request("Partial", 6000m, customAmount: 6000m, demandIds: _sepId));

        Assert.Equal(_sepId, Assert.Single(receipt.Lines).MonthWiseDemandId);
        Assert.Equal("Paid", (await DemandAsync(_sepId)).DemandStatus);
        Assert.Equal("Pending", (await DemandAsync(_julId)).DemandStatus);
    }

    [Fact]
    public async Task Partial_WithAllocationOutsideThePendingDemands_IsRejected()
    {
        var otherLeaseId = await SeedLeaseAsync(demands: ((byte)7, "Pending"));
        var otherDemandId = await ReadAsync(c => c.Set<MonthWiseDemandEntity>().Where(d => d.LeaseRegistrationId == otherLeaseId).Select(d => d.Id).SingleAsync());

        Assert.Equal("Payment_Allocation_Invalid",
            await ExpectRejectedAsync(() => PayAsync(Request("Partial", 6000m, customAmount: 6000m, demandIds: new[] { _sepId, otherDemandId }))));
        Assert.Equal("Payment_Allocation_Invalid",
            await ExpectRejectedAsync(() => PayAsync(Request("Partial", 6000m, customAmount: 6000m, demandIds: 99999))));
    }

    [Fact]
    public async Task Partial_PlaceholderAllocation_IsIgnored()
    {
        var receipt = await PayAsync(Request("Partial", 8000m, customAmount: 8000m, demandIds: 0));

        Assert.Equal(new[] { _julId, _augId }, receipt.Lines.Select(l => l.MonthWiseDemandId));
    }

    #endregion

    #region Lease, date, mode guards (§11 rows 14, 20, 26)

    [Fact] // §11 #14
    public async Task LeaseNotApproved_IsRejected()
    {
        var leaseId = await SeedLeaseAsync(workflowStatus: "Pending", demands: ((byte)7, "Pending"));

        Assert.Equal("Payment_LeaseNotApproved", await ExpectRejectedAsync(() => PayAsync(Request("Full", 6000m), leaseId)));
    }

    [Fact] // §11 #14
    public async Task UnknownLease_IsNotFound()
    {
        var ex = await Assert.ThrowsAsync<PaymentNotFoundException>(() => PayAsync(Request("Full", 6000m), 99999));
        Assert.Equal("LeaseRent_NotFound", ex.Message);
    }

    [Fact] // §11 #20 (D4)
    public async Task Online_IsNotAllowedAtTheCounter_WhateverItsStatus()
    {
        foreach (var status in new[] { "Success", "Pending", "Failed", null })
        {
            var dto = Request("Full", 18000m, "Online");
            dto.PaymentGatewayName = "Razorpay";
            dto.PaymentStatus = status;

            Assert.Equal("Payment_Online_NotAllowed", await ExpectRejectedAsync(() => PayAsync(dto)));
        }
        await AssertNothingPostedAsync();
    }

    [Theory] // §11 #26 (D9)
    [InlineData("2026-10-01")] // tomorrow
    [InlineData("2026-03-31")] // before the lease start
    public async Task PaymentDate_InTheFutureOrBeforeLeaseStart_IsRejected(string paymentDate)
    {
        Assert.Equal("Payment_PaymentDate_Invalid",
            await ExpectRejectedAsync(() => PayAsync(Request("Full", 18000m, paymentDate: DateTime.Parse(paymentDate)))));
    }

    public static TheoryData<Action<CreateBillPaymentDto>, string> InvalidRequests => new()
    {
        { d => d.PaymentDate = null, "Payment_PaymentDate_Required" },
        { d => { d.PaymentMode = "DD"; d.BankName = "SBI"; d.ChequeDate = PaymentDate; }, "Payment_DDPayeeName_Required" },
        { d => { d.PaymentMode = "NEFT"; d.ChequeDate = PaymentDate; }, "Payment_BankName_Required" },
        { d => { d.PaymentMode = "NEFT"; d.BankName = "SBI"; }, "Payment_ChequeDate_Required" },
        { d => d.PayerMobile = "987654321", "Payment_PayerMobile_Invalid" },
        { d => d.PaymentType = "Monthwise", "Payment_Allocations_Required" },
        { d => d.PaymentType = "Partial", "Payment_CustomAmount_Required" },
    };

    [Theory] // §11 #26: the service re-runs the request's own validation, so direct callers get the same codes
    [MemberData(nameof(InvalidRequests))]
    public async Task InvalidRequest_IsRejectedWithItsValidationCode(Action<CreateBillPaymentDto> breakIt, string expectedCode)
    {
        var dto = Request("Full", 18000m);
        breakIt(dto);

        Assert.Equal(expectedCode, await ExpectRejectedAsync(() => PayAsync(dto)));
    }

    [Fact]
    public async Task ChequeMode_OnImmediatePath_IsRejected()
    {
        Assert.Equal("Payment_Cheque_UseProcessChequePaymentAsync",
            await ExpectRejectedAsync(() => PayAsync(Request("Full", 18000m, "Cheque"))));
    }

    [Fact]
    public async Task NonChequeMode_OnChequePath_IsRejected()
    {
        Assert.Equal("Payment_PaymentMode_Invalid", await ExpectRejectedAsync(() => StageChequeAsync(Request("Full", 18000m))));
    }

    #endregion

    #region Penalty (§11 rows 23, 24)

    [Fact] // §11 #23
    public async Task Penalty_InsideGracePeriod_IsZero()
    {
        SetNow(new DateTimeOffset(2026, 9, 14, 12, 0, 0, TimeSpan.Zero));

        var receipt = await PayAsync(Request("Monthwise", 5900m, paymentDate: new DateTime(2026, 9, 14), demandIds: _sepId));

        Assert.Equal(5900m, receipt.TotalDemandAmount);
        Assert.Equal(0m, (await DemandAsync(_sepId)).PenaltyAmount);
        Assert.Equal("Paid", (await DemandAsync(_sepId)).DemandStatus);
    }

    [Fact] // §11 #24
    public async Task Penalty_PerDay_ChargesDaysBeyondGrace()
    {
        // The single active rule with the highest Id applies.
        await using (var context = new ApplicationDbContext(_options))
        {
            context.Set<PenaltyRuleMasterEntity>().Add(new PenaltyRuleMasterEntity
            {
                PenaltyCode = "LATEPERDAY",
                PenaltyName = "Late payment per day",
                CalculationType = "PerDay",
                PenaltyValue = 10m,
                GracePeriodDays = 5,
                IsActive = true,
                CreatedDate = DateTime.Now
            });
            await context.SaveChangesAsync();
        }

        var receipt = await PayAsync(Request("Monthwise", 6050m, demandIds: _sepId));

        Assert.Equal(150m, (await DemandAsync(_sepId)).PenaltyAmount); // (30 - 10 - 5) days x 10
        Assert.Equal(6050m, receipt.TotalDemandAmount);
    }

    [Fact]
    public async Task Penalty_WithNoActiveRule_IsZero()
    {
        await using (var context = new ApplicationDbContext(_options))
        {
            foreach (var rule in context.Set<PenaltyRuleMasterEntity>())
                rule.IsActive = false;
            await context.SaveChangesAsync();
        }

        var receipt = await PayAsync(Request("Full", 17700m));

        Assert.Equal(17700m, receipt.TotalDemandAmount);
    }

    #endregion

    #region Cheque (§11 rows 15–19, D7, D8)

    private CreateBillPaymentDto ChequeRequest(string paymentType = "Full", decimal paidAmount = 18000m, decimal adjustmentAmount = 0m, params int[] demandIds)
        => Request(paymentType, paidAmount, "Cheque", adjustmentAmount: adjustmentAmount, demandIds: demandIds);

    private Task<ChequePaymentTransactionEntity> ChequeAsync(int chequeId)
        => ReadAsync(c => c.Set<ChequePaymentTransactionEntity>().AsNoTracking().SingleAsync(x => x.Id == chequeId));

    [Fact] // §11 #15 (D8)
    public async Task Cheque_IsStaged_NothingPosted()
    {
        var ack = await StageChequeAsync(ChequeRequest());

        Assert.Equal("CHQ-2026-000001", ack.AcknowledgementNo);
        Assert.Equal(("Received", "Full", 18000m), (ack.Status, ack.PaymentType, ack.PaidAmount));
        Assert.Equal(("HDFC", "004512", new DateTime(2026, 9, 28)), (ack.BankName, ack.ChequeOrTransactionNo, ack.ChequeDate));
        Assert.NotEqual(Guid.Empty, ack.Uuid);

        var cheque = await ChequeAsync(ack.Id);
        Assert.Equal((15000m, 300m, 2700m), (cheque.TotalMonthlyRentAmount, cheque.TotalPenaltyAmount, cheque.TotalGSTAmount));
        Assert.Equal((2026, PaymentDate, (int?)UserId), (cheque.FinanceYear, cheque.PaymentDate, cheque.CreatedBy));

        using var allocations = JsonDocument.Parse(cheque.AllocationsJson);
        var items = allocations.RootElement.EnumerateArray().ToList();
        Assert.Equal(new[] { _julId, _augId, _sepId }, items.Select(i => i.GetProperty("MonthWiseDemandId").GetInt32()));
        Assert.All(items, i =>
        {
            Assert.Equal(6000m, i.GetProperty("PayAmount").GetDecimal());
            Assert.Equal(100m, i.GetProperty("PenaltyAmount").GetDecimal());
            Assert.Equal(6000m, i.GetProperty("OutstandingAmount").GetDecimal());
        });

        // No ledger row; demands (including their penalty) and the wallet untouched.
        await AssertNothingPostedAsync();
    }

    [Fact]
    public async Task Cheque_RecordsWhatAPartPaidMonthStillOwedAtIntake_AndStillClears()
    {
        await PayAsync(Request("Partial", 2000m, customAmount: 2000m)); // July: 2000 of its 6000 paid

        var ack = await StageChequeAsync(ChequeRequest("Monthwise", 4000m, demandIds: _julId));

        var staged = JsonSerializer.Deserialize<List<ChequeAllocation>>((await ChequeAsync(ack.Id)).AllocationsJson)!;
        var july = Assert.Single(staged);
        Assert.Equal(_julId, july.MonthWiseDemandId);
        Assert.Equal(4000m, july.PayAmount);
        Assert.Equal(4000m, july.OutstandingAmount); // not July's gross 6000

        await SetChequeStatusAsync(ack.Id, "Deposited");
        await SetChequeStatusAsync(ack.Id, "Cleared");

        var demand = await DemandAsync(_julId);
        Assert.Equal((6000m, "Paid"), (demand.PaidAmount, demand.DemandStatus));
    }

    [Fact]
    public async Task Cheque_LeaseRecordedAtIntake_CarriesOverWhenItClears_EvenAfterTheLeaseIsEdited()
    {
        var ack = await StageChequeAsync(ChequeRequest());
        var staged = await ChequeAsync(ack.Id);
        Assert.Equal(("Ramesh Patil", 5000m), (staged.Snap_TenantName, staged.Snap_RentAmount!.Value));

        // The lease is edited (new tenant, new rent) while the cheque is with the bank.
        await using (var context = new ApplicationDbContext(_options))
        {
            var lease = await context.Set<AssetLeaseRentDetailsEntity>().SingleAsync(l => l.Id == _leaseId);
            lease.TenantName = "Suresh Kale";
            lease.TenantMobile = "9000000001";
            lease.RentAmount = 7000m;
            await context.SaveChangesAsync();
        }

        await SetChequeStatusAsync(ack.Id, "Deposited");
        await SetChequeStatusAsync(ack.Id, "Cleared");

        var header = Assert.Single(await HeadersAsync());
        Assert.Equal(("Ramesh Patil", "9876543210", 5000m),
            (header.Snap_TenantName, header.Snap_TenantMobile, header.Snap_RentAmount!.Value));
    }

    [Fact] // §11 #16
    public async Task Cheque_ReceivedStraightToCleared_IsRejected()
    {
        var ack = await StageChequeAsync(ChequeRequest());

        Assert.Equal("Payment_ChequeStatus_InvalidTransition", await ExpectRejectedAsync(() => SetChequeStatusAsync(ack.Id, "Cleared")));
        Assert.Equal("Received", (await ChequeAsync(ack.Id)).Status);
    }

    [Fact] // §11 #17
    public async Task Cheque_DepositedThenCleared_PostsTheStagedPayment()
    {
        var ack = await StageChequeAsync(ChequeRequest());
        await SetChequeStatusAsync(ack.Id, "Deposited");
        Assert.Empty(await HeadersAsync());

        // Clearance days later is still priced as at intake.
        SetNow(new DateTimeOffset(2026, 10, 20, 12, 0, 0, TimeSpan.Zero));
        await SetChequeStatusAsync(ack.Id, "Cleared");

        var header = Assert.Single(await HeadersAsync());
        Assert.Equal(("Cheque", "Success", PaymentDate), (header.PaymentMode, header.PaymentStatus, header.PaymentDate));
        Assert.Equal(("HDFC", "Deccan", "004512", (DateTime?)new DateTime(2026, 9, 28)), (header.BankName, header.BranchName, header.ChequeOrTransactionNo, header.ChequeDate));
        Assert.Equal((15000m, 300m, 2700m, 18000m), (header.TotalMonthlyRentAmount, header.TotalPenaltyAmount, header.TotalGSTAmount, header.PaidAmount));
        Assert.Equal(3, (await DetailsAsync()).Count);
        foreach (var id in new[] { _julId, _augId, _sepId })
            Assert.Equal((6000m, 100m, "Paid"), ((await DemandAsync(id)).PaidAmount, (await DemandAsync(id)).PenaltyAmount, (await DemandAsync(id)).DemandStatus));

        var cheque = await ChequeAsync(ack.Id);
        Assert.Equal(("Cleared", (int?)header.Id), (cheque.Status, cheque.LeaseRentBillTransactionId));
        Assert.Equal(0m, await WalletAsync());
    }

    [Fact] // §11 #18
    public async Task Cheque_DepositedThenBounced_PostsNothing_AndIsFinal()
    {
        var ack = await StageChequeAsync(ChequeRequest());
        await SetChequeStatusAsync(ack.Id, "Deposited");
        await SetChequeStatusAsync(ack.Id, "Bounced", "  Insufficient funds ");

        var cheque = await ChequeAsync(ack.Id);
        Assert.Equal(("Bounced", "Insufficient funds", (int?)UserId), (cheque.Status, cheque.BounceReason, cheque.UpdatedBy));
        await AssertNothingPostedAsync();

        foreach (var next in new[] { "Deposited", "Cleared", "Bounced" })
            Assert.Equal("Payment_ChequeStatus_InvalidTransition", await ExpectRejectedAsync(() => SetChequeStatusAsync(ack.Id, next)));
    }

    [Fact]
    public async Task Cheque_ReceivedCanBounce_ButClearedIsFinal()
    {
        var bounced = await StageChequeAsync(ChequeRequest("Monthwise", 6000m, demandIds: _julId));
        await SetChequeStatusAsync(bounced.Id, "Bounced");
        Assert.Equal("Bounced", (await ChequeAsync(bounced.Id)).Status);

        var cleared = await StageChequeAsync(ChequeRequest("Monthwise", 6000m, demandIds: _augId));
        await SetChequeStatusAsync(cleared.Id, "Deposited");
        await SetChequeStatusAsync(cleared.Id, "Cleared");
        Assert.Equal("Payment_ChequeStatus_InvalidTransition", await ExpectRejectedAsync(() => SetChequeStatusAsync(cleared.Id, "Bounced")));
    }

    [Fact] // §11 #19 (D7)
    public async Task Cheque_Advance_IsNotSupported()
    {
        Assert.Equal("Payment_Cheque_Advance_NotSupported", await ExpectRejectedAsync(() => StageChequeAsync(ChequeRequest("Advance"))));
    }

    [Fact]
    public async Task Cheque_Clearance_RevalidatesAgainstPaymentsMadeMeanwhile()
    {
        var ack = await StageChequeAsync(ChequeRequest("Monthwise", 6000m, demandIds: _julId));
        await SetChequeStatusAsync(ack.Id, "Deposited");
        await PayAsync(Request("Monthwise", 6000m, demandIds: _julId)); // Jul paid in cash first

        Assert.Equal("Payment_Amount_Exceeds_Pending", await ExpectRejectedAsync(() => SetChequeStatusAsync(ack.Id, "Cleared")));
        Assert.Equal("Deposited", (await ChequeAsync(ack.Id)).Status);
        Assert.Single(await HeadersAsync());
    }

    [Fact]
    public async Task Cheque_Clearance_CannotSpendWalletAlreadySpent()
    {
        await SetWalletAsync(6000m);
        var ack = await StageChequeAsync(ChequeRequest("Monthwise", 0m, adjustmentAmount: -6000m, demandIds: _julId));
        await SetChequeStatusAsync(ack.Id, "Deposited");
        await PayAsync(Request("Monthwise", 0m, adjustmentAmount: -6000m, demandIds: _augId)); // wallet spent first

        Assert.Equal("Payment_Adjustment_Exceeds_Advance", await ExpectRejectedAsync(() => SetChequeStatusAsync(ack.Id, "Cleared")));
        Assert.Equal(0m, await WalletAsync());
    }

    [Fact]
    public async Task Cheque_UnknownOrOtherLeasesCheque_IsNotFound()
    {
        var ack = await StageChequeAsync(ChequeRequest());

        var unknown = await Assert.ThrowsAsync<PaymentNotFoundException>(() => SetChequeStatusAsync(99999, "Deposited"));
        Assert.Equal("Payment_Transaction_NotFound", unknown.Message);

        var otherLease = await Assert.ThrowsAsync<PaymentNotFoundException>(() => CreateService()
            .UpdateChequeStatusAsync(_leaseId + 1000, ack.Id, new UpdateChequeStatusDto { Status = "Deposited" }, UserId));
        Assert.Equal("Payment_Transaction_NotFound", otherLease.Message);
    }

    [Fact]
    public async Task ChequeStatus_Invalid_IsRejected()
    {
        var ack = await StageChequeAsync(ChequeRequest());

        Assert.Equal("Payment_ChequeStatus_Invalid", await ExpectRejectedAsync(() => SetChequeStatusAsync(ack.Id, "Received")));
    }

    #endregion

    #region Numbering and concurrency (§11 rows 21, 22 — see also the SQL Server tests)

    [Fact] // §7
    public async Task Numbers_UseTheUtcCalendarYearOfPosting_NotTheFinanceYear()
    {
        SetNow(new DateTimeOffset(2027, 1, 2, 0, 30, 0, TimeSpan.Zero));

        var receipt = await PayAsync(Request("Monthwise", 6000m, demandIds: _julId));
        var second = await PayAsync(Request("Monthwise", 6000m, demandIds: _augId));
        var ack = await StageChequeAsync(ChequeRequest("Monthwise", 6000m, demandIds: _sepId));

        Assert.Equal(("TXN-2027-000001", "RCPT-2027-000001"), (receipt.TransactionNo, receipt.ReceiptNo));
        Assert.Equal(("TXN-2027-000002", "RCPT-2027-000002"), (second.TransactionNo, second.ReceiptNo));
        Assert.Equal("CHQ-2027-000001", ack.AcknowledgementNo);
        Assert.All(await HeadersAsync(), h => Assert.Equal(2026, h.FinanceYear));
    }

    [Fact] // §11 #21 (D6): the other request settles Jul after this one read it
    public async Task ConcurrentPaymentOnTheSameMonth_LosesWith409()
    {
        var numbers = new InMemoryNumberGenerator
        {
            BeforeNext = () => CreateService(_numbers).ProcessPaymentAsync(_leaseId, Request("Monthwise", 6000m, demandIds: _julId), UserId)
        };

        Assert.Equal(LeaseRentBillingService.ConcurrencyConflictCode, await ExpectRejectedAsync(
            () => CreateService(numbers).ProcessPaymentAsync(_leaseId, Request("Monthwise", 6000m, demandIds: _julId), UserId)));
        Assert.Equal((6000m, "Paid"), ((await DemandAsync(_julId)).PaidAmount, (await DemandAsync(_julId)).DemandStatus));
        Assert.Single(await DetailsAsync(), d => d.MonthWiseDemandId == _julId);
    }

    [Fact] // §11 #21: started after the first committed
    public async Task SecondPaymentOnAPaidMonth_IsAlreadyPaid()
    {
        await PayAsync(Request("Monthwise", 6000m, demandIds: _julId));

        Assert.Equal("Payment_Demand_AlreadyPaid",
            await ExpectRejectedAsync(() => PayAsync(Request("Monthwise", 6000m, demandIds: _julId))));
        Assert.Equal(6000m, (await DemandAsync(_julId)).PaidAmount);
    }

    [Fact] // D6: the wallet can't be spent twice
    public async Task ConcurrentWalletSpend_LosesWith409()
    {
        await SetWalletAsync(6000m);
        var numbers = new InMemoryNumberGenerator
        {
            BeforeNext = () => CreateService(_numbers).ProcessPaymentAsync(
                _leaseId, Request("Monthwise", 0m, adjustmentAmount: -6000m, demandIds: _augId), UserId)
        };

        Assert.Equal(LeaseRentBillingService.ConcurrencyConflictCode, await ExpectRejectedAsync(() => CreateService(numbers)
            .ProcessPaymentAsync(_leaseId, Request("Monthwise", 0m, adjustmentAmount: -6000m, demandIds: _julId), UserId)));

        Assert.Equal(0m, await WalletAsync()); // spent once, not driven to -6000
    }

    [Fact] // D6: two clerks clearing the same cheque
    public async Task ConcurrentChequeStatusChange_LosesWith409()
    {
        var ack = await StageChequeAsync(ChequeRequest());
        await SetChequeStatusAsync(ack.Id, "Deposited");
        var numbers = new InMemoryNumberGenerator { BeforeNext = () => SetChequeStatusAsync(ack.Id, "Bounced") };

        Assert.Equal(LeaseRentBillingService.ConcurrencyConflictCode, await ExpectRejectedAsync(() => CreateService(numbers)
            .UpdateChequeStatusAsync(_leaseId, ack.Id, new UpdateChequeStatusDto { Status = "Cleared" }, UserId)));

        Assert.Equal("Bounced", (await ChequeAsync(ack.Id)).Status);
    }

    /// <summary>
    /// In-process stand-in for the SQL number generator. <see cref="BeforeNext"/> runs once, on the next
    /// call — i.e. after the calling payment has read its demands and before it writes anything —
    /// to interleave a competing request.
    /// </summary>
    private sealed class InMemoryNumberGenerator : ILeaseRentNumberGenerator
    {
        private readonly ConcurrentDictionary<(string Key, int Year), int> _counters = new();

        public Func<Task>? BeforeNext { get; set; }

        public async Task<int> NextAsync(string sequenceKey, int year, CancellationToken cancellationToken = default)
        {
            var hook = BeforeNext;
            BeforeNext = null;
            if (hook != null)
                await hook();

            return _counters.AddOrUpdate((sequenceKey, year), 1, (_, value) => value + 1);
        }
    }

    #endregion
}
