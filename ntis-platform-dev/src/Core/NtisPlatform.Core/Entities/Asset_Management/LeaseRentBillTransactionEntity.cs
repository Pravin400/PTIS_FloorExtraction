namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// Payment header for a lease-rent collection. Maps to the
/// [AMS].[LeaseRentBillTransactions] table. One header row collects one or more
/// month-wise demands (see <see cref="Details"/>).
/// <see cref="TotalDemandAmount"/> and <see cref="NetPayableAmount"/> are SQL
/// computed (PERSISTED) columns — read back by EF, never written.
/// </summary>
public class LeaseRentBillTransactionEntity : BaseEntity, IPaymentLeaseSnapshot
{
    public Guid Uuid { get; set; } = Guid.NewGuid();

    public string TransactionNo { get; set; } = string.Empty;
    public string? ReceiptNo { get; set; }

    public int AssetId { get; set; }
    public int LeaseRegistrationId { get; set; }
    public int FinanceYear { get; set; }

    public decimal TotalMonthlyRentAmount { get; set; }
    public decimal TotalPenaltyAmount { get; set; }
    public decimal TotalGSTAmount { get; set; }

    /// <summary>Computed (PERSISTED): rent + penalty + gst.</summary>
    public decimal TotalDemandAmount { get; private set; }

    public decimal DiscountAmount { get; set; }
    public decimal AdjustmentAmount { get; set; }

    /// <summary>
    /// Computed (PERSISTED): total + adjustment (zero or the negative wallet money spent). The
    /// discount is informational and not subtracted.
    /// </summary>
    public decimal NetPayableAmount { get; private set; }

    public decimal PaidAmount { get; set; }

    /// <summary>Cash | Cheque | DD | UPI | Online | NEFT | RTGS.</summary>
    public string PaymentMode { get; set; } = string.Empty;

    public DateTime PaymentDate { get; set; }

    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? ChequeOrTransactionNo { get; set; }
    public DateTime? ChequeDate { get; set; }
    public string? OnlineTransactionId { get; set; }
    public string? PaymentGatewayName { get; set; }

    /// <summary>Account/payee name on the instrument (the request's DDPayeeName). Only meaningful for DD/Cheque.</summary>
    public string? AccountHolderName { get; set; }

    /// <summary>Payer contact captured at the time of payment (may differ from the tenant master).</summary>
    public string? PayerMobile { get; set; }
    public string? PayerEmail { get; set; }

    /// <summary>Success | Pending | Failed | Cancelled.</summary>
    public string PaymentStatus { get; set; } = "Success";

    public int? CancelledBy { get; set; }
    public DateTime? CancelledDate { get; set; }
    public string? CancellationReason { get; set; }

    public string? Remark { get; set; }

    // The lease and tenant at payment time, printed on the receipt (see IPaymentLeaseSnapshot).
    // A cleared cheque's header carries the values recorded when the cheque was received.
    public string? Snap_TenantName { get; set; }
    public string? Snap_TenantMobile { get; set; }
    public string? Snap_AgreementId { get; set; }
    public DateTime? Snap_LeaseStartDate { get; set; }
    public DateTime? Snap_LeaseEndDate { get; set; }
    public decimal? Snap_RentAmount { get; set; }
    public decimal? Snap_SecurityDeposit { get; set; }

    // Navigation
    public ICollection<LeaseRentBillTransactionDetailEntity> Details { get; set; }
        = new List<LeaseRentBillTransactionDetailEntity>();
}
