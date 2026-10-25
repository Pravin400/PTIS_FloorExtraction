using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

/// <summary>
/// Lease-rent bill payment at the counter: immediate posting for every mode except Cheque, which is
/// staged and posted only when it clears. Business-rule failures and lost races throw
/// PaymentRuleException (400) and missing records PaymentNotFoundException (404); each message is
/// the Payment_* / LeaseRent_* error code.
/// </summary>
public interface ILeaseRentBillingService
{
    /// <summary>
    /// Settles the lease's demands for the request's payment type in one database transaction: ledger
    /// header + one detail line per month, the demands' paid amounts and status, and the tenant's
    /// AdvanceBalance (wallet use and overpayment). Not for Cheque (use ProcessChequePaymentAsync) or
    /// Online (posted only by a gateway flow).
    /// </summary>
    Task<BillReceiptDto> ProcessPaymentAsync(int leaseId, CreateBillPaymentDto dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stages a cheque (Status Received) with the allocations resolved and priced now. Nothing reaches
    /// the ledger, the demands or the wallet until the cheque is Cleared.
    /// </summary>
    Task<ChequeAcknowledgementDto> ProcessChequePaymentAsync(int leaseId, CreateBillPaymentDto dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Moves a staged cheque forward (Received → Deposited | Bounced, Deposited → Cleared | Bounced).
    /// Cleared posts the staged allocations exactly as captured at intake.
    /// </summary>
    Task UpdateChequeStatusAsync(int leaseId, int chequeTransactionId, UpdateChequeStatusDto dto, int userId, CancellationToken cancellationToken = default);
}
