namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// One row per Cheque payment received for a lease's rent dues. Maps to the
/// [AMS].[ChequePaymentTransactions] table. Created when the cheque is handed in
/// (Status = "Received"); walked forward through Deposited and finally Cleared or Bounced.
/// Only on Cleared is a <see cref="LeaseRentBillTransactionEntity"/> posted and the underlying
/// demands settled — nothing about the demands or the tenant's AdvanceBalance changes before that.
/// </summary>
public class ChequePaymentTransactionEntity : BaseEntity, IPaymentLeaseSnapshot
{
    public Guid Uuid { get; set; } = Guid.NewGuid();

    /// <summary>Sequential reference issued at intake, e.g. CHQ-2026-000001 — the payer's
    /// acknowledgement/reference until the cheque clears and a real ReceiptNo exists.</summary>
    public string AcknowledgementNo { get; set; } = string.Empty;

    public int AssetId { get; set; }
    public int LeaseRegistrationId { get; set; }
    public int FinanceYear { get; set; }

    /// <summary>Full | Partial | Monthwise — captured at intake (Advance is not accepted by cheque).</summary>
    public string PaymentType { get; set; } = "Full";

    /// <summary>Gross rent/penalty/GST of the allocated months as priced at intake.</summary>
    public decimal TotalMonthlyRentAmount { get; set; }
    public decimal TotalPenaltyAmount { get; set; }
    public decimal TotalGSTAmount { get; set; }
    public decimal DiscountAmount { get; set; }

    /// <summary>Wallet/advance use requested at intake. Applied to the tenant's AdvanceBalance
    /// only once the cheque clears — never at intake, since the cheque could still bounce.</summary>
    public decimal AdjustmentAmount { get; set; }

    public decimal PaidAmount { get; set; }

    /// <summary>JSON array of the server-resolved <see cref="ChequeAllocation"/>s fixed at intake:
    /// [{MonthWiseDemandId, PayAmount, PenaltyAmount, OutstandingAmount}]. PenaltyAmount is the demand's
    /// penalty as priced at intake (intake doesn't write it to the demand); OutstandingAmount what the
    /// month still owed then. Replayed verbatim at clearance — the penalty is re-applied to each
    /// re-read demand, which is re-validated first.</summary>
    public string AllocationsJson { get; set; } = "[]";

    public DateTime PaymentDate { get; set; }

    public string BankName { get; set; } = string.Empty;
    public string? BranchName { get; set; }
    public string ChequeOrTransactionNo { get; set; } = string.Empty;
    public DateTime ChequeDate { get; set; }

    /// <summary>Account/payee name on the cheque, when supplied.</summary>
    public string? AccountHolderName { get; set; }

    public string PayerMobile { get; set; } = string.Empty;
    public string? PayerEmail { get; set; }

    /// <summary>Received | Deposited | Cleared | Bounced.</summary>
    public string Status { get; set; } = "Received";

    /// <summary>Short reason, populated when Status is Bounced.</summary>
    public string? BounceReason { get; set; }

    public string? Remark { get; set; }

    /// <summary>Set once Status is Cleared and this cheque has been posted into LeaseRentBillTransactions.</summary>
    public int? LeaseRentBillTransactionId { get; set; }

    // The lease and tenant when the cheque was received, printed on its receipt and carried onto the
    // ledger header it posts when it clears (see IPaymentLeaseSnapshot).
    public string? Snap_TenantName { get; set; }
    public string? Snap_TenantMobile { get; set; }
    public string? Snap_AgreementId { get; set; }
    public DateTime? Snap_LeaseStartDate { get; set; }
    public DateTime? Snap_LeaseEndDate { get; set; }
    public decimal? Snap_RentAmount { get; set; }
    public decimal? Snap_SecurityDeposit { get; set; }
}
