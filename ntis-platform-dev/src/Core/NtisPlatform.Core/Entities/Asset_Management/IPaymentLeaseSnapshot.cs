namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// The lease and tenant details a lease-rent payment's receipt prints, recorded on the payment when
/// it is taken (a counter payment, or a cheque when it is received) so that later edits to the lease,
/// or a new tenant on it, never rewrite an old receipt. Every member is null on payments taken before
/// they were recorded; their receipts read the current lease instead.
/// </summary>
public interface IPaymentLeaseSnapshot
{
    string? Snap_TenantName { get; set; }
    string? Snap_TenantMobile { get; set; }
    string? Snap_AgreementId { get; set; }
    DateTime? Snap_LeaseStartDate { get; set; }
    DateTime? Snap_LeaseEndDate { get; set; }
    decimal? Snap_RentAmount { get; set; }
    decimal? Snap_SecurityDeposit { get; set; }
}
