using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Middleware;
using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetCounterPaymentController : ControllerBase
{
    private const string PaymentModeCheque = "Cheque";

    private readonly IAssetCounterPaymentService _service;
    private readonly IAssetLeaseRentDetailsService _leaseService;
    private readonly ILeaseRentBillingService _billingService;

    public AssetCounterPaymentController(
        IAssetCounterPaymentService service,
        IAssetLeaseRentDetailsService leaseService,
        ILeaseRentBillingService billingService)
    {
        _service = service;
        _leaseService = leaseService;
        _billingService = billingService;
    }

    /// <summary>
    /// Counter-payment lookup from a single search box. The text is identified as tenant mobile,
    /// asset id, shop no, asset no, or tenant/shop/asset name (see
    /// AssetCounterPaymentService.BuildSearchPlan), and the approved leases matching it are
    /// returned with their asset and tenant details. MatchedBy/MatchType in the response say which
    /// field matched. Department-scoped: only leases on assets in the caller's departments (all
    /// assets for an Admin) are searched, since the results carry tenant contact details.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<AssetCounterPaymentSearchResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Search([FromQuery] AssetCounterPaymentSearchQuery query, CancellationToken ct)
    {
        var result = await _service.SearchAsync(query.SearchText, GetCurrentUserId(), ct);

        return Ok(new ApiResponse<AssetCounterPaymentSearchResponseDto>
        {
            Success = true,
            Message = result.Results.Count == 0
                ? "No approved lease found for the given search text"
                : $"Found {result.Results.Count} record(s) by {result.MatchedBy}",
            Items = result,
            TotalCount = result.Results.Count
        });
    }

    /// <summary>
    /// Month/year-wise demand, the Demand &amp; Collection Summary (Pending (Arrears) / Current Due /
    /// Total, each as Demand / Paid / Due), and payment history for one asset. Department-scoped
    /// the same way as the lease endpoints (see AssetLeaseRentDetailsService.CanUserAccessAssetAsync).
    /// </summary>
    [HttpGet("by-asset/{assetId:int}/demand-details")]
    [ProducesResponseType(typeof(ApiResponse<AssetDemandDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDemandDetails(int assetId, CancellationToken ct)
    {
        if (!await _leaseService.CanUserAccessAssetAsync(assetId, GetCurrentUserId(), ct))
            return Forbid();

        var result = await _service.GetDemandDetailsAsync(assetId, ct);
        if (result == null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "Asset not found" });

        return Ok(new ApiResponse<AssetDemandDetailsDto>
        {
            Success = true,
            Message = "Demand details retrieved successfully",
            Items = result
        });
    }

    /// <summary>
    /// Pays a lease's rent dues at the counter ("Pay"). PaymentType picks what is settled: Full (every
    /// pending month), Partial (a Custom Amount, oldest month first), Monthwise (the selected months, each
    /// in full) or Advance (like Full, and allowed with nothing pending: a wallet top-up). Every mode but
    /// Cheque posts immediately and returns the receipt (BillReceiptDto). A Cheque is only staged and
    /// returns an acknowledgement (ChequeAcknowledgementDto); it settles nothing until it is Cleared
    /// through the cheque status endpoint. Online is rejected here (only a gateway flow posts it).
    /// Errors carry a Payment_* / LeaseRent_* code as the message: 400 validation, business rule or a
    /// concurrent payment that changed the same demand or wallet first (retry), 404 lease/demand not found.
    /// Department-scoped: 403 when the lease's asset is outside the caller's departments (see
    /// AssetLeaseRentDetailsService.CanUserAccessLeaseAsync).
    /// </summary>
    [HttpPost("{leaseId:int}")]
    [ProducesResponseType(typeof(ApiResponse<BillReceiptDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Pay(int leaseId, [FromBody] CreateBillPaymentDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (!await _leaseService.CanUserAccessLeaseAsync(leaseId, userId, ct))
            return Forbid();

        if (dto.PaymentMode == PaymentModeCheque)
        {
            var acknowledgement = await _billingService.ProcessChequePaymentAsync(leaseId, dto, userId, ct);
            return Ok(new ApiResponse<ChequeAcknowledgementDto>
            {
                Success = true,
                Message = "Cheque received; pending clearance",
                Items = acknowledgement
            });
        }

        var receipt = await _billingService.ProcessPaymentAsync(leaseId, dto, userId, ct);
        return Ok(new ApiResponse<BillReceiptDto>
        {
            Success = true,
            Message = "Payment processed successfully",
            Items = receipt
        });
    }

    /// <summary>
    /// Moves a staged cheque forward: Received → Deposited | Bounced, Deposited → Cleared | Bounced
    /// (Cleared and Bounced are final). Cleared posts the payment exactly as staged — ledger header and
    /// lines, demands and wallet. Bounced records the reason; nothing is posted. Department-scoped like
    /// Pay; the cheque must belong to the lease, so the lease check covers it.
    /// </summary>
    [HttpPatch("{leaseId:int}/cheque-transactions/{chequeTransactionId:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateChequeStatus(
        int leaseId, int chequeTransactionId, [FromBody] UpdateChequeStatusDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (!await _leaseService.CanUserAccessLeaseAsync(leaseId, userId, ct))
            return Forbid();

        await _billingService.UpdateChequeStatusAsync(leaseId, chequeTransactionId, dto, userId, ct);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Cheque status updated successfully"
        });
    }

    /// <summary>
    /// Printable receipt for the UUID given to the payer: a settled payment's, or a cheque's (a
    /// cleared cheque returns the receipt of the payment it was posted as, under that payment's UUID).
    /// Read-only and not department-scoped. 400 Payment_Receipt_Uuid_Invalid when the UUID isn't a
    /// GUID, 404 Payment_Receipt_NotFound when no active payment or cheque has it.
    /// </summary>
    // Absolute route: served under api/LeaseRentBill rather than this controller's prefix. The uuid
    // has no :guid constraint because a malformed one must be a 400, not an unmatched-route 404.
    [HttpGet("/api/LeaseRentBill/receipt/uuid/{uuid}")]
    [ProducesResponseType(typeof(ApiResponse<LeaseRentReceiptDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetReceiptByUuid(string uuid, CancellationToken ct)
    {
        if (!Guid.TryParse(uuid, out var receiptUuid))
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Payment_Receipt_Uuid_Invalid" });

        var receipt = await _service.GetReceiptByUuidAsync(receiptUuid, ct);
        if (receipt == null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "Payment_Receipt_NotFound" });

        return Ok(new ApiResponse<LeaseRentReceiptDto>
        {
            Success = true,
            Message = "Receipt retrieved successfully",
            Items = receipt
        });
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            throw new UnauthorizedAccessException("Valid user identification is required.");
        return id;
    }
}
