using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Lease-rent bill payment. A payment posts one ledger header (LeaseRentBillTransactions) plus one
/// detail line per settled month, and updates the month-wise demands and the tenant's wallet
/// (AdvanceBalance) in the same database transaction. Cheques are staged in
/// ChequePaymentTransactions and posted the same way only when they clear.
///
/// Errors: the message is the error code. PaymentRuleException (an InvalidOperationException) maps to
/// 400 and PaymentNotFoundException (a KeyNotFoundException) to 404 in GlobalExceptionHandlerMiddleware,
/// which returns their code in every environment.
///
/// Concurrency: MonthWiseDemand.PaidAmount, AssetLeaseRentDetails.AdvanceBalance and
/// ChequePaymentTransactions.Status are EF concurrency tokens, so a payment whose demand, wallet or
/// cheque was changed by another request after it was read fails as a whole with
/// Payment_Concurrency_Demand_Modified instead of settling the same month (or spending the same
/// advance) twice.
/// </summary>
public class LeaseRentBillingService : ILeaseRentBillingService
{
    // Amount comparisons are exact: every amount is a decimal with at most two places (request amounts
    // are validated to that; stored amounts and re-priced penalties are already rounded to it), so
    // there is no rounding error to allow for, and any slack would let a paisa go unpaid or uncredited.

    /// <summary>A concurrent request changed a demand, the wallet or the cheque first; nothing was saved.</summary>
    public const string ConcurrencyConflictCode = "Payment_Concurrency_Demand_Modified";

    private const string LeaseStatusApproved = "Approved";

    private const string PaymentTypePartial = "Partial";
    private const string PaymentTypeMonthwise = "Monthwise";
    private const string PaymentTypeAdvance = "Advance";

    private const string PaymentModeCheque = "Cheque";
    private const string PaymentModeOnline = "Online";

    private const string PaymentStatusSuccess = "Success";

    private const string DemandStatusPaid = "Paid";
    private const string DemandStatusPartial = "Partial";
    private const string DemandStatusCancelled = "Cancelled";

    private const string ChequeReceived = "Received";
    private const string ChequeDeposited = "Deposited";
    private const string ChequeCleared = "Cleared";
    private const string ChequeBounced = "Bounced";

    // Forward only: Received → Deposited → Cleared, or → Bounced from Received/Deposited.
    // Cleared and Bounced are terminal.
    private static readonly IReadOnlyDictionary<string, string[]> ChequeTransitions = new Dictionary<string, string[]>
    {
        [ChequeReceived] = new[] { ChequeDeposited, ChequeBounced },
        [ChequeDeposited] = new[] { ChequeCleared, ChequeBounced },
    };

    private const string TransactionNoPrefix = "TXN";
    private const string ReceiptNoPrefix = "RCPT";
    private const string ChequeAcknowledgementPrefix = "CHQ";

    private readonly IRepository<LeaseRentBillTransactionEntity, int> _transactionRepository;
    private readonly IRepository<LeaseRentBillTransactionDetailEntity, int> _detailRepository;
    private readonly IRepository<MonthWiseDemandEntity, int> _demandRepository;
    private readonly IRepository<AssetLeaseRentDetailsEntity, int> _leaseRepository;
    private readonly IRepository<PenaltyRuleMasterEntity, int> _penaltyRepository;
    private readonly IRepository<ChequePaymentTransactionEntity, int> _chequeRepository;
    private readonly ILeaseRentNumberGenerator _numberGenerator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public LeaseRentBillingService(
        IRepository<LeaseRentBillTransactionEntity, int> transactionRepository,
        IRepository<LeaseRentBillTransactionDetailEntity, int> detailRepository,
        IRepository<MonthWiseDemandEntity, int> demandRepository,
        IRepository<AssetLeaseRentDetailsEntity, int> leaseRepository,
        IRepository<PenaltyRuleMasterEntity, int> penaltyRepository,
        IRepository<ChequePaymentTransactionEntity, int> chequeRepository,
        ILeaseRentNumberGenerator numberGenerator,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _transactionRepository = transactionRepository;
        _detailRepository = detailRepository;
        _demandRepository = demandRepository;
        _leaseRepository = leaseRepository;
        _penaltyRepository = penaltyRepository;
        _chequeRepository = chequeRepository;
        _numberGenerator = numberGenerator;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    /// <summary>One demand this payment settles and the amount it pays into it.</summary>
    private sealed record Allocation(MonthWiseDemandEntity Demand, decimal PayAmount);

    /// <summary>What <see cref="ResolveAndValidateAsync"/> hands to the write side.</summary>
    private sealed record ResolvedPayment(
        AssetLeaseRentDetailsEntity Lease,
        IReadOnlyList<Allocation> Allocations,
        DateTime PaymentDate,
        int FinanceYear);

    /// <summary>
    /// Header values of one posting, from a counter request or from a cleared cheque. Cash is the
    /// money actually tendered (never negative); a negative AdjustmentAmount is wallet money spent.
    /// </summary>
    private sealed record PostingDetails(
        string PaymentMode,
        DateTime PaymentDate,
        int FinanceYear,
        decimal Cash,
        decimal DiscountAmount,
        decimal AdjustmentAmount,
        string? BankName,
        string? BranchName,
        string? ChequeOrTransactionNo,
        DateTime? ChequeDate,
        string? OnlineTransactionId,
        string? PaymentGatewayName,
        string? AccountHolderName,
        string? PayerMobile,
        string? PayerEmail,
        string? Remark);

    public async Task<BillReceiptDto> ProcessPaymentAsync(
        int leaseId, CreateBillPaymentDto dto, int userId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.PaymentMode == PaymentModeCheque)
            throw new PaymentRuleException("Payment_Cheque_UseProcessChequePaymentAsync");

        // An Online payment is only complete once a gateway confirms the capture, and only an
        // in-process gateway flow may post it; the counter can't vouch for it.
        if (dto.PaymentMode == PaymentModeOnline)
            throw new PaymentRuleException("Payment_Online_NotAllowed");

        EnsureValid(dto);

        try
        {
            var resolved = await ResolveAndValidateAsync(leaseId, dto, trackForUpdate: true, cancellationToken);

            var posting = new PostingDetails(
                dto.PaymentMode,
                resolved.PaymentDate,
                resolved.FinanceYear,
                Math.Max(dto.PaidAmount, 0m),
                dto.DiscountAmount,
                dto.AdjustmentAmount,
                dto.BankName,
                dto.BranchName,
                dto.ChequeOrTransactionNo,
                dto.ChequeDate?.Date,
                dto.OnlineTransactionId,
                dto.PaymentGatewayName,
                dto.DDPayeeName,
                dto.PayerMobile,
                dto.PayerEmail,
                dto.Remark);

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            var (header, lines) = await PostSettlementAsync(resolved.Lease, resolved.Allocations, posting, userId, stagedSnapshot: null, cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            var totalDemand = header.TotalMonthlyRentAmount + header.TotalPenaltyAmount + header.TotalGSTAmount;
            return new BillReceiptDto
            {
                TransactionId = header.Id,
                Uuid = header.Uuid,
                TransactionNo = header.TransactionNo,
                ReceiptNo = header.ReceiptNo,
                PaymentType = dto.PaymentType,
                PaymentDate = header.PaymentDate,
                TotalDemandAmount = totalDemand,
                DiscountAmount = header.DiscountAmount,
                AdjustmentAmount = header.AdjustmentAmount,
                // Same formula as the header's PERSISTED NetPayableAmount column: the discount is
                // informational (it never reduces what must be paid), so it isn't subtracted.
                NetPayableAmount = totalDemand + header.AdjustmentAmount,
                PaidAmount = header.PaidAmount,
                TenantName = resolved.Lease.TenantName,
                Lines = lines
            };
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await AbortAsync();
            throw new PaymentRuleException(ConcurrencyConflictCode, ex);
        }
        catch
        {
            await AbortAsync();
            throw;
        }
    }

    public async Task<ChequeAcknowledgementDto> ProcessChequePaymentAsync(
        int leaseId, CreateBillPaymentDto dto, int userId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.PaymentMode != PaymentModeCheque)
            throw new PaymentRuleException("Payment_PaymentMode_Invalid");

        // A cheque must settle specific months when it clears; a pure wallet top-up by cheque isn't supported.
        if (dto.PaymentType == PaymentTypeAdvance)
            throw new PaymentRuleException("Payment_Cheque_Advance_NotSupported");

        EnsureValid(dto);

        try
        {
            // Untracked: intake prices the demands (penalty included) but must not write to them.
            var resolved = await ResolveAndValidateAsync(leaseId, dto, trackForUpdate: false, cancellationToken);
            var allocations = resolved.Allocations;

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            var cheque = new ChequePaymentTransactionEntity
            {
                AcknowledgementNo = await NextNumberAsync(ChequeAcknowledgementPrefix, cancellationToken),
                AssetId = resolved.Lease.AssetId,
                LeaseRegistrationId = leaseId,
                FinanceYear = resolved.FinanceYear,
                PaymentType = dto.PaymentType,
                TotalMonthlyRentAmount = allocations.Sum(a => a.Demand.MonthlyRentAmount),
                TotalPenaltyAmount = allocations.Sum(a => a.Demand.PenaltyAmount),
                TotalGSTAmount = allocations.Sum(a => a.Demand.GSTAmount),
                DiscountAmount = dto.DiscountAmount,
                AdjustmentAmount = dto.AdjustmentAmount,
                PaidAmount = Math.Max(dto.PaidAmount, 0m),
                AllocationsJson = JsonSerializer.Serialize(allocations.Select(a => new ChequeAllocation
                {
                    MonthWiseDemandId = a.Demand.Id,
                    PayAmount = a.PayAmount,
                    PenaltyAmount = a.Demand.PenaltyAmount,
                    OutstandingAmount = GetPendingAmount(a.Demand)
                })),
                PaymentDate = resolved.PaymentDate,
                BankName = dto.BankName!.Trim(),
                BranchName = dto.BranchName,
                ChequeOrTransactionNo = dto.ChequeOrTransactionNo!.Trim(),
                ChequeDate = dto.ChequeDate!.Value.Date,
                AccountHolderName = dto.DDPayeeName,
                PayerMobile = dto.PayerMobile,
                PayerEmail = dto.PayerEmail,
                Status = ChequeReceived,
                Remark = dto.Remark,
                CreatedBy = userId,
                IsActive = true
            };
            CaptureLeaseSnapshot(cheque, resolved.Lease);

            await _chequeRepository.AddAsync(cheque, cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return new ChequeAcknowledgementDto
            {
                Id = cheque.Id,
                Uuid = cheque.Uuid,
                AcknowledgementNo = cheque.AcknowledgementNo,
                PaymentType = cheque.PaymentType,
                PaymentDate = cheque.PaymentDate,
                PaidAmount = cheque.PaidAmount,
                BankName = cheque.BankName,
                ChequeOrTransactionNo = cheque.ChequeOrTransactionNo,
                ChequeDate = cheque.ChequeDate,
                Status = cheque.Status
            };
        }
        catch
        {
            await AbortAsync();
            throw;
        }
    }

    public async Task UpdateChequeStatusAsync(
        int leaseId, int chequeTransactionId, UpdateChequeStatusDto dto, int userId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        EnsureValid(dto);

        try
        {
            var cheque = await _chequeRepository.GetQueryable()
                .FirstOrDefaultAsync(c => c.Id == chequeTransactionId && c.LeaseRegistrationId == leaseId && c.IsActive, cancellationToken)
                ?? throw new PaymentNotFoundException("Payment_Transaction_NotFound");

            if (!ChequeTransitions.TryGetValue(cheque.Status, out var allowedNext) || !allowedNext.Contains(dto.Status))
                throw new PaymentRuleException("Payment_ChequeStatus_InvalidTransition");

            if (dto.Status == ChequeCleared)
            {
                await ClearChequeAsync(cheque, userId, cancellationToken);
                return;
            }

            // Deposited / Bounced: a status change only, nothing is posted.
            cheque.Status = dto.Status;
            if (dto.Status == ChequeBounced)
                cheque.BounceReason = dto.Reason?.Trim();
            cheque.UpdatedBy = userId;

            await _chequeRepository.UpdateAsync(cheque, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await AbortAsync();
            throw new PaymentRuleException(ConcurrencyConflictCode, ex);
        }
        catch
        {
            await AbortAsync();
            throw;
        }
    }

    /// <summary>
    /// Posts a cheque that has just cleared: replays its intake allocations verbatim (not re-resolved,
    /// not re-priced — each demand gets back the penalty it was priced with at intake) through the same
    /// write side as a counter payment, then marks the cheque Cleared and links the posted header.
    /// </summary>
    private async Task ClearChequeAsync(ChequePaymentTransactionEntity cheque, int userId, CancellationToken cancellationToken)
    {
        var lease = await _leaseRepository.GetQueryable()
            .FirstOrDefaultAsync(l => l.Id == cheque.LeaseRegistrationId, cancellationToken)
            ?? throw new PaymentNotFoundException("LeaseRent_NotFound");

        var staged = string.IsNullOrWhiteSpace(cheque.AllocationsJson)
            ? new List<ChequeAllocation>()
            : JsonSerializer.Deserialize<List<ChequeAllocation>>(cheque.AllocationsJson) ?? new List<ChequeAllocation>();
        if (staged.Count == 0)
            throw new PaymentRuleException("Payment_Allocations_Required");

        var demandIds = staged.Select(a => a.MonthWiseDemandId).ToList();
        var demandById = await _demandRepository.GetQueryable()
            .Where(d => demandIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, cancellationToken);

        var allocations = new List<Allocation>(staged.Count);
        foreach (var item in staged)
        {
            if (!demandById.TryGetValue(item.MonthWiseDemandId, out var demand))
                throw new PaymentNotFoundException("Payment_Demand_NotFound");
            if (!demand.IsActive || demand.DemandStatus == DemandStatusCancelled)
                throw new PaymentRuleException("Payment_Demand_NotPayable");

            if (item.PenaltyAmount.HasValue)
                demand.PenaltyAmount = item.PenaltyAmount.Value;

            if (item.PayAmount > GetPendingAmount(demand))
                throw new PaymentRuleException("Payment_Amount_Exceeds_Pending");

            allocations.Add(new Allocation(demand, item.PayAmount));
        }

        // The wallet may have been spent since intake; posting must not take it below zero.
        if (GetWalletUsed(cheque.AdjustmentAmount) > lease.AdvanceBalance)
            throw new PaymentRuleException("Payment_Adjustment_Exceeds_Advance");

        var posting = new PostingDetails(
            PaymentModeCheque,
            cheque.PaymentDate,
            cheque.FinanceYear,
            cheque.PaidAmount,
            cheque.DiscountAmount,
            cheque.AdjustmentAmount,
            cheque.BankName,
            cheque.BranchName,
            cheque.ChequeOrTransactionNo,
            cheque.ChequeDate,
            OnlineTransactionId: null,
            PaymentGatewayName: null,
            cheque.AccountHolderName,
            cheque.PayerMobile,
            cheque.PayerEmail,
            cheque.Remark);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        var (header, _) = await PostSettlementAsync(lease, allocations, posting, userId, stagedSnapshot: cheque, cancellationToken);

        cheque.Status = ChequeCleared;
        cheque.LeaseRentBillTransactionId = header.Id;
        cheque.UpdatedBy = userId;
        await _chequeRepository.UpdateAsync(cheque, cancellationToken);

        await _unitOfWork.CommitTransactionAsync(cancellationToken);
    }

    /// <summary>
    /// Loads the lease, resolves which demands the payment settles and how much goes to each, and runs
    /// every pre-write validation. Shared by the counter and the cheque paths; they differ only in what
    /// they write. <paramref name="trackForUpdate"/> loads the lease and demands tracked so the write
    /// side updates them (with their re-priced penalty); cheque intake reads them untracked.
    /// </summary>
    private async Task<ResolvedPayment> ResolveAndValidateAsync(
        int leaseId, CreateBillPaymentDto dto, bool trackForUpdate, CancellationToken cancellationToken)
    {
        // Step 1: the lease.
        var leaseQuery = _leaseRepository.GetQueryable();
        if (!trackForUpdate)
            leaseQuery = leaseQuery.AsNoTracking();

        var lease = await leaseQuery.FirstOrDefaultAsync(l => l.Id == leaseId && l.IsActive && !l.MarkedForDeletion, cancellationToken)
            ?? throw new PaymentNotFoundException("LeaseRent_NotFound");
        if (lease.WorkflowStatus != LeaseStatusApproved)
            throw new PaymentRuleException("Payment_LeaseNotApproved");

        // The date drives the penalty: a future date or one before the lease began is never valid.
        var paymentDate = (dto.PaymentDate ?? throw new PaymentRuleException("Payment_PaymentDate_Required")).Date;
        if (paymentDate > _timeProvider.GetLocalNow().Date || paymentDate < lease.LeaseStartDate.Date)
            throw new PaymentRuleException("Payment_PaymentDate_Invalid");

        // Step 2: demands and allocations for the payment type. storedPenalties holds the penalty each
        // re-priced demand had before re-pricing.
        List<Allocation> allocations;
        IReadOnlyDictionary<MonthWiseDemandEntity, decimal> storedPenalties;
        switch (dto.PaymentType)
        {
            case PaymentTypePartial:
            {
                if (dto.CustomAmount <= 0m)
                    throw new PaymentRuleException("Payment_CustomAmount_Required");

                var demands = await LoadPendingDemandsAsync(leaseId, trackForUpdate, cancellationToken);
                if (demands.Count == 0)
                    throw new PaymentRuleException("Payment_NoPendingDemands");

                // Allocations sent with a Custom Amount narrow the distribution to those months, each of
                // which must be a pending demand of this lease. Ids below 1 are placeholders and ignored.
                var narrowTo = (dto.Allocations ?? new List<BillPaymentAllocationDto>())
                    .Select(a => a.MonthWiseDemandId)
                    .Where(id => id >= 1)
                    .ToHashSet();
                if (narrowTo.Count > 0)
                {
                    if (narrowTo.Any(id => demands.All(d => d.Id != id)))
                        throw new PaymentRuleException("Payment_Allocation_Invalid");
                    demands = demands.Where(d => narrowTo.Contains(d.Id)).ToList();
                }

                storedPenalties = await RecalculatePenaltiesAsync(demands, paymentDate, cancellationToken);

                if (dto.CustomAmount > demands.Sum(GetPendingAmount))
                    throw new PaymentRuleException("Payment_Amount_Exceeds_Pending");

                allocations = DistributeOldestFirst(demands, dto.CustomAmount);
                break;
            }

            case PaymentTypeMonthwise:
            {
                if (dto.Allocations == null || dto.Allocations.Count == 0)
                    throw new PaymentRuleException("Payment_Allocations_Required");

                var demandIds = dto.Allocations.Select(a => a.MonthWiseDemandId).ToList();
                if (demandIds.Distinct().Count() != demandIds.Count)
                    throw new PaymentRuleException("Payment_DuplicateAllocation");

                // By id only — no lease or status filter; every row is validated in step 3.
                var demandQuery = _demandRepository.GetQueryable();
                if (!trackForUpdate)
                    demandQuery = demandQuery.AsNoTracking();
                var demands = await demandQuery
                    .Where(d => demandIds.Contains(d.Id))
                    .OrderBy(d => d.DemandYear)
                    .ThenBy(d => d.DemandMonth)
                    .ThenBy(d => d.Id)
                    .ToListAsync(cancellationToken);

                if (demands.Count != demandIds.Count)
                    throw new PaymentNotFoundException("Payment_Demand_NotFound");

                storedPenalties = await RecalculatePenaltiesAsync(demands, paymentDate, cancellationToken);
                allocations = demands.Select(d => new Allocation(d, GetPendingAmount(d))).ToList();
                break;
            }

            default: // Full; Advance is Full that may also run with nothing pending (a pure wallet top-up).
            {
                var demands = await LoadPendingDemandsAsync(leaseId, trackForUpdate, cancellationToken);
                if (demands.Count == 0 && dto.PaymentType != PaymentTypeAdvance)
                    throw new PaymentRuleException("Payment_NoPendingDemands");

                storedPenalties = await RecalculatePenaltiesAsync(demands, paymentDate, cancellationToken);
                allocations = demands.Select(d => new Allocation(d, GetPendingAmount(d))).ToList();
                break;
            }
        }

        // Only the months this payment settles carry their re-priced penalty into the save; one it
        // doesn't reach (e.g. beyond a Custom Amount) keeps its stored penalty.
        var allocated = allocations.Select(a => a.Demand).ToHashSet();
        foreach (var (demand, storedPenalty) in storedPenalties)
        {
            if (!allocated.Contains(demand))
                demand.PenaltyAmount = storedPenalty;
        }

        // Step 3: every allocation must be payable.
        foreach (var allocation in allocations)
        {
            var demand = allocation.Demand;
            if (!demand.IsActive || demand.DemandStatus == DemandStatusCancelled)
                throw new PaymentRuleException("Payment_Demand_NotPayable");
            if (demand.LeaseRegistrationId != leaseId)
                throw new PaymentRuleException("Payment_Demand_LeaseMismatch");
            if (demand.DemandStatus == DemandStatusPaid || GetPendingAmount(demand) <= 0m)
                throw new PaymentRuleException("Payment_Demand_AlreadyPaid");
            if (allocation.PayAmount > GetPendingAmount(demand))
                throw new PaymentRuleException("Payment_Amount_Exceeds_Pending");
        }

        // Step 4: the money handed over (cash + wallet spent) must cover every rupee marked paid.
        var walletUsed = GetWalletUsed(dto.AdjustmentAmount);
        var cash = Math.Max(dto.PaidAmount, 0m);
        var buyingPower = cash + walletUsed;
        var totalAllocated = allocations.Sum(a => a.PayAmount);

        if (walletUsed > lease.AdvanceBalance)
            throw new PaymentRuleException("Payment_Adjustment_Exceeds_Advance");
        if (buyingPower <= 0m && dto.PaymentType != PaymentTypeAdvance)
            throw new PaymentRuleException("Payment_Zero_Amount_Not_Allowed");
        if (dto.PaymentType == PaymentTypeAdvance && cash <= 0m)
            throw new PaymentRuleException("Payment_Advance_Requires_Cash");
        if (buyingPower < totalAllocated)
            throw new PaymentRuleException("Payment_Insufficient_Funds");

        // Step 5: finance year of the oldest month settled, else of the payment date.
        var financeYear = allocations.Count > 0
            ? allocations[0].Demand.FinanceYear
            : GetFinanceYear(paymentDate);

        return new ResolvedPayment(lease, allocations, paymentDate, financeYear);
    }

    /// <summary>
    /// The write side shared by a counter payment and a cheque clearance; runs inside the caller's
    /// transaction. Numbers the payment, inserts the header, one detail per allocation (updating each
    /// demand's collection state and re-priced penalty), then moves the wallet: spent advance comes
    /// off, money beyond the dues settled goes on. The lease and demands must be tracked.
    /// <paramref name="stagedSnapshot"/> is the cheque being cleared: its receipt details, recorded
    /// when it was received, carry over to the header; otherwise they are taken from the lease now.
    /// </summary>
    private async Task<(LeaseRentBillTransactionEntity Header, List<BillReceiptLineDto> Lines)> PostSettlementAsync(
        AssetLeaseRentDetailsEntity lease, IReadOnlyList<Allocation> allocations, PostingDetails posting, int userId,
        IPaymentLeaseSnapshot? stagedSnapshot, CancellationToken cancellationToken)
    {
        var header = new LeaseRentBillTransactionEntity
        {
            TransactionNo = await NextNumberAsync(TransactionNoPrefix, cancellationToken),
            ReceiptNo = await NextNumberAsync(ReceiptNoPrefix, cancellationToken),
            AssetId = lease.AssetId,
            LeaseRegistrationId = lease.Id,
            FinanceYear = posting.FinanceYear,
            // Gross rent / penalty / GST of every month touched, not just the portion settled now.
            TotalMonthlyRentAmount = allocations.Sum(a => a.Demand.MonthlyRentAmount),
            TotalPenaltyAmount = allocations.Sum(a => a.Demand.PenaltyAmount),
            TotalGSTAmount = allocations.Sum(a => a.Demand.GSTAmount),
            DiscountAmount = posting.DiscountAmount,
            AdjustmentAmount = posting.AdjustmentAmount,
            PaidAmount = posting.Cash,
            PaymentMode = posting.PaymentMode,
            PaymentDate = posting.PaymentDate,
            BankName = posting.BankName,
            BranchName = posting.BranchName,
            ChequeOrTransactionNo = posting.ChequeOrTransactionNo,
            ChequeDate = posting.ChequeDate,
            OnlineTransactionId = posting.OnlineTransactionId,
            PaymentGatewayName = posting.PaymentGatewayName,
            AccountHolderName = posting.AccountHolderName,
            PayerMobile = posting.PayerMobile,
            PayerEmail = posting.PayerEmail,
            PaymentStatus = PaymentStatusSuccess,
            Remark = posting.Remark,
            CreatedBy = userId,
            IsActive = true
        };

        // A cheque staged before receipt details were recorded has none to carry over.
        if (stagedSnapshot?.Snap_TenantName != null)
            CopyLeaseSnapshot(stagedSnapshot, header);
        else
            CaptureLeaseSnapshot(header, lease);

        await _transactionRepository.AddAsync(header, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var lines = new List<BillReceiptLineDto>(allocations.Count);
        foreach (var (demand, payAmount) in allocations)
        {
            var previousPaid = demand.PaidAmount;
            var newPaid = previousPaid + payAmount;
            var balance = Math.Max(0m, demand.MonthlyRentAmount + demand.PenaltyAmount + demand.GSTAmount - newPaid);
            var lineStatus = balance == 0m ? DemandStatusPaid : DemandStatusPartial;

            await _detailRepository.AddAsync(new LeaseRentBillTransactionDetailEntity
            {
                LeaseRentBillTransactionId = header.Id,
                MonthWiseDemandId = demand.Id,
                AssetId = demand.AssetId,
                LeaseRegistrationId = lease.Id,
                FinanceYear = demand.FinanceYear,
                DemandYear = demand.DemandYear,
                QuarterNo = demand.QuarterNo,
                DemandMonth = demand.DemandMonth,
                MonthlyRentAmount = demand.MonthlyRentAmount,
                PenaltyAmount = demand.PenaltyAmount,
                GSTAmount = demand.GSTAmount,
                PreviousPaidAmount = previousPaid,
                CurrentPaidAmount = payAmount,
                BalanceAmount = balance,
                PaymentStatus = lineStatus,
                CreatedBy = userId,
                IsActive = true
            }, cancellationToken);

            demand.PaidAmount = newPaid;
            demand.LastPaymentDate = posting.PaymentDate;
            demand.DemandStatus = lineStatus;
            demand.UpdatedBy = userId;
            await _demandRepository.UpdateAsync(demand, cancellationToken);

            lines.Add(new BillReceiptLineDto
            {
                MonthWiseDemandId = demand.Id,
                DemandYear = demand.DemandYear,
                DemandMonth = demand.DemandMonth,
                CurrentPaidAmount = payAmount,
                BalanceAmount = balance,
                PaymentStatus = lineStatus
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Discount is recorded on the header only: it neither reduces what is owed nor becomes wallet money.
        var walletUsed = GetWalletUsed(posting.AdjustmentAmount);
        var excess = posting.Cash + walletUsed - allocations.Sum(a => a.PayAmount);

        lease.AdvanceBalance = lease.AdvanceBalance - walletUsed + Math.Max(0m, excess);
        lease.UpdatedBy = userId;
        await _leaseRepository.UpdateAsync(lease, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (header, lines);
    }

    /// <summary>
    /// The lease's still-payable demands (active, not cancelled, not paid), oldest first so Full,
    /// Custom Amount and Advance settle chronologically.
    /// </summary>
    private Task<List<MonthWiseDemandEntity>> LoadPendingDemandsAsync(int leaseId, bool tracked, CancellationToken cancellationToken)
    {
        var query = _demandRepository.GetQueryable();
        if (!tracked)
            query = query.AsNoTracking();

        return query
            .Where(d => d.LeaseRegistrationId == leaseId && d.IsActive
                        && d.DemandStatus != DemandStatusCancelled && d.DemandStatus != DemandStatusPaid)
            .OrderBy(d => d.DemandYear)
            .ThenBy(d => d.DemandMonth)
            .ThenBy(d => d.Id)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Re-prices the penalty of each demand that has a due date, as of <paramref name="asOf"/>, with the
    /// single active penalty rule of highest Id (applies to every demand; none active means no penalty).
    /// The result replaces the stored penalty. A Paid or Cancelled month keeps the penalty it closed
    /// with. In memory only: it is persisted if and when the demand is saved. Returns each re-priced
    /// demand's penalty from before re-pricing.
    /// </summary>
    private async Task<IReadOnlyDictionary<MonthWiseDemandEntity, decimal>> RecalculatePenaltiesAsync(
        IReadOnlyCollection<MonthWiseDemandEntity> demands, DateTime asOf, CancellationToken cancellationToken)
    {
        var repriceable = demands
            .Where(d => d.DueDate.HasValue && d.DemandStatus != DemandStatusPaid && d.DemandStatus != DemandStatusCancelled)
            .ToList();
        if (repriceable.Count == 0)
            return new Dictionary<MonthWiseDemandEntity, decimal>();

        var rule = await _penaltyRepository.GetQueryable().AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var storedPenalties = repriceable.ToDictionary(d => d, d => d.PenaltyAmount);
        foreach (var demand in repriceable)
            demand.PenaltyAmount = CalculatePenalty(rule, demand.MonthlyRentAmount, demand.DueDate!.Value, asOf);

        return storedPenalties;
    }

    /// <summary>
    /// Late fee for one month. Percentage and FlatAmount are charged once when overdue beyond the grace
    /// period; PerDay is charged per day beyond it. Rounded to 2 places with .NET's default banker's rounding.
    /// </summary>
    private static decimal CalculatePenalty(PenaltyRuleMasterEntity? rule, decimal monthlyRent, DateTime dueDate, DateTime asOf)
    {
        if (rule == null)
            return 0m;

        var overdueDays = (asOf.Date - dueDate.Date).Days - rule.GracePeriodDays;
        if (overdueDays <= 0)
            return 0m;

        var penalty = rule.CalculationType?.Trim() switch
        {
            "Percentage" => monthlyRent * rule.PenaltyValue / 100m,
            "FlatAmount" => rule.PenaltyValue,
            "PerDay" => rule.PenaltyValue * overdueDays,
            _ => 0m
        };

        return Math.Round(penalty, 2);
    }

    /// <summary>Still owed on a demand, from its (possibly just re-priced) amount columns — the persisted PendingAmount column would be stale.</summary>
    private static decimal GetPendingAmount(MonthWiseDemandEntity demand)
        => demand.MonthlyRentAmount + demand.PenaltyAmount + demand.GSTAmount - demand.PaidAmount;

    /// <summary>Pays <paramref name="amount"/> into the demands in order (oldest first), each up to its pending balance.</summary>
    private static List<Allocation> DistributeOldestFirst(IEnumerable<MonthWiseDemandEntity> demands, decimal amount)
    {
        var allocations = new List<Allocation>();
        var remaining = amount;

        foreach (var demand in demands)
        {
            if (remaining <= 0m)
                break;

            var pay = Math.Min(remaining, GetPendingAmount(demand));
            if (pay <= 0m)
                continue;

            allocations.Add(new Allocation(demand, pay));
            remaining -= pay;
        }

        return allocations;
    }

    /// <summary>Records on <paramref name="payment"/> the lease and tenant its receipt prints, as the lease stands now.</summary>
    private static void CaptureLeaseSnapshot(IPaymentLeaseSnapshot payment, AssetLeaseRentDetailsEntity lease)
    {
        payment.Snap_TenantName = lease.TenantName;
        payment.Snap_TenantMobile = lease.TenantMobile;
        payment.Snap_AgreementId = lease.AgreementId;
        payment.Snap_LeaseStartDate = lease.LeaseStartDate;
        payment.Snap_LeaseEndDate = lease.LeaseEndDate;
        payment.Snap_RentAmount = lease.RentAmount;
        payment.Snap_SecurityDeposit = lease.SecurityDeposit;
    }

    private static void CopyLeaseSnapshot(IPaymentLeaseSnapshot from, IPaymentLeaseSnapshot to)
    {
        to.Snap_TenantName = from.Snap_TenantName;
        to.Snap_TenantMobile = from.Snap_TenantMobile;
        to.Snap_AgreementId = from.Snap_AgreementId;
        to.Snap_LeaseStartDate = from.Snap_LeaseStartDate;
        to.Snap_LeaseEndDate = from.Snap_LeaseEndDate;
        to.Snap_RentAmount = from.Snap_RentAmount;
        to.Snap_SecurityDeposit = from.Snap_SecurityDeposit;
    }

    /// <summary>A negative AdjustmentAmount is that much of the tenant's AdvanceBalance spent on this payment.</summary>
    private static decimal GetWalletUsed(decimal adjustmentAmount) => adjustmentAmount < 0m ? -adjustmentAmount : 0m;

    /// <summary>Indian finance year (April–March), identified by its starting calendar year.</summary>
    private static int GetFinanceYear(DateTime date) => date.Month >= 4 ? date.Year : date.Year - 1;

    /// <summary>
    /// e.g. TXN-2026-000001: one series per prefix per UTC calendar year of posting (not the finance
    /// year or the payment date). Must run inside the payment's transaction. Keep the six-digit
    /// width: the number generator finds the highest number by string order.
    /// </summary>
    private async Task<string> NextNumberAsync(string prefix, CancellationToken cancellationToken)
    {
        var year = _timeProvider.GetUtcNow().Year;
        var next = await _numberGenerator.NextAsync(prefix, year, cancellationToken);
        return $"{prefix}-{year}-{next:D6}";
    }

    /// <summary>
    /// Re-runs the request DTO's own validation (attributes + cross-field rules), so a caller that
    /// bypasses MVC model validation still can't reach the database constraints with bad input.
    /// </summary>
    private static void EnsureValid(object dto)
    {
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true))
            throw new PaymentRuleException(results[0].ErrorMessage ?? "Payment_Request_Invalid");
    }

    /// <summary>
    /// Undoes a failed call: rolls back the transaction if one is open and drops the partial tracked
    /// changes (re-priced penalties, a half-built posting) so nothing later in the request saves them.
    /// Not cancellable: once a failure has happened the transaction must be released regardless.
    /// </summary>
    private async Task AbortAsync()
    {
        await _unitOfWork.RollbackTransactionAsync(CancellationToken.None);
        _unitOfWork.DiscardChanges();
    }
}
