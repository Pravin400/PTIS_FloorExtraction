using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentDemand;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetCounterPaymentService : IAssetCounterPaymentService
{
    /// <summary>Most rows one search returns; more than this sets HasMoreResults.</summary>
    public const int MaxResults = 50;

    /// <summary>Shortest text a partial (contains) match runs for — shorter text matches almost everything.</summary>
    public const int MinPartialLength = 3;

    /// <summary>Shortest digit run treated as part of a mobile number rather than an id/shop no.</summary>
    public const int MinPartialMobileLength = 5;

    // Payment is only collected against leases that completed the registration workflow.
    private const string StatusApproved = "Approved";

    private const string DemandStatusCancelled = "Cancelled";

    private const string ChequeStatusCleared = "Cleared";
    private const string PaymentModeCheque = "Cheque";

    /// <summary>Description printed on every receipt month line ("monthly rent").</summary>
    private const string ReceiptLineDescription = "मासिक भाडे";

    private readonly IRepository<AssetLeaseRentDetailsEntity, int> _leaseRepository;
    private readonly IRepository<AssetMasterEntity, int> _assetRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _userRoleAllocationRepository;
    private readonly IRepository<MonthWiseDemandEntity, int> _demandRepository;
    private readonly IRepository<LeaseRentBillTransactionEntity, int> _transactionRepository;
    private readonly IRepository<LeaseRentBillTransactionDetailEntity, int> _transactionDetailRepository;
    private readonly IRepository<ChequePaymentTransactionEntity, int> _chequeRepository;
    private readonly IUserAccessRepository _userAccessRepository;
    private readonly IFinanceYearProvider _financeYearProvider;
    private readonly TimeProvider _timeProvider;

    public AssetCounterPaymentService(
        IRepository<AssetLeaseRentDetailsEntity, int> leaseRepository,
        IRepository<AssetMasterEntity, int> assetRepository,
        IRepository<UserRoleAllocationEntity, int> userRoleAllocationRepository,
        IRepository<MonthWiseDemandEntity, int> demandRepository,
        IRepository<LeaseRentBillTransactionEntity, int> transactionRepository,
        IRepository<LeaseRentBillTransactionDetailEntity, int> transactionDetailRepository,
        IRepository<ChequePaymentTransactionEntity, int> chequeRepository,
        IUserAccessRepository userAccessRepository,
        IFinanceYearProvider financeYearProvider,
        TimeProvider timeProvider)
    {
        _leaseRepository = leaseRepository;
        _assetRepository = assetRepository;
        _userRoleAllocationRepository = userRoleAllocationRepository;
        _demandRepository = demandRepository;
        _transactionRepository = transactionRepository;
        _transactionDetailRepository = transactionDetailRepository;
        _chequeRepository = chequeRepository;
        _userAccessRepository = userAccessRepository;
        _financeYearProvider = financeYearProvider;
        _timeProvider = timeProvider;
    }

    /// <summary>One field to try, the kind of match, and the normalized value to match it against.</summary>
    public sealed record SearchStep(string Field, string MatchType, string Value);

    /// <summary>
    /// Identifies what the clerk typed and returns the fields to try, most specific first:
    /// <list type="number">
    ///   <item>TenantMobile (exact) — 10 digits starting 6-9, optionally written as +91 / 91 / 0 prefixed or with spaces/hyphens.</item>
    ///   <item>AssetId (exact) — a positive integer without a leading zero.</item>
    ///   <item>ShopNo, then AssetNo (exact) — always tried; these are the codes painted on the unit / printed on the register.</item>
    ///   <item>TenantMobile (partial) — a run of at least <see cref="MinPartialMobileLength"/> digits, e.g. the last digits of a mobile.</item>
    ///   <item>AssetNo (partial) — at least <see cref="MinPartialLength"/> characters, e.g. just the sequence part of the code.</item>
    ///   <item>TenantName, ShopName, AssetName (partial) — text containing a letter, at least <see cref="MinPartialLength"/> characters.</item>
    /// </list>
    /// Returns an empty plan for blank input.
    /// </summary>
    public static IReadOnlyList<SearchStep> BuildSearchPlan(string? searchText)
    {
        var text = NormalizeSearchText(searchText);
        var plan = new List<SearchStep>();
        if (text.Length == 0)
            return plan;

        var mobile = TryNormalizeMobile(text);
        if (mobile != null)
            plan.Add(new SearchStep(CounterPaymentSearchField.TenantMobile, CounterPaymentMatchType.Exact, mobile));

        // "0012" is a code, not id 12.
        if (text[0] != '0' && int.TryParse(text, NumberStyles.None, CultureInfo.InvariantCulture, out var assetId))
            plan.Add(new SearchStep(CounterPaymentSearchField.AssetId, CounterPaymentMatchType.Exact, assetId.ToString(CultureInfo.InvariantCulture)));

        plan.Add(new SearchStep(CounterPaymentSearchField.ShopNo, CounterPaymentMatchType.Exact, text));
        plan.Add(new SearchStep(CounterPaymentSearchField.AssetNo, CounterPaymentMatchType.Exact, text));

        if (text.Length < MinPartialLength)
            return plan;

        if (mobile == null && text.Length >= MinPartialMobileLength && text.All(char.IsAsciiDigit))
            plan.Add(new SearchStep(CounterPaymentSearchField.TenantMobile, CounterPaymentMatchType.Partial, text));

        plan.Add(new SearchStep(CounterPaymentSearchField.AssetNo, CounterPaymentMatchType.Partial, text));

        if (text.Any(char.IsLetter))
        {
            plan.Add(new SearchStep(CounterPaymentSearchField.TenantName, CounterPaymentMatchType.Partial, text));
            plan.Add(new SearchStep(CounterPaymentSearchField.ShopName, CounterPaymentMatchType.Partial, text));
            plan.Add(new SearchStep(CounterPaymentSearchField.AssetName, CounterPaymentMatchType.Partial, text));
        }

        return plan;
    }

    public async Task<AssetCounterPaymentSearchResponseDto> SearchAsync(
        string searchText,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var response = new AssetCounterPaymentSearchResponseDto { SearchText = NormalizeSearchText(searchText) };

        var plan = BuildSearchPlan(searchText);
        if (plan.Count == 0)
            return response;

        var leases = await GetSearchableLeasesAsync(userId, cancellationToken);
        if (leases == null)
            return response;

        foreach (var step in plan)
        {
            var matches = await ProjectResults(leases.Where(BuildPredicate(step)))
                .Take(MaxResults + 1)
                .ToListAsync(cancellationToken);

            if (matches.Count == 0)
                continue;

            response.MatchedBy = step.Field;
            response.MatchType = step.MatchType;
            response.HasMoreResults = matches.Count > MaxResults;
            response.Results = matches.Take(MaxResults).ToList();
            return response;
        }

        return response;
    }

    public async Task<AssetDemandDetailsDto?> GetDemandDetailsAsync(int assetId, CancellationToken cancellationToken = default)
    {
        var asset = await _assetRepository.GetQueryable().AsNoTracking()
            .Where(a => a.Id == assetId && !a.MarkedForDeletion)
            .Select(a => new { a.AssetNo, a.AssetName })
            .FirstOrDefaultAsync(cancellationToken);

        if (asset == null)
            return null;

        // Totals are summed from the amount columns rather than read from the PERSISTED
        // TotalDemandAmount/PendingAmount columns: same values on SQL Server, and the InMemory test
        // provider never computes those columns.
        var demands = await _demandRepository.GetQueryable().AsNoTracking()
            .Where(d => d.AssetId == assetId && d.IsActive && d.DemandStatus != DemandStatusCancelled)
            .OrderBy(d => d.DemandYear)
            .ThenBy(d => d.DemandMonth)
            .ThenBy(d => d.Id)
            .Select(d => new MonthWiseDemandDto
            {
                Id = d.Id,
                IsActive = d.IsActive,
                CreatedDate = d.CreatedDate,
                UpdatedDate = d.UpdatedDate,
                AssetId = d.AssetId,
                LeaseRegistrationId = d.LeaseRegistrationId,
                FinanceYear = d.FinanceYear,
                DemandYear = d.DemandYear,
                QuarterNo = d.QuarterNo,
                DemandMonth = d.DemandMonth,
                MonthlyRentAmount = d.MonthlyRentAmount,
                PenaltyRuleMasterId = d.PenaltyRuleMasterId,
                PenaltyAmount = d.PenaltyAmount,
                GSTMasterId = d.GSTMasterId,
                GSTAmount = d.GSTAmount,
                TotalDemandAmount = d.MonthlyRentAmount + d.PenaltyAmount + d.GSTAmount,
                PaidAmount = d.PaidAmount,
                PendingAmount = d.MonthlyRentAmount + d.PenaltyAmount + d.GSTAmount - d.PaidAmount,
                DemandStatus = d.DemandStatus,
                LastPaymentDate = d.LastPaymentDate,
                DueDate = d.DueDate
            })
            .ToListAsync(cancellationToken);

        var transactions = await _transactionRepository.GetQueryable().AsNoTracking()
            .Where(t => t.AssetId == assetId && t.IsActive)
            .OrderByDescending(t => t.PaymentDate)
            .ThenByDescending(t => t.Id)
            .Select(t => new CounterPaymentTransactionDto
            {
                Id = t.Id,
                Uuid = t.Uuid,
                TransactionNo = t.TransactionNo,
                ReceiptNo = t.ReceiptNo,
                LeaseRegistrationId = t.LeaseRegistrationId,
                FinanceYear = t.FinanceYear,
                TotalDemandAmount = t.TotalMonthlyRentAmount + t.TotalPenaltyAmount + t.TotalGSTAmount,
                DiscountAmount = t.DiscountAmount,
                AdjustmentAmount = t.AdjustmentAmount,
                // The PERSISTED NetPayableAmount column's formula (the informational discount isn't
                // subtracted), summed here because the InMemory test provider never computes it.
                NetPayableAmount = t.TotalMonthlyRentAmount + t.TotalPenaltyAmount + t.TotalGSTAmount + t.AdjustmentAmount,
                PaidAmount = t.PaidAmount,
                PaymentMode = t.PaymentMode,
                PaymentDate = t.PaymentDate,
                PaymentStatus = t.PaymentStatus
            })
            .ToListAsync(cancellationToken);

        if (transactions.Count > 0)
        {
            var transactionIds = transactions.Select(t => t.Id).ToList();
            var lines = await _transactionDetailRepository.GetQueryable().AsNoTracking()
                .Where(l => transactionIds.Contains(l.LeaseRentBillTransactionId) && l.IsActive)
                .OrderBy(l => l.DemandYear)
                .ThenBy(l => l.DemandMonth)
                .ThenBy(l => l.Id)
                .Select(l => new
                {
                    l.LeaseRentBillTransactionId,
                    Line = new BillReceiptLineDto
                    {
                        MonthWiseDemandId = l.MonthWiseDemandId,
                        DemandYear = l.DemandYear,
                        DemandMonth = l.DemandMonth,
                        CurrentPaidAmount = l.CurrentPaidAmount,
                        BalanceAmount = l.BalanceAmount,
                        PaymentStatus = l.PaymentStatus
                    }
                })
                .ToListAsync(cancellationToken);

            var linesByTransaction = lines.ToLookup(l => l.LeaseRentBillTransactionId, l => l.Line);
            foreach (var transaction in transactions)
                transaction.Lines = linesByTransaction[transaction.Id].ToList();
        }

        var today = _timeProvider.GetLocalNow();

        return new AssetDemandDetailsDto
        {
            AssetId = assetId,
            AssetNo = asset.AssetNo,
            AssetName = asset.AssetName,
            CurrentFinanceYear = _financeYearProvider.GetCurrentFinanceYear(),
            Summary = BuildSummary(demands, today.Year, today.Month),
            Demands = demands,
            Transactions = transactions
        };
    }

    public async Task<LeaseRentReceiptDto?> GetReceiptByUuidAsync(Guid uuid, CancellationToken cancellationToken = default)
    {
        var transaction = await _transactionRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(t => t.Uuid == uuid && t.IsActive, cancellationToken);
        if (transaction != null)
            return await BuildSettledReceiptAsync(transaction, cancellationToken);

        // Not a settled payment's UUID: it may be a cheque's, which stays valid after the cheque clears.
        var cheque = await _chequeRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(c => c.Uuid == uuid && c.IsActive, cancellationToken);
        if (cheque == null)
            return null;

        // A cleared cheque prints as the payment it was posted as (with that payment's UUID).
        if (cheque.Status == ChequeStatusCleared && cheque.LeaseRentBillTransactionId.HasValue)
        {
            var postedId = cheque.LeaseRentBillTransactionId.Value;
            var posted = await _transactionRepository.GetQueryable().AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == postedId && t.IsActive, cancellationToken);
            if (posted != null)
                return await BuildSettledReceiptAsync(posted, cancellationToken);
        }

        return await BuildChequeReceiptAsync(cheque, cancellationToken);
    }

    /// <summary>
    /// Receipt of a settled payment, with one line per month it settled (oldest first). The
    /// outstanding and remaining balance cover only those months. The remaining balance comes from
    /// the lines, not the header's PaidAmount: that is cash only, while a line's paid amount also
    /// counts wallet money, and cash beyond the dues went to the wallet rather than to these months.
    /// </summary>
    private async Task<LeaseRentReceiptDto> BuildSettledReceiptAsync(
        LeaseRentBillTransactionEntity transaction, CancellationToken cancellationToken)
    {
        // Left join: a line whose demand row is missing still prints, without a due date.
        var lines = await (
                from line in _transactionDetailRepository.GetQueryable().AsNoTracking()
                join demand in _demandRepository.GetQueryable().AsNoTracking()
                    on line.MonthWiseDemandId equals demand.Id into demands
                from demand in demands.DefaultIfEmpty()
                where line.LeaseRentBillTransactionId == transaction.Id && line.IsActive
                orderby line.DemandYear, line.DemandMonth, line.Id
                select new
                {
                    line.DemandYear,
                    line.DemandMonth,
                    DueAmount = line.MonthlyRentAmount + line.PenaltyAmount + line.GSTAmount - line.PreviousPaidAmount,
                    line.CurrentPaidAmount,
                    DueDate = demand != null ? demand.DueDate : null
                })
            .ToListAsync(cancellationToken);

        var paidDemands = lines
            .Select(l => new LeaseRentReceiptLineDto
            {
                Period = string.Create(CultureInfo.InvariantCulture, $"{l.DemandMonth:D2}/{l.DemandYear}"),
                Description = ReceiptLineDescription,
                DueDate = l.DueDate,
                DueAmount = l.DueAmount,
                PaidAmount = l.CurrentPaidAmount
            })
            .ToList();

        var outstanding = paidDemands.Sum(l => l.DueAmount);

        var receipt = new LeaseRentReceiptDto
        {
            Uuid = transaction.Uuid,
            ReceiptNo = transaction.ReceiptNo ?? transaction.TransactionNo,
            FinanceYear = transaction.FinanceYear,
            PaymentDate = transaction.PaymentDate,
            // The PERSISTED TotalDemandAmount column's formula, summed here because the InMemory test
            // provider never computes that column.
            TotalDemandAmount = transaction.TotalMonthlyRentAmount + transaction.TotalPenaltyAmount + transaction.TotalGSTAmount,
            TotalOutstandingBeforePayment = outstanding,
            PaidAmount = transaction.PaidAmount,
            RemainingBalance = Math.Max(0m, paidDemands.Sum(l => l.DueAmount - l.PaidAmount)),
            PaymentMode = transaction.PaymentMode,
            PaymentStatus = transaction.PaymentStatus,
            ChequeOrTransactionNo = transaction.ChequeOrTransactionNo,
            BankName = transaction.BankName,
            BranchName = transaction.BranchName,
            ChequeDate = transaction.ChequeDate,
            OnlineTransactionId = transaction.OnlineTransactionId,
            PaymentGatewayName = transaction.PaymentGatewayName,
            Remark = transaction.Remark,
            CreatedBy = transaction.CreatedBy,
            DDPayeeName = transaction.AccountHolderName,
            PaidDemands = paidDemands
        };

        await FillLeaseDetailsAsync(receipt, transaction, transaction.AssetId, transaction.LeaseRegistrationId, cancellationToken);
        return receipt;
    }

    /// <summary>
    /// Receipt of a cheque that hasn't been posted: no month lines (nothing is settled until it
    /// clears). The outstanding and remaining balance come from its staged allocations, like a settled
    /// receipt's from its lines: what each month owed at intake, less what the cheque pays into it.
    /// A cheque staged before intake recorded what each month owed falls back to its gross demand
    /// (overstated for a month that was already part-paid) less its cash and the wallet money it spends.
    /// </summary>
    private async Task<LeaseRentReceiptDto> BuildChequeReceiptAsync(
        ChequePaymentTransactionEntity cheque, CancellationToken cancellationToken)
    {
        var total = cheque.TotalMonthlyRentAmount + cheque.TotalPenaltyAmount + cheque.TotalGSTAmount;

        var allocations = string.IsNullOrWhiteSpace(cheque.AllocationsJson)
            ? new List<ChequeAllocation>()
            : JsonSerializer.Deserialize<List<ChequeAllocation>>(cheque.AllocationsJson) ?? new List<ChequeAllocation>();

        decimal outstanding, remaining;
        if (allocations.Count > 0 && allocations.All(a => a.OutstandingAmount.HasValue))
        {
            outstanding = allocations.Sum(a => a.OutstandingAmount!.Value);
            remaining = Math.Max(0m, allocations.Sum(a => a.OutstandingAmount!.Value - a.PayAmount));
        }
        else
        {
            outstanding = total;
            remaining = total + cheque.AdjustmentAmount - cheque.PaidAmount;
        }

        var receipt = new LeaseRentReceiptDto
        {
            Uuid = cheque.Uuid,
            ReceiptNo = cheque.AcknowledgementNo,
            FinanceYear = cheque.FinanceYear,
            PaymentDate = cheque.PaymentDate,
            TotalDemandAmount = total,
            TotalOutstandingBeforePayment = outstanding,
            PaidAmount = cheque.PaidAmount,
            RemainingBalance = remaining,
            PaymentMode = PaymentModeCheque,
            PaymentStatus = cheque.Status,
            ChequeOrTransactionNo = cheque.ChequeOrTransactionNo,
            BankName = cheque.BankName,
            BranchName = cheque.BranchName,
            ChequeDate = cheque.ChequeDate,
            OnlineTransactionId = null,
            PaymentGatewayName = null,
            Remark = cheque.Remark,
            CreatedBy = cheque.CreatedBy,
            DDPayeeName = cheque.AccountHolderName
        };

        await FillLeaseDetailsAsync(receipt, cheque, cheque.AssetId, cheque.LeaseRegistrationId, cancellationToken);
        return receipt;
    }

    /// <summary>
    /// Copies the asset, lease and tenant details onto the receipt as they were when the payment was
    /// taken: the asset by the payment's own AssetId (the lease may since have moved to another asset),
    /// the lease and tenant from the snapshot recorded on the payment. A payment taken before that
    /// snapshot existed falls back to the current lease. Neither lookup is filtered on IsActive: a
    /// receipt stays printable after its lease or asset is deactivated. Anything not found leaves the
    /// receipt's defaults: empty text, zero amounts, null dates.
    /// </summary>
    private async Task FillLeaseDetailsAsync(
        LeaseRentReceiptDto receipt, IPaymentLeaseSnapshot payment, int assetId, int leaseRegistrationId,
        CancellationToken cancellationToken)
    {
        var asset = await _assetRepository.GetQueryable().AsNoTracking()
            .Where(a => a.Id == assetId)
            .Select(a => new { a.AssetNo, a.AssetName })
            .FirstOrDefaultAsync(cancellationToken);
        if (asset != null)
        {
            receipt.AssetNo = asset.AssetNo;
            receipt.AssetName = asset.AssetName;
        }

        if (payment.Snap_TenantName != null)
        {
            receipt.AgreementId = payment.Snap_AgreementId;
            receipt.TenantName = payment.Snap_TenantName;
            receipt.TenantMobile = payment.Snap_TenantMobile ?? string.Empty;
            receipt.LeaseStartDate = payment.Snap_LeaseStartDate;
            receipt.LeaseEndDate = payment.Snap_LeaseEndDate;
            receipt.MonthlyRent = payment.Snap_RentAmount ?? 0m;
            receipt.SecurityDeposit = payment.Snap_SecurityDeposit ?? 0m;
            return;
        }

        var lease = await _leaseRepository.GetQueryable().AsNoTracking()
            .Where(l => l.Id == leaseRegistrationId)
            .Select(l => new
            {
                l.AgreementId,
                l.TenantName,
                l.TenantMobile,
                l.LeaseStartDate,
                l.LeaseEndDate,
                l.RentAmount,
                l.SecurityDeposit
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (lease == null)
            return;

        receipt.AgreementId = lease.AgreementId;
        receipt.TenantName = lease.TenantName;
        receipt.TenantMobile = lease.TenantMobile;
        receipt.LeaseStartDate = lease.LeaseStartDate;
        receipt.LeaseEndDate = lease.LeaseEndDate;
        receipt.MonthlyRent = lease.RentAmount ?? 0m;
        receipt.SecurityDeposit = lease.SecurityDeposit;
    }

    /// <summary>
    /// Pending (Arrears) is the demand of every month before the current calendar month; Current Due
    /// is the current month's demand; Total is the two together. A month after the current one
    /// (raised in advance) isn't due yet: it is listed in Demands but left out of the summary.
    /// </summary>
    private static DemandCollectionSummaryDto BuildSummary(IEnumerable<MonthWiseDemandDto> demands, int currentYear, int currentMonth)
    {
        var summary = new DemandCollectionSummaryDto();
        var currentPeriod = currentYear * 12 + currentMonth;

        foreach (var demand in demands)
        {
            var period = demand.DemandYear * 12 + demand.DemandMonth;
            if (period > currentPeriod)
                continue;

            AddDemand(period < currentPeriod ? summary.Arrears : summary.CurrentDue, demand);
            AddDemand(summary.Total, demand);
        }

        return summary;
    }

    private static void AddDemand(DemandCollectionAmountsDto row, MonthWiseDemandDto demand)
    {
        row.Demand += demand.TotalDemandAmount;
        row.Paid += demand.PaidAmount;
        row.Due += demand.PendingAmount;
    }

    private static string NormalizeSearchText(string? searchText)
        => string.IsNullOrWhiteSpace(searchText) ? string.Empty : Regex.Replace(searchText.Trim(), @"\s+", " ");

    /// <summary>
    /// Returns the bare 10-digit mobile when <paramref name="text"/> is an Indian mobile number,
    /// written as "9876543210", "98765 43210", "+91-9876543210", "919876543210" or "09876543210".
    /// </summary>
    private static string? TryNormalizeMobile(string text)
    {
        var digits = text.Replace(" ", string.Empty).Replace("-", string.Empty);
        if (digits.StartsWith('+'))
            digits = digits[1..];

        if (digits.Length == 0 || !digits.All(char.IsAsciiDigit))
            return null;

        if (digits.Length == 12 && digits.StartsWith("91", StringComparison.Ordinal))
            digits = digits[2..];
        else if (digits.Length == 11 && digits[0] == '0')
            digits = digits[1..];

        return digits.Length == 10 && digits[0] is >= '6' and <= '9' ? digits : null;
    }

    /// <summary>
    /// Approved, active leases on active assets, narrowed to the caller's departments. Same rule as
    /// AssetLeaseRentDetailsService.CanUserAccessAssetAsync, applied to the whole list: the caller
    /// needs an active UserRoleAllocation for the asset's department, and an asset with no
    /// department is visible to Admins only. Returns null when the caller can see no department.
    /// </summary>
    private async Task<IQueryable<LeaseAssetRow>?> GetSearchableLeasesAsync(int userId, CancellationToken cancellationToken)
    {
        var leases =
            from lease in _leaseRepository.GetQueryable().AsNoTracking()
            join asset in _assetRepository.GetQueryable().AsNoTracking() on lease.AssetId equals asset.Id
            where lease.IsActive && !lease.MarkedForDeletion && lease.WorkflowStatus == StatusApproved
                && asset.IsActive && !asset.MarkedForDeletion
            select new LeaseAssetRow { Lease = lease, Asset = asset };

        if (await _userAccessRepository.IsAdminAsync(userId, cancellationToken))
            return leases;

        var departmentIds = await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive)
            .Select(x => x.DepartmentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (departmentIds.Count == 0)
            return null;

        return leases.Where(x => x.Asset.DepartmentId != null && departmentIds.Contains(x.Asset.DepartmentId.Value));
    }

    private static Expression<Func<LeaseAssetRow, bool>> BuildPredicate(SearchStep step)
    {
        var value = step.Value;

        return (step.Field, step.MatchType) switch
        {
            // EndsWith so a mobile stored with a +91 / 0 prefix still matches the bare 10 digits.
            (CounterPaymentSearchField.TenantMobile, CounterPaymentMatchType.Exact) => x => x.Lease.TenantMobile.EndsWith(value),
            (CounterPaymentSearchField.TenantMobile, CounterPaymentMatchType.Partial) => x => x.Lease.TenantMobile.Contains(value),
            (CounterPaymentSearchField.AssetId, CounterPaymentMatchType.Exact) => BuildAssetIdPredicate(int.Parse(value, CultureInfo.InvariantCulture)),
            (CounterPaymentSearchField.ShopNo, CounterPaymentMatchType.Exact) => x => x.Lease.ShopNo == value,
            (CounterPaymentSearchField.AssetNo, CounterPaymentMatchType.Exact) => x => x.Asset.AssetNo == value,
            (CounterPaymentSearchField.AssetNo, CounterPaymentMatchType.Partial) => x => x.Asset.AssetNo.Contains(value),
            (CounterPaymentSearchField.TenantName, CounterPaymentMatchType.Partial) => x => x.Lease.TenantName.Contains(value),
            (CounterPaymentSearchField.ShopName, CounterPaymentMatchType.Partial) => x => x.Lease.ShopName != null && x.Lease.ShopName.Contains(value),
            (CounterPaymentSearchField.AssetName, CounterPaymentMatchType.Partial) => x => x.Asset.AssetName.Contains(value),
            _ => throw new ArgumentOutOfRangeException(nameof(step), $"Unsupported search step {step.Field}/{step.MatchType}.")
        };
    }

    // Parsed once here so the SQL compares the int column to an int parameter.
    private static Expression<Func<LeaseAssetRow, bool>> BuildAssetIdPredicate(int assetId)
        => x => x.Lease.AssetId == assetId;

    private IQueryable<AssetCounterPaymentSearchResultDto> ProjectResults(IQueryable<LeaseAssetRow> rows)
        => from row in rows
           join parent in _assetRepository.GetQueryable().AsNoTracking()
               on row.Asset.ParentAssetId equals (int?)parent.Id into parents
           from parent in parents.DefaultIfEmpty()
           orderby row.Lease.TenantName, row.Asset.AssetNo, row.Lease.Id
           select new AssetCounterPaymentSearchResultDto
           {
               LeaseRentDetailsId = row.Lease.Id,
               AssetId = row.Asset.Id,
               AssetNo = row.Asset.AssetNo,
               AssetName = row.Asset.AssetName,
               ParentAssetId = row.Asset.ParentAssetId,
               ParentAssetName = parent != null ? parent.AssetName : null,
               ShopNo = row.Lease.ShopNo,
               ShopName = row.Lease.ShopName,
               TenantName = row.Lease.TenantName,
               TenantMobile = row.Lease.TenantMobile,
               TenantEmail = row.Lease.TenantEmail,
               LeaseType = row.Lease.LeaseType,
               RentAmount = row.Lease.RentAmount,
               PaymentFrequency = row.Lease.PaymentFrequency,
               LeaseStartDate = row.Lease.LeaseStartDate,
               LeaseEndDate = row.Lease.LeaseEndDate
           };

    private sealed class LeaseAssetRow
    {
        public AssetLeaseRentDetailsEntity Lease { get; init; } = null!;
        public AssetMasterEntity Asset { get; init; } = null!;
    }
}
