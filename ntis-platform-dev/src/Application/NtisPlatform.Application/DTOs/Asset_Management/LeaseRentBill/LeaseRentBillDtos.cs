using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;

/// <summary>One month's allocation within a payment request (used by "Select Months").</summary>
public class BillPaymentAllocationDto
{
    // No per-item attributes: allocations are only validated for Monthwise (in
    // CreateBillPaymentDto.Validate), so a Swagger placeholder item (e.g. { 0, 0 }) doesn't
    // 400 a Full/Partial request.
    public int MonthWiseDemandId { get; set; }

    /// <summary>
    /// Server-computed settled amount for this demand. A client-sent value is always ignored — the
    /// service resolves it (the full pending balance, or the oldest-first slice of a Custom Amount).
    /// </summary>
    public decimal PayAmount { get; set; }
}

/// <summary>
/// Payment request: one header plus the type-specific settlement instruction. Validation messages
/// are localization keys (Payment_*), not English text.
/// PaymentType (the "Pending Payment" choice on the payment screen):
///   "Full"      — "Full Payment": settles every pending demand on the lease; Allocations / CustomAmount ignored.
///   "Partial"   — "Custom Amount": CustomAmount is distributed across pending demands oldest-first. If
///                 Allocations lists demand ids, the distribution is narrowed to those months (each must be a
///                 pending demand of this lease); items with an id below 1 are ignored as placeholders.
///   "Monthwise" — "Select Months": settles only the demands listed in Allocations, each to its full pending balance.
///   "Advance"   — like Full, but also allowed with no pending demand; money beyond the dues is credited to the
///                 tenant's AdvanceBalance. Not accepted for Cheque.
/// PaymentMode: Cash, Cheque, DD, UPI, Online, NEFT, RTGS ("QR / UPI" submits "UPI"). Cheque is staged until
/// it clears; Online is rejected on the counter endpoint (only a gateway flow posts Online payments).
/// </summary>
public class CreateBillPaymentDto : IValidatableObject
{
    private static readonly string[] BankInstrumentModes = { "Cheque", "DD", "NEFT", "RTGS" };

    [Required(ErrorMessage = "Payment_PaymentType_Required")]
    [RegularExpression("^(Full|Monthwise|Partial|Advance)$", ErrorMessage = "Payment_PaymentType_Invalid")]
    public string PaymentType { get; set; } = "Full";

    [Required(ErrorMessage = "Payment_PaymentMode_Required")]
    [RegularExpression("^(Cash|Cheque|DD|UPI|Online|NEFT|RTGS)$", ErrorMessage = "Payment_PaymentMode_Invalid")]
    public string PaymentMode { get; set; } = string.Empty;

    /// <summary>
    /// Nullable so that [Required] actually fails when the date is omitted (a non-nullable DateTime
    /// would silently become 0001-01-01). The time part is discarded; the date drives the late
    /// penalty and must be neither in the future nor before the lease start (checked by the service).
    /// </summary>
    [Required(ErrorMessage = "Payment_PaymentDate_Required")]
    public DateTime? PaymentDate { get; set; }

    [Required(ErrorMessage = "Payment_PayerMobile_Required")]
    [RegularExpression("^[0-9]{10}$", ErrorMessage = "Payment_PayerMobile_Invalid")]
    public string PayerMobile { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Payment_PayerEmail_Invalid")]
    [StringLength(200, ErrorMessage = "Payment_PayerEmail_MaxLen_200")]
    public string? PayerEmail { get; set; }

    /// <summary>Required for Cheque, DD, NEFT and RTGS.</summary>
    [StringLength(100, ErrorMessage = "Payment_BankName_MaxLen_100")]
    public string? BankName { get; set; }

    [StringLength(100, ErrorMessage = "Payment_BranchName_MaxLen_100")]
    public string? BranchName { get; set; }

    /// <summary>Cheque number (required for Cheque), or the UTR / reference of a DD, NEFT or RTGS.</summary>
    [StringLength(100, ErrorMessage = "Payment_ChequeOrTransactionNo_MaxLen_100")]
    public string? ChequeOrTransactionNo { get; set; }

    /// <summary>Instrument date; required for Cheque, DD, NEFT and RTGS. Stored as a date.</summary>
    public DateTime? ChequeDate { get; set; }

    [StringLength(100, ErrorMessage = "Payment_OnlineTransactionId_MaxLen_100")]
    public string? OnlineTransactionId { get; set; }

    /// <summary>Required for Online.</summary>
    [StringLength(100, ErrorMessage = "Payment_PaymentGatewayName_MaxLen_100")]
    public string? PaymentGatewayName { get; set; }

    /// <summary>Payee name on a DD (required for DD). Persisted as AccountHolderName.</summary>
    [StringLength(250, ErrorMessage = "Payment_DDPayeeName_MaxLen_250")]
    public string? DDPayeeName { get; set; }

    /// <summary>
    /// Gateway-reported status. Accepted for compatibility but never used by the counter endpoint,
    /// which rejects Online and records every other payment as Success.
    /// </summary>
    [RegularExpression("^(Success|Pending|Failed)$", ErrorMessage = "Payment_PaymentStatus_Invalid")]
    public string? PaymentStatus { get; set; }

    /// <summary>Recorded on the header only: it does not reduce what the payer owes or add to the wallet.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Payment_DiscountAmount_Invalid")]
    public decimal DiscountAmount { get; set; }

    /// <summary>
    /// Zero, or negative: that much money drawn from the tenant's wallet (AdvanceBalance). Positive
    /// values are rejected — nothing defines what a positive adjustment would pay for.
    /// </summary>
    [Range(double.MinValue, 0, ErrorMessage = "Payment_AdjustmentAmount_Invalid")]
    public decimal AdjustmentAmount { get; set; }

    /// <summary>Cash (or equivalent) actually tendered. Anything beyond the dues settled is credited to the wallet.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Payment_PaidAmount_Invalid")]
    public decimal PaidAmount { get; set; }

    [StringLength(500, ErrorMessage = "Payment_Remark_MaxLen_500")]
    public string? Remark { get; set; }

    /// <summary>"Custom Amount" lump sum to distribute oldest-first. Required and &gt; 0 for Partial; ignored otherwise.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Payment_CustomAmount_Invalid")]
    public decimal CustomAmount { get; set; }

    /// <summary>
    /// "Select Months": the demands to settle (ids only — PayAmount is ignored, each is paid in full).
    /// Required for Monthwise; optionally narrows a Partial; ignored for Full and Advance. Nullable so
    /// that an explicit null isn't rejected by MVC's implicit [Required] on Full/Partial requests.
    /// </summary>
    public List<BillPaymentAllocationDto>? Allocations { get; set; } = new();

    /// <summary>
    /// Cross-field rules, plus the two-decimal limit on every amount; run only after every per-field
    /// rule above has passed. Allocations are validated for Monthwise only, so a placeholder item on
    /// a Full/Partial request can't fail it.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Amounts are stored as decimal(18,2) and settled with exact comparisons, so a fraction of a
        // paisa is rejected rather than rounded away on save.
        foreach (var (amount, member) in new[]
                 {
                     (PaidAmount, nameof(PaidAmount)), (CustomAmount, nameof(CustomAmount)),
                     (DiscountAmount, nameof(DiscountAmount)), (AdjustmentAmount, nameof(AdjustmentAmount))
                 })
        {
            if (decimal.Round(amount, 2) != amount)
                yield return new ValidationResult($"Payment_{member}_MaxDecimals_2", new[] { member });
        }

        if (PaymentType == "Monthwise")
        {
            if (Allocations == null || Allocations.Count == 0)
            {
                yield return new ValidationResult("Payment_Allocations_Required", new[] { nameof(Allocations) });
            }
            else
            {
                for (var i = 0; i < Allocations.Count; i++)
                {
                    if (Allocations[i].MonthWiseDemandId < 1)
                        yield return new ValidationResult(
                            "Payment_DemandId_Invalid",
                            new[] { $"{nameof(Allocations)}[{i}].{nameof(BillPaymentAllocationDto.MonthWiseDemandId)}" });
                }
            }
        }
        else if (PaymentType == "Partial" && CustomAmount <= 0m)
        {
            yield return new ValidationResult("Payment_CustomAmount_Required", new[] { nameof(CustomAmount) });
        }

        if (PaymentMode == "DD" && string.IsNullOrWhiteSpace(DDPayeeName))
            yield return new ValidationResult("Payment_DDPayeeName_Required", new[] { nameof(DDPayeeName) });

        if (BankInstrumentModes.Contains(PaymentMode))
        {
            if (string.IsNullOrWhiteSpace(BankName))
                yield return new ValidationResult("Payment_BankName_Required", new[] { nameof(BankName) });
            if (ChequeDate == null)
                yield return new ValidationResult("Payment_ChequeDate_Required", new[] { nameof(ChequeDate) });
        }

        if (PaymentMode == "Cheque" && string.IsNullOrWhiteSpace(ChequeOrTransactionNo))
            yield return new ValidationResult("Payment_ChequeOrTransactionNo_Required", new[] { nameof(ChequeOrTransactionNo) });

        if (PaymentMode == "Online" && string.IsNullOrWhiteSpace(PaymentGatewayName))
            yield return new ValidationResult("Payment_PaymentGatewayName_Required", new[] { nameof(PaymentGatewayName) });
    }
}

/// <summary>A settled-month line on the receipt.</summary>
public class BillReceiptLineDto
{
    public int MonthWiseDemandId { get; set; }
    public int DemandYear { get; set; }
    public byte DemandMonth { get; set; }
    public decimal CurrentPaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

/// <summary>Receipt returned after a successful (non-cheque) payment.</summary>
public class BillReceiptDto
{
    public int TransactionId { get; set; }
    public Guid Uuid { get; set; }
    public string TransactionNo { get; set; } = string.Empty;
    public string? ReceiptNo { get; set; }
    /// <summary>Echoed from the request (Full / Partial / Monthwise / Advance); the ledger header doesn't store it.</summary>
    public string PaymentType { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    /// <summary>Gross rent + penalty + GST of the months this payment touched (not just their pending portion).</summary>
    public decimal TotalDemandAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal AdjustmentAmount { get; set; }
    /// <summary>
    /// TotalDemandAmount + AdjustmentAmount (zero or negative: the wallet money spent). DiscountAmount
    /// is informational and not subtracted.
    /// </summary>
    public decimal NetPayableAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string? TenantName { get; set; }
    public List<BillReceiptLineDto> Lines { get; set; } = new();
}

/// <summary>
/// Returned when a cheque is handed in. The cheque is only staged (Status "Received"): no ledger row
/// exists and no demand or wallet changes until it is Cleared through the cheque status endpoint.
/// </summary>
public class ChequeAcknowledgementDto
{
    /// <summary>ChequePaymentTransactions id — the chequeTransactionId of the status endpoint.</summary>
    public int Id { get; set; }
    public Guid Uuid { get; set; }
    public string AcknowledgementNo { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal PaidAmount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string ChequeOrTransactionNo { get; set; } = string.Empty;
    public DateTime ChequeDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Moves a staged cheque forward: Received → Deposited | Bounced, Deposited → Cleared | Bounced.
/// Cleared posts the payment; Cleared and Bounced are final.
/// </summary>
public class UpdateChequeStatusDto
{
    [Required(ErrorMessage = "Payment_ChequeStatus_Required")]
    [RegularExpression("^(Deposited|Cleared|Bounced)$", ErrorMessage = "Payment_ChequeStatus_Invalid")]
    public string Status { get; set; } = string.Empty;

    /// <summary>Bounce reason; saved only when Status is Bounced.</summary>
    [StringLength(500, ErrorMessage = "Payment_ChequeBounceReason_MaxLen_500")]
    public string? Reason { get; set; }
}

/// <summary>One month on a printable receipt (<see cref="LeaseRentReceiptDto.PaidDemands"/>).</summary>
public class LeaseRentReceiptLineDto
{
    /// <summary>Demand month as MM/YYYY, e.g. "04/2026".</summary>
    public string Period { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    /// <summary>Owed on the month before this payment: rent + penalty + GST − paid by earlier payments.</summary>
    public decimal DueAmount { get; set; }
    public decimal PaidAmount { get; set; }
}

/// <summary>
/// Printable receipt for a payment UUID: a settled payment (LeaseRentBillTransactions), or a cheque
/// not yet cleared (ChequePaymentTransactions), which has no month lines. Amounts cover only the
/// months in this payment, not the lease's whole outstanding.
/// </summary>
public class LeaseRentReceiptDto
{
    /// <summary>The settled payment's UUID — for a cleared cheque, not the cheque UUID it was looked up by.</summary>
    public Guid Uuid { get; set; }
    /// <summary>ReceiptNo (TransactionNo when there is none); a pending cheque's AcknowledgementNo.</summary>
    public string ReceiptNo { get; set; } = string.Empty;
    public int FinanceYear { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal TotalDemandAmount { get; set; }
    /// <summary>
    /// What the months in this payment owed before it: Σ DueAmount over <see cref="PaidDemands"/>, or
    /// for a cheque, what its months owed when it was received.
    /// </summary>
    public decimal TotalOutstandingBeforePayment { get; set; }
    public decimal PaidAmount { get; set; }
    /// <summary>
    /// What the months in this payment still owe after it, never negative. Settled: Σ DueAmount −
    /// PaidAmount over <see cref="PaidDemands"/>. Cheque: the same over its staged allocations (what each
    /// month owed at intake − what the cheque pays into it). The informational discount is never
    /// subtracted.
    /// </summary>
    public decimal RemainingBalance { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    /// <summary>The payment's status (Success / ...), or a pending cheque's (Received / Deposited / Cleared / Bounced).</summary>
    public string PaymentStatus { get; set; } = string.Empty;
    public string? ChequeOrTransactionNo { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public DateTime? ChequeDate { get; set; }
    public string? OnlineTransactionId { get; set; }
    public string? PaymentGatewayName { get; set; }
    public string? Remark { get; set; }
    public int? CreatedBy { get; set; }
    /// <summary>The instrument's AccountHolderName.</summary>
    public string? DDPayeeName { get; set; }

    // Asset (by the payment's AssetId) and the lease and tenant as recorded when the payment was taken
    // (the current lease for payments taken before that was recorded); these defaults when not found.
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? AgreementId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantMobile { get; set; } = string.Empty;
    public DateTime? LeaseStartDate { get; set; }
    public DateTime? LeaseEndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }

    /// <summary>The months this payment settled, oldest first; empty for a cheque not yet cleared.</summary>
    public List<LeaseRentReceiptLineDto> PaidDemands { get; set; } = new();
}

/// <summary>Transaction history row for a lease.</summary>
public class BillTransactionDto
{
    public int Id { get; set; }
    public string TransactionNo { get; set; } = string.Empty;
    public string? ReceiptNo { get; set; }
    public int FinanceYear { get; set; }
    public decimal TotalDemandAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal AdjustmentAmount { get; set; }
    /// <summary>TotalDemandAmount + AdjustmentAmount; the informational DiscountAmount isn't subtracted.</summary>
    public decimal NetPayableAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}
