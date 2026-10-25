using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Net.Http.Headers;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Api.Middleware;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetLeaseRentDetailsController : ControllerBase
{
    private readonly IAssetLeaseRentDetailsService _service;
    private readonly FileValidationHelper _fileValidationHelper;
    private readonly ILogger<AssetLeaseRentDetailsController> _logger;

    public AssetLeaseRentDetailsController(
        IAssetLeaseRentDetailsService service,
        FileValidationHelper fileValidationHelper,
        ILogger<AssetLeaseRentDetailsController> logger)
    {
        _service = service;
        _fileValidationHelper = fileValidationHelper;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> GetAll([FromQuery] AssetLeaseRentDetailsQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Department-scoped: this includes tenant Aadhaar/PAN/address, so it uses the same access
    /// check as documents/history (see CanUserAccessLeaseAsync).
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetLeaseRentDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        if (!await _service.CanUserAccessLeaseAsync(id, GetCurrentUserId(), ct))
            return Forbid();

        return await this.ExecuteGetById(_service, id, _logger, ct);
    }

    /// <summary>
    /// Department-scoped: the caller must be authorized for the target asset's department before
    /// a lease containing tenant PII/financials can be created against it (see CanUserAccessAssetAsync).
    /// CreatedBy is always taken from the authenticated claim, never trusted from the request body.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateAssetLeaseRentDetailsDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        if (!await _service.CanUserAccessAssetAsync(dto.AssetId, userId, ct))
            return Forbid();

        dto.CreatedBy = userId;

        return await this.ExecuteCreate(_service, dto, _logger, ct);
    }

    /// <summary>
    /// Department-scoped against BOTH the lease's current asset and the (possibly different)
    /// target AssetId the request supplies, since this DTO can reassign the lease to another asset.
    /// UpdatedBy is always taken from the authenticated claim here, never trusted from the request
    /// body — it feeds both the entity's own audit column and the history snapshot's actor field.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssetLeaseRentDetailsDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        if (!await _service.CanUserAccessLeaseAsync(id, userId, ct) ||
            !await _service.CanUserAccessAssetAsync(dto.AssetId, userId, ct))
            return Forbid();

        dto.UpdatedBy = userId;

        return await this.ExecuteUpdate(_service, id, dto, _logger, ct);
    }

    /// <summary>
    /// Department-scoped: see CanUserAccessLeaseAsync.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        if (!await _service.CanUserAccessLeaseAsync(id, GetCurrentUserId(), ct))
            return Forbid();

        return await this.ExecuteDelete(_service, id, _logger, ct);
    }

    /// <summary>
    /// Saves edits to the registration AND (re)starts the verification workflow from "Pending",
    /// regardless of the record's current status. Distinct from <see cref="SendToVerification"/>,
    /// which only re-stamps remarks on an already-Pending record without changing any lease fields.
    /// Department-scoped against BOTH the lease's current asset and the (possibly different) target
    /// AssetId the request supplies — this DTO can reassign the lease to another asset, so checking
    /// only the current asset (as the shared RunTransition gate does for the other transitions)
    /// isn't enough here.
    /// </summary>
    [HttpPut("{id}/send-for-verification")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SendForVerification(int id, [FromBody] UpdateAssetLeaseRentDetailsDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        if (!await _service.CanUserAccessLeaseAsync(id, userId, ct) ||
            !await _service.CanUserAccessAssetAsync(dto.AssetId, userId, ct))
            return Forbid();

        var result = await _service.UpdateAndSendToVerificationAsync(id, dto, userId, ct);
        return result == null ? NotFound() : SuccessResponse(result, "Sent for verification successfully.");
    }

    [HttpPost("{id}/send-to-verification")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> SendToVerification(int id, [FromBody] LeaseWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.SendToVerificationAsync(id, dto?.Remarks, GetCurrentUserId(), ct), "Sent to verification successfully", ct);

    [HttpPost("{id}/verify")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> Verify(int id, [FromBody] LeaseWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.VerifyAsync(id, dto?.Remarks, GetCurrentUserId(), ct), "Verified successfully", ct);

    [HttpPost("{id}/approve")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> Approve(int id, [FromBody] LeaseWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.ApproveAsync(id, dto?.Remarks, GetCurrentUserId(), ct), "Approved successfully", ct);

    [HttpPost("{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> Reject(int id, [FromBody] LeaseRejectDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.RejectAsync(id, dto.Reason, GetCurrentUserId(), ct), "Rejected successfully", ct);

    [HttpPost("{id}/revert-to-registration")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> RevertToRegistration(int id, [FromBody] LeaseWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.RevertToRegistrationAsync(id, dto?.Remarks, GetCurrentUserId(), ct), "Reverted to registration successfully", ct);

    [HttpPost("{id}/revert-to-verification")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> RevertToVerification(int id, [FromBody] LeaseWorkflowActionDto dto, CancellationToken ct)
        => RunTransition(id, () => _service.RevertToVerificationAsync(id, dto?.Remarks, GetCurrentUserId(), ct), "Reverted to verification successfully", ct);

    /// <summary>
    /// Returns all history snapshots for a given AssetLeaseRentDetails registration,
    /// used to populate the "Previous Tenant Information" tab in the registration drawer.
    /// Department-scoped: this includes tenant Aadhaar/PAN/address/financial history, so it uses
    /// the same access check as the document list (see CanUserAccessLeaseAsync).
    /// </summary>
    [HttpGet("{id}/previous-tenant-history")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetLeaseRentPreviousTenantHistoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPreviousTenantHistory(int id, CancellationToken ct)
    {
        if (!await _service.CanUserAccessLeaseAsync(id, GetCurrentUserId(), ct))
            return Forbid();

        var history = await _service.GetPreviousTenantHistoryAsync(id, ct);
        return SuccessResponse(history, "Previous tenant history retrieved successfully");
    }

    /// <summary>
    /// Uploads a supporting document for an AssetLeaseRentDetails registration.
    /// Max file size is configured under FileStorage:MaxFileSizeBytes. Department-scoped: see
    /// CanUserAccessLeaseAsync.
    /// </summary>
    [HttpPost("documents")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("fileupload")]
    [ProducesResponseType(typeof(ApiResponse<AssetLeaseRentDetailsDocumentUploadResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> UploadDocument(
        [FromForm] AssetLeaseRentDetailsDocumentUploadFormDto formDto,
        CancellationToken ct)
    {
        if (formDto.File == null || formDto.File.Length == 0)
            return BadRequest(new ApiResponse<object> { Success = false, Message = "File is required" });

        if (!_fileValidationHelper.IsValidFileType(formDto.File.ContentType, formDto.File.FileName))
            return BadRequest(new ApiResponse<object> { Success = false, Message = _fileValidationHelper.GetInvalidFileTypeMessage() });

        if (!await _service.CanUserAccessLeaseAsync(formDto.AssetLeaseRentDetailsId, GetCurrentUserId(), ct))
            return Forbid();

        using var stream = formDto.File.OpenReadStream();
        var result = await _service.UploadDocumentAsync(
            stream,
            formDto.File.FileName,
            formDto.File.ContentType,
            formDto.File.Length,
            formDto.AssetLeaseRentDetailsId,
            formDto.ModuleId,
            formDto.DocumentType,
            formDto.DocumentTitle,
            formDto.Remarks,
            formDto.IsPrimaryDocument,
            formDto.BindingPurpose,
            GetCurrentUserId(),
            ct);

        return SuccessResponse(result, "Document uploaded successfully");
    }

    /// <summary>
    /// Returns all documents uploaded for the given AssetLeaseRentDetails registration.
    /// Department-scoped: see CanUserAccessLeaseAsync.
    /// </summary>
    [HttpGet("{id}/documents")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetLeaseRentDetailsDocumentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDocuments(int id, CancellationToken ct)
    {
        if (!await _service.CanUserAccessLeaseAsync(id, GetCurrentUserId(), ct))
            return Forbid();

        var documents = await _service.GetDocumentsByAssetLeaseRentDetailsIdAsync(id, ct);
        return SuccessResponse(documents, "Documents retrieved successfully");
    }

    /// <summary>
    /// Downloads a document previously uploaded for an AssetLeaseRentDetails registration. The
    /// lease id is part of the route (not just the document GUID) so the service can verify the
    /// document is actually bound to that lease before streaming it — the id alone isn't proof of
    /// access. Department-scoped like the document list: knowing a lease id and a GUID from
    /// another department must not be enough to download it (see CanUserAccessLeaseAsync).
    /// </summary>
    [HttpGet("{id}/documents/{documentGuid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadDocument(int id, Guid documentGuid, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        if (!await _service.CanUserAccessLeaseAsync(id, userId, ct))
            return Forbid();

        var (fileStream, fileName, mimeType) = await _service.GetDocumentFileAsync(id, documentGuid, userId, ct);
        if (fileStream == null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "Document not found" });

        return File(fileStream, mimeType, fileName, enableRangeProcessing: true);
    }

    /// <summary>
    /// Shared gate for every workflow-mutation endpoint (SendForVerification/SendToVerification/
    /// Verify/Approve/Reject/RevertToRegistration/RevertToVerification): checks department-scoped
    /// access to the lease BEFORE invoking the transition, so an authenticated user can't verify,
    /// approve, reject, or revert another department's lease just by guessing its id.
    /// </summary>
    private async Task<IActionResult> RunTransition(int id, Func<Task<AssetLeaseRentDetailsDto?>> action, string successMessage, CancellationToken ct)
    {
        if (!await _service.CanUserAccessLeaseAsync(id, GetCurrentUserId(), ct))
            return Forbid();

        var result = await action();
        return result == null ? NotFound() : SuccessResponse(result, successMessage);
    }

    private OkObjectResult SuccessResponse<T>(T items, string message)
        => Ok(new ApiResponse<T> { Success = true, Message = message, Items = items });

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            throw new UnauthorizedAccessException("Valid user identification is required.");
        return id;
    }
}
