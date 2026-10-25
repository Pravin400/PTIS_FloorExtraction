namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// One element of <see cref="ChequePaymentTransactionEntity.AllocationsJson"/>: a month the cheque
/// settles, fixed at intake and replayed verbatim when the cheque clears.
/// </summary>
public class ChequeAllocation
{
    public int MonthWiseDemandId { get; set; }

    /// <summary>What the cheque (with any wallet money it spends) pays into the month.</summary>
    public decimal PayAmount { get; set; }

    /// <summary>
    /// The month's penalty as priced at intake. Intake doesn't write it to the demand (the cheque may
    /// bounce), so clearance re-applies it — otherwise PayAmount, which includes it, would exceed the
    /// pending amount.
    /// </summary>
    public decimal? PenaltyAmount { get; set; }

    /// <summary>
    /// What the month still owed at intake, before this cheque: rent + penalty (as priced at intake) +
    /// GST − paid by earlier payments. The cheque's receipt shows its outstanding and remaining balance
    /// from this. Null on cheques staged before it was recorded.
    /// </summary>
    public decimal? OutstandingAmount { get; set; }
}
