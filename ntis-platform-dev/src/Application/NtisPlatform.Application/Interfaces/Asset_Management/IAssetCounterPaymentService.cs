using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

public interface IAssetCounterPaymentService
{
    /// <summary>
    /// Counter-payment lookup. Identifies what <paramref name="searchText"/> is (tenant mobile,
    /// asset id, shop no, asset no, tenant/shop/asset name) and returns the matching approved,
    /// active leases the caller's departments can see. Tries each candidate field from most to least
    /// specific and stops at the first one that matches; <see cref="AssetCounterPaymentSearchResponseDto.MatchedBy"/>
    /// reports which field that was.
    /// </summary>
    Task<AssetCounterPaymentSearchResponseDto> SearchAsync(
        string searchText,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Month/year-wise demand (AMS.MonthWiseDemand), the Demand &amp; Collection Summary built from it,
    /// and payment history (AMS.LeaseRentBillTransactions with their LeaseRentBillTransactionDetails
    /// lines) for <paramref name="assetId"/>. Returns null when the asset doesn't exist. Not
    /// department-scoped itself — the caller checks access to the asset first.
    /// </summary>
    Task<AssetDemandDetailsDto?> GetDemandDetailsAsync(
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Printable receipt for the UUID given to the payer, which may be a settled payment's
    /// (AMS.LeaseRentBillTransactions) or a cheque's (AMS.ChequePaymentTransactions). A cleared
    /// cheque returns the receipt of the payment it was posted as; any other cheque returns its own
    /// receipt, without month lines. Asset, lease and tenant details are those recorded when the
    /// payment was taken, so later edits to the lease don't change an old receipt. Returns null when
    /// no active row has the UUID. Read-only and not department-scoped.
    /// </summary>
    Task<LeaseRentReceiptDto?> GetReceiptByUuidAsync(
        Guid uuid,
        CancellationToken cancellationToken = default);
}
