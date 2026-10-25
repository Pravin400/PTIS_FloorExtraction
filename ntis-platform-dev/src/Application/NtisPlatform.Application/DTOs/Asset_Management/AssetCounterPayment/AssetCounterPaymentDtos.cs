using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentDemand;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;

/// <summary>
/// Query for the counter-payment lookup: a single free-text box the counter clerk types into.
/// The service works out which field the text identifies (mobile, asset id, shop no, asset no,
/// tenant/shop/asset name) — see AssetCounterPaymentService.BuildSearchPlan.
/// </summary>
public class AssetCounterPaymentSearchQuery
{
    [Required(ErrorMessage = "AMS_AssetCounterPayment_SearchText_Required")]
    [StringLength(100, ErrorMessage = "AMS_AssetCounterPayment_SearchText_MaxLengthExceeded_100")]
    public string SearchText { get; set; } = string.Empty;
}

/// <summary>
/// Field the search text was identified as. String constants rather than an enum because the API
/// serializes enums as numbers (no JsonStringEnumConverter is registered).
/// </summary>
public static class CounterPaymentSearchField
{
    public const string TenantMobile = "TenantMobile";
    public const string AssetId = "AssetId";
    public const string ShopNo = "ShopNo";
    public const string AssetNo = "AssetNo";
    public const string TenantName = "TenantName";
    public const string ShopName = "ShopName";
    public const string AssetName = "AssetName";
}

public static class CounterPaymentMatchType
{
    public const string Exact = "Exact";
    public const string Partial = "Partial";
}

/// <summary>One approved lease found by the counter-payment search.</summary>
public class AssetCounterPaymentSearchResultDto
{
    /// <summary>AMS.AssetLeaseRentDetails.Id — the lease the payment is collected against.</summary>
    public int LeaseRentDetailsId { get; set; }
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public int? ParentAssetId { get; set; }
    public string? ParentAssetName { get; set; }
    public string? ShopNo { get; set; }
    public string? ShopName { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantMobile { get; set; } = string.Empty;
    public string? TenantEmail { get; set; }
    public string LeaseType { get; set; } = string.Empty;
    public decimal? RentAmount { get; set; }
    public string PaymentFrequency { get; set; } = string.Empty;
    public DateTime LeaseStartDate { get; set; }
    public DateTime? LeaseEndDate { get; set; }
}

public class AssetCounterPaymentSearchResponseDto
{
    /// <summary>The search text as it was matched (trimmed, inner whitespace collapsed).</summary>
    public string SearchText { get; set; } = string.Empty;

    /// <summary>A <see cref="CounterPaymentSearchField"/> value; null when nothing matched.</summary>
    public string? MatchedBy { get; set; }

    /// <summary>A <see cref="CounterPaymentMatchType"/> value; null when nothing matched.</summary>
    public string? MatchType { get; set; }

    /// <summary>More leases matched than the result cap returned — the clerk should refine the search.</summary>
    public bool HasMoreResults { get; set; }

    public List<AssetCounterPaymentSearchResultDto> Results { get; set; } = new();
}

/// <summary>Demand (D), Paid (C) and Due (B) for one row of the Demand &amp; Collection Summary.</summary>
public class DemandCollectionAmountsDto
{
    public decimal Demand { get; set; }
    public decimal Paid { get; set; }
    public decimal Due { get; set; }
}

/// <summary>
/// The "Demand &amp; Collection Summary" card, as of today: Pending (Arrears) is the demand of every
/// month before the current month, Current Due is the current month's demand, Total is both together.
/// Months after the current one aren't due yet and are left out.
/// </summary>
public class DemandCollectionSummaryDto
{
    public DemandCollectionAmountsDto Arrears { get; set; } = new();
    public DemandCollectionAmountsDto CurrentDue { get; set; } = new();
    public DemandCollectionAmountsDto Total { get; set; } = new();
}

/// <summary>One payment on the asset (an AMS.LeaseRentBillTransactions row) with the months it settled.</summary>
public class CounterPaymentTransactionDto : BillTransactionDto
{
    public int LeaseRegistrationId { get; set; }

    /// <summary>The payment's UUID — what GET api/LeaseRentBill/receipt/uuid/{uuid} takes to print its receipt.</summary>
    public Guid Uuid { get; set; }

    /// <summary>The AMS.LeaseRentBillTransactionDetails rows of this payment, oldest month first.</summary>
    public List<BillReceiptLineDto> Lines { get; set; } = new();
}

/// <summary>Month/year-wise demand, the demand &amp; collection summary, and payment history for one asset.</summary>
public class AssetDemandDetailsDto
{
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;

    /// <summary>Current finance year (April-March, by start year).</summary>
    public int CurrentFinanceYear { get; set; }

    public DemandCollectionSummaryDto Summary { get; set; } = new();

    /// <summary>AMS.MonthWiseDemand rows (cancelled demand excluded), oldest month first.</summary>
    public List<MonthWiseDemandDto> Demands { get; set; } = new();

    /// <summary>Payments, newest first.</summary>
    public List<CounterPaymentTransactionDto> Transactions { get; set; } = new();
}
