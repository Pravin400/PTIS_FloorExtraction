using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Integration tests for <see cref="AssetCounterPaymentService.SearchAsync"/> against a real
/// <see cref="ApplicationDbContext"/> (EF Core InMemory provider): the lease/asset join, the
/// approved/active filter, department scoping, and which field the search text matched on.
/// </summary>
[Trait("Category", "Integration")]
public class AssetCounterPaymentServiceIntegrationTests : IAsyncLifetime
{
    private const int DepartmentId = 5;
    private const int ClerkUserId = 1;
    private const int AdminRoleId = 99;
    private const int CurrentFinanceYear = 2026;

    private ApplicationDbContext? _context;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"AssetCounterPaymentServiceIntegrationTests_{Guid.NewGuid()}")
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    /// <summary>"Today" for the demand summary unless a test overrides it: May 2026 is the current month.</summary>
    private static readonly DateTime DefaultToday = new(2026, 5, 15);

    private AssetCounterPaymentService CreateService(int currentFinanceYear = CurrentFinanceYear, DateTime? today = null)
    {
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(p => p.GetCurrentFinanceYear()).Returns(currentFinanceYear);

        var clock = new Mock<TimeProvider>();
        clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today ?? DefaultToday, TimeSpan.Zero));
        clock.Setup(c => c.LocalTimeZone).Returns(TimeZoneInfo.Utc);

        return new(
            new Repository<AssetLeaseRentDetailsEntity, int>(_context!),
            new Repository<AssetMasterEntity, int>(_context!),
            new Repository<UserRoleAllocationEntity, int>(_context!),
            new Repository<MonthWiseDemandEntity, int>(_context!),
            new Repository<LeaseRentBillTransactionEntity, int>(_context!),
            new Repository<LeaseRentBillTransactionDetailEntity, int>(_context!),
            new Repository<ChequePaymentTransactionEntity, int>(_context!),
            new UserAccessRepository(_context!),
            financeYearProvider.Object,
            clock.Object);
    }

    private async Task SeedAssetAsync(
        int id, string? assetNo = null, string? assetName = null, int? parentAssetId = null,
        int? departmentId = DepartmentId, bool isActive = true)
    {
        _context!.Set<AssetMasterEntity>().Add(new AssetMasterEntity
        {
            Id = id,
            AssetNo = assetNo ?? $"AMC-BLD-SHP-{id:0000}",
            AssetName = assetName ?? $"Asset {id}",
            AssetCategoryId = 1,
            AssetTypeId = 1,
            ParentAssetId = parentAssetId,
            DepartmentId = departmentId,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    private async Task<AssetLeaseRentDetailsEntity> SeedLeaseAsync(
        int assetId, string tenantName = "Acme Traders", string tenantMobile = "9876543210",
        string? shopNo = null, string? shopName = null, string workflowStatus = "Approved",
        bool isActive = true, bool markedForDeletion = false)
    {
        var lease = new AssetLeaseRentDetailsEntity
        {
            AssetId = assetId,
            TenantName = tenantName,
            TenantMobile = tenantMobile,
            TenantEmail = "tenant@example.com",
            ShopNo = shopNo,
            ShopName = shopName,
            LeaseType = "Rent",
            LeaseStartDate = new DateTime(2026, 4, 1),
            RentAmount = 5000m,
            PaymentFrequency = "Monthly",
            WorkflowStatus = workflowStatus,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await _context.SaveChangesAsync();
        return lease;
    }

    private async Task SeedUserRoleAllocationAsync(int userId, int departmentId, int userRoleId = 1)
    {
        _context!.Set<UserRoleAllocationEntity>().Add(new UserRoleAllocationEntity
        {
            UserId = userId,
            DepartmentId = departmentId,
            UserRoleId = userRoleId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    private async Task SeedAdminAsync(int userId)
    {
        _context!.Set<UserRoleMasterEntity>().Add(new UserRoleMasterEntity
        {
            Id = AdminRoleId,
            UserRoleName = "Admin",
            DepartmentId = DepartmentId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        await SeedUserRoleAllocationAsync(userId, DepartmentId, AdminRoleId);
    }

    [Fact]
    public async Task SearchByMobile_ReturnsLeaseWithAssetAndTenantDetails()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(1, assetName: "Market Building");
        await SeedAssetAsync(10, assetNo: "AMC-BLD-SHP-0010", assetName: "Shop 10", parentAssetId: 1);
        var lease = await SeedLeaseAsync(10, tenantName: "Ramesh Patil", tenantMobile: "9876543210", shopNo: "G-10", shopName: "Patil Stores");

        var result = await CreateService().SearchAsync("+91 98765 43210", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.TenantMobile, result.MatchedBy);
        Assert.Equal(CounterPaymentMatchType.Exact, result.MatchType);
        var row = Assert.Single(result.Results);
        Assert.Equal(lease.Id, row.LeaseRentDetailsId);
        Assert.Equal(10, row.AssetId);
        Assert.Equal("AMC-BLD-SHP-0010", row.AssetNo);
        Assert.Equal("Shop 10", row.AssetName);
        Assert.Equal(1, row.ParentAssetId);
        Assert.Equal("Market Building", row.ParentAssetName);
        Assert.Equal("G-10", row.ShopNo);
        Assert.Equal("Patil Stores", row.ShopName);
        Assert.Equal("Ramesh Patil", row.TenantName);
        Assert.Equal("9876543210", row.TenantMobile);
        Assert.Equal("tenant@example.com", row.TenantEmail);
        Assert.Equal(5000m, row.RentAmount);
        Assert.Equal("Monthly", row.PaymentFrequency);
    }

    [Fact]
    public async Task SearchByMobile_MatchesMobileStoredWithCountryCode()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10);
        await SeedLeaseAsync(10, tenantMobile: "+919876543210");

        var result = await CreateService().SearchAsync("9876543210", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.TenantMobile, result.MatchedBy);
        Assert.Single(result.Results);
    }

    [Fact]
    public async Task Search_ExcludesNonApprovedInactiveAndDeletedLeasesAndInactiveAssets()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10);
        await SeedAssetAsync(11);
        await SeedAssetAsync(12);
        await SeedAssetAsync(13, isActive: false);
        await SeedLeaseAsync(10, workflowStatus: "Pending");
        await SeedLeaseAsync(11, isActive: false);
        await SeedLeaseAsync(12, markedForDeletion: true);
        await SeedLeaseAsync(13);

        var result = await CreateService().SearchAsync("9876543210", ClerkUserId);

        Assert.Empty(result.Results);
        Assert.Null(result.MatchedBy);
    }

    [Fact]
    public async Task NumericText_MatchesAssetIdBeforeShopNo()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(101);
        await SeedAssetAsync(20);
        await SeedLeaseAsync(101, tenantName: "Asset 101 Tenant");
        await SeedLeaseAsync(20, tenantName: "Shop 101 Tenant", shopNo: "101");

        var result = await CreateService().SearchAsync("101", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.AssetId, result.MatchedBy);
        Assert.Equal("Asset 101 Tenant", Assert.Single(result.Results).TenantName);
    }

    [Fact]
    public async Task NumericText_FallsBackToShopNoWhenNoAssetIdMatches()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(20);
        await SeedLeaseAsync(20, shopNo: "101");

        var result = await CreateService().SearchAsync("101", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.ShopNo, result.MatchedBy);
        Assert.Equal(CounterPaymentMatchType.Exact, result.MatchType);
        Assert.Equal(20, Assert.Single(result.Results).AssetId);
    }

    [Fact]
    public async Task AssetCode_MatchesAssetNoExactly()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10, assetNo: "AMC-BLD-SHP-0010");
        await SeedAssetAsync(11, assetNo: "AMC-BLD-SHP-00100");
        await SeedLeaseAsync(10);
        await SeedLeaseAsync(11);

        var result = await CreateService().SearchAsync("AMC-BLD-SHP-0010", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.AssetNo, result.MatchedBy);
        Assert.Equal(CounterPaymentMatchType.Exact, result.MatchType);
        Assert.Equal(10, Assert.Single(result.Results).AssetId);
    }

    [Fact]
    public async Task PartialAssetCode_MatchesAssetNoPartially()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10, assetNo: "AMC-BLD-SHP-0010");
        await SeedLeaseAsync(10);

        var result = await CreateService().SearchAsync("SHP-0010", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.AssetNo, result.MatchedBy);
        Assert.Equal(CounterPaymentMatchType.Partial, result.MatchType);
        Assert.Single(result.Results);
    }

    [Fact]
    public async Task PartialMobileDigits_MatchTenantMobile()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10);
        await SeedLeaseAsync(10, tenantMobile: "9876543210");

        var result = await CreateService().SearchAsync("43210", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.TenantMobile, result.MatchedBy);
        Assert.Equal(CounterPaymentMatchType.Partial, result.MatchType);
        Assert.Single(result.Results);
    }

    [Fact]
    public async Task Name_MatchesTenantNameBeforeShopAndAssetName()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10, assetName: "Patil Complex Shop");
        await SeedAssetAsync(11);
        await SeedLeaseAsync(10, tenantName: "Other Tenant");
        await SeedLeaseAsync(11, tenantName: "Ramesh Patil");

        var result = await CreateService().SearchAsync("Patil", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.TenantName, result.MatchedBy);
        Assert.Equal("Ramesh Patil", Assert.Single(result.Results).TenantName);
    }

    [Fact]
    public async Task Name_FallsBackToShopNameThenAssetName()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10, assetName: "Gandhi Market Shop 10");
        await SeedAssetAsync(11);
        await SeedLeaseAsync(10);
        await SeedLeaseAsync(11, shopName: "Laxmi General Store");

        var byShopName = await CreateService().SearchAsync("Laxmi", ClerkUserId);
        var byAssetName = await CreateService().SearchAsync("Gandhi Market", ClerkUserId);

        Assert.Equal(CounterPaymentSearchField.ShopName, byShopName.MatchedBy);
        Assert.Equal(11, Assert.Single(byShopName.Results).AssetId);
        Assert.Equal(CounterPaymentSearchField.AssetName, byAssetName.MatchedBy);
        Assert.Equal(10, Assert.Single(byAssetName.Results).AssetId);
    }

    [Fact]
    public async Task Search_IsScopedToCallersDepartments()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10, departmentId: DepartmentId);
        await SeedAssetAsync(11, departmentId: 7);
        await SeedAssetAsync(12, departmentId: null);
        await SeedLeaseAsync(10);
        await SeedLeaseAsync(11);
        await SeedLeaseAsync(12);

        var result = await CreateService().SearchAsync("9876543210", ClerkUserId);

        Assert.Equal(10, Assert.Single(result.Results).AssetId);
    }

    [Fact]
    public async Task Search_UserWithNoDepartment_SeesNothing()
    {
        await SeedAssetAsync(10);
        await SeedLeaseAsync(10);

        var result = await CreateService().SearchAsync("9876543210", userId: 2);

        Assert.Empty(result.Results);
    }

    [Fact]
    public async Task Search_AdminSeesAllDepartmentsIncludingUnassigned()
    {
        await SeedAdminAsync(userId: 3);
        await SeedAssetAsync(10, departmentId: DepartmentId);
        await SeedAssetAsync(11, departmentId: 7);
        await SeedAssetAsync(12, departmentId: null);
        await SeedLeaseAsync(10);
        await SeedLeaseAsync(11);
        await SeedLeaseAsync(12);

        var result = await CreateService().SearchAsync("9876543210", userId: 3);

        Assert.Equal(new[] { 10, 11, 12 }, result.Results.Select(r => r.AssetId).OrderBy(id => id));
    }

    [Fact]
    public async Task Search_CapsResultsAndFlagsHasMoreResults()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        for (var id = 1; id <= AssetCounterPaymentService.MaxResults + 1; id++)
        {
            await SeedAssetAsync(1000 + id);
            await SeedLeaseAsync(1000 + id, tenantName: $"Sharma {id:000}");
        }

        var result = await CreateService().SearchAsync("Sharma", ClerkUserId);

        Assert.Equal(AssetCounterPaymentService.MaxResults, result.Results.Count);
        Assert.True(result.HasMoreResults);
    }

    [Fact]
    public async Task Search_NoMatch_ReturnsEmptyWithNoMatchedField()
    {
        await SeedUserRoleAllocationAsync(ClerkUserId, DepartmentId);
        await SeedAssetAsync(10);
        await SeedLeaseAsync(10);

        var result = await CreateService().SearchAsync("Nobody", ClerkUserId);

        Assert.Empty(result.Results);
        Assert.Null(result.MatchedBy);
        Assert.Null(result.MatchType);
        Assert.False(result.HasMoreResults);
        Assert.Equal("Nobody", result.SearchText);
    }

    #region GetDemandDetailsAsync

    private async Task<MonthWiseDemandEntity> SeedDemandAsync(
        int assetId, int leaseId, int financeYear, int demandYear, byte demandMonth,
        decimal rent = 5000m, decimal penalty = 0m, decimal gst = 900m, decimal paid = 0m,
        string status = "Pending", bool isActive = true, DateTime? dueDate = null)
    {
        var demand = new MonthWiseDemandEntity
        {
            AssetId = assetId,
            LeaseRegistrationId = leaseId,
            FinanceYear = financeYear,
            DemandYear = demandYear,
            QuarterNo = (byte)(demandMonth >= 4 ? (demandMonth - 4) / 3 + 1 : 4),
            DemandMonth = demandMonth,
            MonthlyRentAmount = rent,
            PenaltyAmount = penalty,
            GSTAmount = gst,
            PaidAmount = paid,
            DemandStatus = status,
            DueDate = dueDate,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<MonthWiseDemandEntity>().Add(demand);
        await _context.SaveChangesAsync();
        return demand;
    }

    private async Task<LeaseRentBillTransactionEntity> SeedTransactionAsync(
        int assetId, int leaseId, string transactionNo, DateTime paymentDate, decimal paid,
        decimal discount = 0m, bool isActive = true,
        params (MonthWiseDemandEntity Demand, decimal Paid, decimal Balance, string Status, bool IsActive)[] lines)
    {
        var transaction = new LeaseRentBillTransactionEntity
        {
            TransactionNo = transactionNo,
            ReceiptNo = $"R-{transactionNo}",
            AssetId = assetId,
            LeaseRegistrationId = leaseId,
            FinanceYear = paymentDate.Month >= 4 ? paymentDate.Year : paymentDate.Year - 1,
            TotalMonthlyRentAmount = lines.Sum(l => l.Demand.MonthlyRentAmount),
            TotalPenaltyAmount = lines.Sum(l => l.Demand.PenaltyAmount),
            TotalGSTAmount = lines.Sum(l => l.Demand.GSTAmount),
            DiscountAmount = discount,
            PaidAmount = paid,
            PaymentMode = "Cash",
            PaymentDate = paymentDate,
            PaymentStatus = "Success",
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        };

        foreach (var line in lines)
        {
            transaction.Details.Add(new LeaseRentBillTransactionDetailEntity
            {
                MonthWiseDemandId = line.Demand.Id,
                AssetId = assetId,
                LeaseRegistrationId = leaseId,
                FinanceYear = line.Demand.FinanceYear,
                DemandYear = line.Demand.DemandYear,
                QuarterNo = line.Demand.QuarterNo,
                DemandMonth = line.Demand.DemandMonth,
                MonthlyRentAmount = line.Demand.MonthlyRentAmount,
                PenaltyAmount = line.Demand.PenaltyAmount,
                GSTAmount = line.Demand.GSTAmount,
                CurrentPaidAmount = line.Paid,
                BalanceAmount = line.Balance,
                PaymentStatus = line.Status,
                IsActive = line.IsActive,
                CreatedDate = DateTime.UtcNow
            });
        }

        _context!.Set<LeaseRentBillTransactionEntity>().Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    [Fact]
    public async Task GetDemandDetails_UnknownOrDeletedAsset_ReturnsNull()
    {
        _context!.Set<AssetMasterEntity>().Add(new AssetMasterEntity
        {
            Id = 20, AssetNo = "A-20", AssetName = "Deleted", AssetCategoryId = 1, AssetTypeId = 1,
            IsActive = true, MarkedForDeletion = true, CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        Assert.Null(await CreateService().GetDemandDetailsAsync(999));
        Assert.Null(await CreateService().GetDemandDetailsAsync(20));
    }

    [Fact]
    public async Task GetDemandDetails_NoDemand_ReturnsZeroSummaryAndEmptyLists()
    {
        await SeedAssetAsync(10, assetNo: "AMC-BLD-SHP-0010", assetName: "Shop 10");

        var result = await CreateService().GetDemandDetailsAsync(10);

        Assert.NotNull(result);
        Assert.Equal("AMC-BLD-SHP-0010", result!.AssetNo);
        Assert.Equal("Shop 10", result.AssetName);
        Assert.Equal(CurrentFinanceYear, result.CurrentFinanceYear);
        Assert.Empty(result.Demands);
        Assert.Empty(result.Transactions);
        Assert.Equal(0m, result.Summary.Total.Demand);
        Assert.Equal(0m, result.Summary.Total.Paid);
        Assert.Equal(0m, result.Summary.Total.Due);
    }

    [Fact]
    public async Task GetDemandDetails_ArrearsAreMonthsBeforeTheCurrentMonth_CurrentDueIsTheCurrentMonth()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);

        // Before May 2026 (arrears), across the finance-year boundary: 5900 fully paid, 5900 with
        // 2000 paid, and 5900 unpaid.
        await SeedDemandAsync(10, lease.Id, 2025, 2026, 2, paid: 5900m, status: "Paid");
        await SeedDemandAsync(10, lease.Id, 2025, 2026, 3, paid: 2000m, status: "Partial");
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        // May 2026 (current month): 6000 with penalty, 1000 paid.
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 5, penalty: 100m, paid: 1000m, status: "Partial");
        // Excluded: cancelled demand and inactive row.
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 6, status: "Cancelled");
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 7, isActive: false);

        var result = await CreateService(today: new DateTime(2026, 5, 15)).GetDemandDetailsAsync(10);

        Assert.NotNull(result);
        Assert.Equal(new[] { (2026, 2), (2026, 3), (2026, 4), (2026, 5) },
            result!.Demands.Select(d => (d.DemandYear, (int)d.DemandMonth)));

        var may = result.Demands[3];
        Assert.Equal(6000m, may.TotalDemandAmount);
        Assert.Equal(5000m, may.PendingAmount);
        Assert.Equal(lease.Id, may.LeaseRegistrationId);

        Assert.Equal(17700m, result.Summary.Arrears.Demand);
        Assert.Equal(7900m, result.Summary.Arrears.Paid);
        Assert.Equal(9800m, result.Summary.Arrears.Due);

        Assert.Equal(6000m, result.Summary.CurrentDue.Demand);
        Assert.Equal(1000m, result.Summary.CurrentDue.Paid);
        Assert.Equal(5000m, result.Summary.CurrentDue.Due);

        Assert.Equal(23700m, result.Summary.Total.Demand);
        Assert.Equal(8900m, result.Summary.Total.Paid);
        Assert.Equal(14800m, result.Summary.Total.Due);
    }

    [Fact]
    public async Task GetDemandDetails_SameMonthOfAnEarlierYear_IsArrears()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        await SeedDemandAsync(10, lease.Id, 2025, 2025, 12);
        await SeedDemandAsync(10, lease.Id, 2025, 2026, 1);

        var result = await CreateService(today: new DateTime(2026, 1, 1)).GetDemandDetailsAsync(10);

        Assert.Equal(5900m, result!.Summary.Arrears.Demand);    // Dec 2025
        Assert.Equal(5900m, result.Summary.CurrentDue.Demand);  // Jan 2026
    }

    [Fact]
    public async Task GetDemandDetails_NoDemandForTheCurrentMonth_CurrentDueIsZero()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);

        var result = await CreateService(today: new DateTime(2026, 5, 15)).GetDemandDetailsAsync(10);

        Assert.Equal(5900m, result!.Summary.Arrears.Demand);
        Assert.Equal(0m, result.Summary.CurrentDue.Demand);
        Assert.Equal(0m, result.Summary.CurrentDue.Due);
    }

    [Fact]
    public async Task GetDemandDetails_MonthsAfterTheCurrentMonth_AreListedButNotInTheSummary()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 5);
        await SeedDemandAsync(10, lease.Id, 2026, 2026, 6);
        await SeedDemandAsync(10, lease.Id, 2027, 2027, 4);

        var result = await CreateService(today: new DateTime(2026, 5, 15)).GetDemandDetailsAsync(10);

        Assert.Equal(3, result!.Demands.Count);
        Assert.Equal(0m, result.Summary.Arrears.Demand);
        Assert.Equal(5900m, result.Summary.CurrentDue.Demand);
        Assert.Equal(5900m, result.Summary.Total.Demand);
        Assert.Equal(5900m, result.Summary.Total.Due);
    }

    [Fact]
    public async Task GetDemandDetails_ReturnsTransactionsNewestFirstWithTheirMonthLines()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        var feb = await SeedDemandAsync(10, lease.Id, 2025, 2026, 2, paid: 5900m, status: "Paid");
        var mar = await SeedDemandAsync(10, lease.Id, 2025, 2026, 3, paid: 5900m, status: "Paid");
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4, paid: 5900m, status: "Paid");

        // Lines are seeded out of month order to prove they come back oldest month first.
        var seededT1 = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 3, 10), paid: 11700m, discount: 100m,
            lines: new[] { (mar, 5900m, 0m, "Paid", true), (feb, 5900m, 0m, "Paid", true) });
        var seededT2 = await SeedTransactionAsync(10, lease.Id, "T2", new DateTime(2026, 5, 5), paid: 5900m,
            lines: new[] { (apr, 5900m, 0m, "Paid", true), (feb, 1m, 0m, "Cancelled", false) });
        await SeedTransactionAsync(10, lease.Id, "T-INACTIVE", new DateTime(2026, 6, 1), paid: 1m, isActive: false);

        var result = await CreateService().GetDemandDetailsAsync(10);

        Assert.Equal(new[] { "T2", "T1" }, result!.Transactions.Select(t => t.TransactionNo));

        var t2 = result.Transactions[0];
        Assert.Equal(seededT2.Uuid, t2.Uuid);
        var aprLine = Assert.Single(t2.Lines);
        Assert.Equal(apr.Id, aprLine.MonthWiseDemandId);
        Assert.Equal(5900m, aprLine.CurrentPaidAmount);

        var t1 = result.Transactions[1];
        Assert.Equal(seededT1.Uuid, t1.Uuid);
        Assert.Equal("R-T1", t1.ReceiptNo);
        Assert.Equal(lease.Id, t1.LeaseRegistrationId);
        Assert.Equal(new DateTime(2026, 3, 10), t1.PaymentDate);
        Assert.Equal("Cash", t1.PaymentMode);
        Assert.Equal("Success", t1.PaymentStatus);
        Assert.Equal(11800m, t1.TotalDemandAmount);
        Assert.Equal(100m, t1.DiscountAmount);
        Assert.Equal(11800m, t1.NetPayableAmount); // the informational 100 discount isn't subtracted
        Assert.Equal(11700m, t1.PaidAmount);
        Assert.Equal(new byte[] { 2, 3 }, t1.Lines.Select(l => l.DemandMonth));
        Assert.All(t1.Lines, l => Assert.Equal("Paid", l.PaymentStatus));
    }

    [Fact]
    public async Task GetDemandDetails_OnlyIncludesThisAssetsDemandAndTransactions()
    {
        await SeedAssetAsync(10);
        await SeedAssetAsync(11);
        var lease10 = await SeedLeaseAsync(10);
        var lease11 = await SeedLeaseAsync(11);
        await SeedDemandAsync(10, lease10.Id, 2026, 2026, 4);
        var other = await SeedDemandAsync(11, lease11.Id, 2026, 2026, 4, paid: 5900m, status: "Paid");
        await SeedTransactionAsync(11, lease11.Id, "T-OTHER", new DateTime(2026, 4, 20), paid: 5900m,
            lines: new[] { (other, 5900m, 0m, "Paid", true) });

        var result = await CreateService().GetDemandDetailsAsync(10);

        Assert.All(result!.Demands, d => Assert.Equal(10, d.AssetId));
        Assert.Single(result.Demands);
        Assert.Empty(result.Transactions);
        Assert.Equal(5900m, result.Summary.Total.Demand);
    }

    #endregion

    #region GetReceiptByUuidAsync

    /// <summary>Asset 10 with an Approved lease carrying every field the receipt prints.</summary>
    private async Task<AssetLeaseRentDetailsEntity> SeedReceiptLeaseAsync(bool isActive = true)
    {
        await SeedAssetAsync(10, assetNo: "AMC-BLD-SHP-0010", assetName: "Shop 10");
        var lease = await SeedLeaseAsync(10, tenantName: "Ramesh Patil", tenantMobile: "9876543210", isActive: isActive);
        lease.AgreementId = "AGR-2026-0007";
        lease.LeaseEndDate = new DateTime(2031, 3, 31);
        lease.SecurityDeposit = 15000m;
        await _context!.SaveChangesAsync();
        return lease;
    }

    /// <summary>
    /// A cheque of 10000 + 200 + 1800 = 12000 demand (two months of 5000 + 100 + 900), 500 discount,
    /// 1000 wallet used, 10000 paid. Without <paramref name="allocationsJson"/> it has no staged
    /// allocations, like a cheque staged before intake recorded what each month owed.
    /// </summary>
    private async Task<ChequePaymentTransactionEntity> SeedChequeAsync(
        int leaseId, string acknowledgementNo, string status = "Received", int? postedTransactionId = null, bool isActive = true,
        string allocationsJson = "[]")
    {
        var cheque = new ChequePaymentTransactionEntity
        {
            AcknowledgementNo = acknowledgementNo,
            AssetId = 10,
            LeaseRegistrationId = leaseId,
            FinanceYear = 2026,
            PaymentType = "Full",
            TotalMonthlyRentAmount = 10000m,
            TotalPenaltyAmount = 200m,
            TotalGSTAmount = 1800m,
            DiscountAmount = 500m,
            AdjustmentAmount = -1000m,
            PaidAmount = 10000m,
            AllocationsJson = allocationsJson,
            PaymentDate = new DateTime(2026, 5, 10),
            BankName = "State Bank of India",
            BranchName = "Camp",
            ChequeOrTransactionNo = "004512",
            ChequeDate = new DateTime(2026, 5, 9),
            AccountHolderName = "Ramesh Patil",
            PayerMobile = "9876543210",
            Status = status,
            Remark = "Apr-May rent",
            LeaseRentBillTransactionId = postedTransactionId,
            CreatedBy = 42,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<ChequePaymentTransactionEntity>().Add(cheque);
        await _context.SaveChangesAsync();
        return cheque;
    }

    /// <summary>AllocationsJson as cheque intake writes it: per month, what the cheque pays and what the month owed then.</summary>
    private static string StagedAllocations(params (int DemandId, decimal Pay, decimal Outstanding)[] months)
        => JsonSerializer.Serialize(months.Select(m => new ChequeAllocation
        {
            MonthWiseDemandId = m.DemandId,
            PayAmount = m.Pay,
            PenaltyAmount = 100m,
            OutstandingAmount = m.Outstanding
        }));

    [Fact]
    public async Task GetReceipt_SettledPaymentUuid_ReturnsSettledReceiptWithLinesOldestFirst()
    {
        var lease = await SeedReceiptLeaseAsync();
        var dec = await SeedDemandAsync(10, lease.Id, 2025, 2025, 12, dueDate: new DateTime(2025, 12, 10));
        var may = await SeedDemandAsync(10, lease.Id, 2026, 2026, 5, dueDate: new DateTime(2026, 5, 10));

        // Seeded newest month first to prove the lines come back ordered by year, then month.
        // Dec had 2000 paid by an earlier payment, so 3900 of its 5900 was still due.
        var transaction = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 5, 20), paid: 9000m, discount: 100m,
            lines: new[] { (may, 5100m, 800m, "Partial", true), (dec, 3900m, 0m, "Paid", true) });
        transaction.Details.Single(d => d.MonthWiseDemandId == dec.Id).PreviousPaidAmount = 2000m;
        transaction.AccountHolderName = "R Patil";
        transaction.Remark = "Counter payment";
        transaction.CreatedBy = 42;
        await _context!.SaveChangesAsync();

        var receipt = await CreateService().GetReceiptByUuidAsync(transaction.Uuid);

        Assert.NotNull(receipt);
        Assert.Equal(transaction.Uuid, receipt!.Uuid);
        Assert.Equal("R-T1", receipt.ReceiptNo);
        Assert.Equal(2026, receipt.FinanceYear);
        Assert.Equal(new DateTime(2026, 5, 20), receipt.PaymentDate);
        Assert.Equal(11800m, receipt.TotalDemandAmount);
        Assert.Equal(9800m, receipt.TotalOutstandingBeforePayment);
        Assert.Equal(9000m, receipt.PaidAmount);
        Assert.Equal(800m, receipt.RemainingBalance); // the 100 discount is not applied
        Assert.Equal("Cash", receipt.PaymentMode);
        Assert.Equal("Success", receipt.PaymentStatus);
        Assert.Equal("R Patil", receipt.DDPayeeName);
        Assert.Equal("Counter payment", receipt.Remark);
        Assert.Equal(42, receipt.CreatedBy);

        Assert.Equal("AMC-BLD-SHP-0010", receipt.AssetNo);
        Assert.Equal("Shop 10", receipt.AssetName);
        Assert.Equal("AGR-2026-0007", receipt.AgreementId);
        Assert.Equal("Ramesh Patil", receipt.TenantName);
        Assert.Equal("9876543210", receipt.TenantMobile);
        Assert.Equal(new DateTime(2026, 4, 1), receipt.LeaseStartDate);
        Assert.Equal(new DateTime(2031, 3, 31), receipt.LeaseEndDate);
        Assert.Equal(5000m, receipt.MonthlyRent);
        Assert.Equal(15000m, receipt.SecurityDeposit);

        Assert.Equal(new[] { "12/2025", "05/2026" }, receipt.PaidDemands.Select(l => l.Period));
        var decLine = receipt.PaidDemands[0];
        Assert.Equal("मासिक भाडे", decLine.Description);
        Assert.Equal(new DateTime(2025, 12, 10), decLine.DueDate);
        Assert.Equal(3900m, decLine.DueAmount);
        Assert.Equal(3900m, decLine.PaidAmount);
        var mayLine = receipt.PaidDemands[1];
        Assert.Equal(new DateTime(2026, 5, 10), mayLine.DueDate);
        Assert.Equal(5900m, mayLine.DueAmount);
        Assert.Equal(5100m, mayLine.PaidAmount);
    }

    [Theory]
    [InlineData(4900, -1000)] // 1000 of the 5900 came from the wallet; the header's PaidAmount is cash only
    [InlineData(7000, 0)]     // 1100 beyond the dues was credited to the wallet, not to this month
    public async Task GetReceipt_SettledMonthFullyPaid_HasNoRemainingBalance(int cash, int adjustment)
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var transaction = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 4, 20), paid: cash,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        transaction.AdjustmentAmount = adjustment;
        await _context!.SaveChangesAsync();

        var receipt = await CreateService().GetReceiptByUuidAsync(transaction.Uuid);

        Assert.Equal(5900m, receipt!.TotalOutstandingBeforePayment);
        Assert.Equal((decimal)cash, receipt.PaidAmount);
        Assert.Equal(0m, receipt.RemainingBalance);
    }

    [Fact]
    public async Task GetReceipt_SettledPaymentWithoutReceiptNo_UsesTransactionNo()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var transaction = await SeedTransactionAsync(10, lease.Id, "TXN-2026-000001", new DateTime(2026, 4, 20), paid: 5900m,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        transaction.ReceiptNo = null;
        await _context!.SaveChangesAsync();

        var receipt = await CreateService().GetReceiptByUuidAsync(transaction.Uuid);

        Assert.Equal("TXN-2026-000001", receipt!.ReceiptNo);
    }

    [Fact]
    public async Task GetReceipt_SettledPayment_SkipsInactiveLines()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var may = await SeedDemandAsync(10, lease.Id, 2026, 2026, 5);
        var transaction = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 5, 20), paid: 5900m,
            lines: new[] { (apr, 5900m, 0m, "Paid", true), (may, 1m, 0m, "Cancelled", false) });

        var receipt = await CreateService().GetReceiptByUuidAsync(transaction.Uuid);

        Assert.Equal("04/2026", Assert.Single(receipt!.PaidDemands).Period);
        Assert.Null(receipt.PaidDemands[0].DueDate); // demand seeded without one
    }

    [Fact]
    public async Task GetReceipt_ReceivedCheque_ReturnsChequeReceiptWithoutLines()
    {
        var lease = await SeedReceiptLeaseAsync();
        // April owed its full 6000 at intake; May only 4000 (2000 had been paid earlier). The cheque covers both.
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001",
            allocationsJson: StagedAllocations((101, 6000m, 6000m), (102, 4000m, 4000m)));

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

        Assert.NotNull(receipt);
        Assert.Equal(cheque.Uuid, receipt!.Uuid);
        Assert.Equal("CHQ-2026-000001", receipt.ReceiptNo);
        Assert.Equal(2026, receipt.FinanceYear);
        Assert.Equal(new DateTime(2026, 5, 10), receipt.PaymentDate);
        Assert.Equal(12000m, receipt.TotalDemandAmount);              // gross of the two months
        Assert.Equal(10000m, receipt.TotalOutstandingBeforePayment);  // what they owed at intake
        Assert.Equal(10000m, receipt.PaidAmount);
        Assert.Equal(0m, receipt.RemainingBalance);                   // the cheque covers both months
        Assert.Equal("Cheque", receipt.PaymentMode);
        Assert.Equal("Received", receipt.PaymentStatus);
        Assert.Equal("004512", receipt.ChequeOrTransactionNo);
        Assert.Equal("State Bank of India", receipt.BankName);
        Assert.Equal("Camp", receipt.BranchName);
        Assert.Equal(new DateTime(2026, 5, 9), receipt.ChequeDate);
        Assert.Null(receipt.OnlineTransactionId);
        Assert.Null(receipt.PaymentGatewayName);
        Assert.Equal("Apr-May rent", receipt.Remark);
        Assert.Equal(42, receipt.CreatedBy);
        Assert.Equal("Ramesh Patil", receipt.DDPayeeName);
        Assert.Equal("AMC-BLD-SHP-0010", receipt.AssetNo);
        Assert.Equal("Ramesh Patil", receipt.TenantName);
        Assert.Empty(receipt.PaidDemands);
    }

    [Fact]
    public async Task GetReceipt_ChequeCoveringPartOfAMonth_ShowsWhatItWillStillOwe()
    {
        var lease = await SeedReceiptLeaseAsync();
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001",
            allocationsJson: StagedAllocations((101, 6000m, 6000m), (102, 3000m, 6000m)));

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

        Assert.Equal(12000m, receipt!.TotalOutstandingBeforePayment);
        Assert.Equal(3000m, receipt.RemainingBalance);
        Assert.Empty(receipt.PaidDemands);
    }

    [Fact]
    public async Task GetReceipt_ChequeStagedBeforeOutstandingWasRecorded_FallsBackToItsGrossDemand()
    {
        var lease = await SeedReceiptLeaseAsync();
        var noAllocations = await SeedChequeAsync(lease.Id, "CHQ-2026-000001");
        var noSnapshot = await SeedChequeAsync(lease.Id, "CHQ-2026-000002",
            allocationsJson: """[{"MonthWiseDemandId":101,"PayAmount":6000,"PenaltyAmount":100},{"MonthWiseDemandId":102,"PayAmount":5000,"PenaltyAmount":100}]""");

        foreach (var cheque in new[] { noAllocations, noSnapshot })
        {
            var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

            Assert.Equal(12000m, receipt!.TotalOutstandingBeforePayment);
            Assert.Equal(1000m, receipt.RemainingBalance); // 12000 + (−1000) wallet − 10000; the 500 discount isn't subtracted
        }
    }

    [Fact]
    public async Task GetReceipt_ClearedChequeUuid_ReturnsThePostedPaymentsReceipt()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var posted = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 5, 10), paid: 5900m,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001", status: "Cleared", postedTransactionId: posted.Id);

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

        Assert.NotNull(receipt);
        Assert.Equal(posted.Uuid, receipt!.Uuid);
        Assert.NotEqual(cheque.Uuid, receipt.Uuid);
        Assert.Equal("R-T1", receipt.ReceiptNo);
        Assert.Equal("Success", receipt.PaymentStatus);
        Assert.Equal("04/2026", Assert.Single(receipt.PaidDemands).Period);
    }

    [Fact]
    public async Task GetReceipt_ClearedChequeWhosePostingIsInactiveOrMissing_ReturnsChequeReceipt()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var inactive = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 5, 10), paid: 5900m, isActive: false,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        var toInactive = await SeedChequeAsync(lease.Id, "CHQ-2026-000001", status: "Cleared", postedTransactionId: inactive.Id);
        var toMissing = await SeedChequeAsync(lease.Id, "CHQ-2026-000002", status: "Cleared", postedTransactionId: 9999);

        foreach (var cheque in new[] { toInactive, toMissing })
        {
            var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

            Assert.NotNull(receipt);
            Assert.Equal(cheque.Uuid, receipt!.Uuid);
            Assert.Equal(cheque.AcknowledgementNo, receipt.ReceiptNo);
            Assert.Equal("Cheque", receipt.PaymentMode);
            Assert.Equal("Cleared", receipt.PaymentStatus);
            Assert.Empty(receipt.PaidDemands);
        }
    }

    [Fact]
    public async Task GetReceipt_UuidOfInactiveRowsOnly_ReturnsNull()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var transaction = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 5, 10), paid: 5900m, isActive: false,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001", isActive: false);

        Assert.Null(await CreateService().GetReceiptByUuidAsync(transaction.Uuid));
        Assert.Null(await CreateService().GetReceiptByUuidAsync(cheque.Uuid));
    }

    [Fact]
    public async Task GetReceipt_UnknownUuid_ReturnsNull()
    {
        await SeedReceiptLeaseAsync();

        Assert.Null(await CreateService().GetReceiptByUuidAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetReceipt_MissingLease_ReturnsEmptyLeaseFields()
    {
        var cheque = await SeedChequeAsync(leaseId: 999, "CHQ-2026-000001");

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

        Assert.NotNull(receipt);
        Assert.Equal(string.Empty, receipt!.AssetNo);
        Assert.Equal(string.Empty, receipt.AssetName);
        Assert.Null(receipt.AgreementId);
        Assert.Equal(string.Empty, receipt.TenantName);
        Assert.Equal(string.Empty, receipt.TenantMobile);
        Assert.Null(receipt.LeaseStartDate);
        Assert.Null(receipt.LeaseEndDate);
        Assert.Equal(0m, receipt.MonthlyRent);
        Assert.Equal(0m, receipt.SecurityDeposit);
    }

    [Fact]
    public async Task GetReceipt_InactiveLease_StillFillsLeaseDetails()
    {
        var lease = await SeedReceiptLeaseAsync(isActive: false);
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001");

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);

        Assert.Equal("Ramesh Patil", receipt!.TenantName);
        Assert.Equal("AMC-BLD-SHP-0010", receipt.AssetNo);
    }

    /// <summary>Records on the payment the lease's current details, as the billing service does when it takes a payment.</summary>
    private static void RecordLease(IPaymentLeaseSnapshot payment, AssetLeaseRentDetailsEntity lease)
    {
        payment.Snap_TenantName = lease.TenantName;
        payment.Snap_TenantMobile = lease.TenantMobile;
        payment.Snap_AgreementId = lease.AgreementId;
        payment.Snap_LeaseStartDate = lease.LeaseStartDate;
        payment.Snap_LeaseEndDate = lease.LeaseEndDate;
        payment.Snap_RentAmount = lease.RentAmount;
        payment.Snap_SecurityDeposit = lease.SecurityDeposit;
    }

    /// <summary>The lease is handed to a new tenant on new terms.</summary>
    private async Task ReassignLeaseAsync(AssetLeaseRentDetailsEntity lease)
    {
        lease.TenantName = "Suresh Kale";
        lease.TenantMobile = "9000000001";
        lease.AgreementId = "AGR-2027-0001";
        lease.LeaseStartDate = new DateTime(2027, 4, 1);
        lease.LeaseEndDate = new DateTime(2032, 3, 31);
        lease.RentAmount = 7000m;
        lease.SecurityDeposit = 21000m;
        await _context!.SaveChangesAsync();
    }

    private static void AssertPrintsOriginalLease(LeaseRentReceiptDto? receipt)
    {
        Assert.NotNull(receipt);
        Assert.Equal(("Ramesh Patil", "9876543210", "AGR-2026-0007"), (receipt!.TenantName, receipt.TenantMobile, receipt.AgreementId));
        Assert.Equal((new DateTime(2026, 4, 1), new DateTime(2031, 3, 31)), (receipt.LeaseStartDate!.Value, receipt.LeaseEndDate!.Value));
        Assert.Equal((5000m, 15000m), (receipt.MonthlyRent, receipt.SecurityDeposit));
    }

    [Fact]
    public async Task GetReceipt_SettledPayment_PrintsTheLeaseAsRecorded_NotItsLaterEdits()
    {
        var lease = await SeedReceiptLeaseAsync();
        var apr = await SeedDemandAsync(10, lease.Id, 2026, 2026, 4);
        var transaction = await SeedTransactionAsync(10, lease.Id, "T1", new DateTime(2026, 4, 20), paid: 5900m,
            lines: new[] { (apr, 5900m, 0m, "Paid", true) });
        RecordLease(transaction, lease);
        await _context!.SaveChangesAsync();

        await ReassignLeaseAsync(lease);

        AssertPrintsOriginalLease(await CreateService().GetReceiptByUuidAsync(transaction.Uuid));
    }

    [Fact]
    public async Task GetReceipt_Cheque_PrintsTheLeaseAsRecordedAtIntake_NotItsLaterEdits()
    {
        var lease = await SeedReceiptLeaseAsync();
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001");
        RecordLease(cheque, lease);
        await _context!.SaveChangesAsync();

        await ReassignLeaseAsync(lease);

        AssertPrintsOriginalLease(await CreateService().GetReceiptByUuidAsync(cheque.Uuid));
    }

    [Fact]
    public async Task GetReceipt_PaymentWithoutRecordedLease_FallsBackToTheCurrentLease()
    {
        var lease = await SeedReceiptLeaseAsync();
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001"); // taken before receipt details were recorded

        await ReassignLeaseAsync(lease);

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);
        Assert.Equal(("Suresh Kale", 7000m), (receipt!.TenantName, receipt.MonthlyRent));
    }

    [Fact]
    public async Task GetReceipt_PrintsTheAssetThePaymentWasFor_EvenAfterTheLeaseMovesToAnotherAsset()
    {
        var lease = await SeedReceiptLeaseAsync(); // on asset 10, AMC-BLD-SHP-0010
        await SeedAssetAsync(11, assetNo: "AMC-BLD-SHP-0011", assetName: "Shop 11");
        var cheque = await SeedChequeAsync(lease.Id, "CHQ-2026-000001");

        lease.AssetId = 11;
        await _context!.SaveChangesAsync();

        var receipt = await CreateService().GetReceiptByUuidAsync(cheque.Uuid);
        Assert.Equal(("AMC-BLD-SHP-0010", "Shop 10"), (receipt!.AssetNo, receipt.AssetName));
    }

    #endregion
}
