using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[ApiController]
[Route("api/asset-grievance-documents")]
public class AssetGrievanceDocumentController : ControllerBase
{
    private const string StatusClosed = "Closed";

    private readonly IAssetGrievanceDocumentApplicationService _service;
    private readonly IDocumentApplicationService _documentService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<AssetGrievanceDetailsEntity, int> _grievanceRepository;
    private readonly IRepository<AssetGrievanceDocumentEntity, int> _documentRepository;
    private readonly ILogger<AssetGrievanceDocumentController> _logger;

    public AssetGrievanceDocumentController(
        IAssetGrievanceDocumentApplicationService service,
        IDocumentApplicationService documentService,
        ICurrentUserService currentUserService,
        IRepository<AssetGrievanceDetailsEntity, int> grievanceRepository,
        IRepository<AssetGrievanceDocumentEntity, int> documentRepository,
        ILogger<AssetGrievanceDocumentController> logger)
    {
        _service = service;
        _documentService = documentService;
        _currentUserService = currentUserService;
        _grievanceRepository = grievanceRepository;
        _documentRepository = documentRepository;
        _logger = logger;
    }

    /// <summary>Returns the grievance's current Status, or null if it doesn't exist.</summary>
    private async Task<string?> GetGrievanceStatusAsync(int grievanceDetailsId, CancellationToken cancellationToken)
        => await _grievanceRepository.GetQueryable().AsNoTracking()
            .Where(x => x.Id == grievanceDetailsId)
            .Select(x => x.WorkflowStatus)
            .FirstOrDefaultAsync(cancellationToken);

    [HttpPost("bulk-save")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDocumentBulkSaveResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkSave(
        [FromBody] AssetGrievanceDocumentBulkSaveDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (request.GrievanceDetailsId <= 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Invalid GrievanceDetailsId" });
                
            if (request.Documents == null || request.Documents.Count == 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "No documents provided" });

            var status = await GetGrievanceStatusAsync(request.GrievanceDetailsId, cancellationToken);
            if (status == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Grievance not found." });
            if (status == StatusClosed)
                return Conflict(new ApiResponse<object> { Success = false, Message = "Cannot modify documents on a Closed grievance." });

            var response = await _service.BulkSaveAsync(request, cancellationToken);
            
            if (response.Errors.Count > 0)
            {
                var isPartial = response.SavedDocuments.Count > 0;
                return isPartial
                    ? Ok(new ApiResponse<AssetGrievanceDocumentBulkSaveResponseDto>
                    {
                        Success = false,
                        Items = response,
                        Message = "Documents saved with some errors.",
                        Errors = response.Errors
                    })
                    : BadRequest(new ApiResponse<AssetGrievanceDocumentBulkSaveResponseDto>
                    {
                        Success = false,
                        Items = response,
                        Message = "Failed to save documents.",
                        Errors = response.Errors
                    });
            }

            return Ok(new ApiResponse<AssetGrievanceDocumentBulkSaveResponseDto> 
            { 
                Success = true, 
                Items = response, 
                Message = "Documents saved successfully." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in BulkSave for GrievanceDetailsId: {GrievanceDetailsId}", request.GrievanceDetailsId);
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "An error occurred while saving documents." });
        }
    }

    [HttpGet("grievance/{grievanceDetailsId}")]
    [ProducesResponseType(typeof(ApiResponse<List<AssetGrievanceDocumentResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByGrievanceId(int grievanceDetailsId, CancellationToken cancellationToken)
    {
        try
        {
            var documents = await _service.GetDocumentsByGrievanceIdAsync(grievanceDetailsId, cancellationToken);
            return Ok(new ApiResponse<List<AssetGrievanceDocumentResponseDto>> 
            { 
                Success = true, 
                Items = documents,
                Message = "Documents retrieved successfully."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching documents for GrievanceDetailsId: {GrievanceDetailsId}", grievanceDetailsId);
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "An error occurred while fetching documents." });
        }
    }

    /// <summary>Adds a single evidence document to an existing grievance without going through the Create/Update multipart bundle.</summary>
    [HttpPost("{grievanceDetailsId}/documents")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDocumentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UploadDocument(
        int grievanceDetailsId,
        IFormFile file,
        [FromForm] int documentTypeId,
        [FromForm] string? remarks,
        [FromForm] int? displayOrder,
        CancellationToken cancellationToken)
    {
        try
        {
            var status = await GetGrievanceStatusAsync(grievanceDetailsId, cancellationToken);
            if (status == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Grievance not found." });
            if (status == StatusClosed)
                return Conflict(new ApiResponse<object> { Success = false, Message = "Cannot add documents to a Closed grievance." });

            if (file == null || file.Length <= 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "A file is required." });

            var bulkSaveResponse = await _service.BulkSaveAsync(new AssetGrievanceDocumentBulkSaveDto
            {
                GrievanceDetailsId = grievanceDetailsId,
                Documents = new List<AssetGrievanceDocumentItemDto>
                {
                    new AssetGrievanceDocumentItemDto { DocumentTypeId = documentTypeId, DisplayOrder = displayOrder, Remarks = remarks, IsEnabled = true }
                }
            }, cancellationToken);

            if (bulkSaveResponse.Errors.Any() || bulkSaveResponse.SavedDocuments.Count == 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = string.Join(" | ", bulkSaveResponse.Errors) });

            var slot = bulkSaveResponse.SavedDocuments[0];

            await using (var stream = file.OpenReadStream())
            {
                await _documentService.UploadDocumentAsync(
                    stream, file.FileName, file.ContentType, file.Length,
                    new DocumentUploadDto
                    {
                        ReferenceTableName = "AssetGrievanceDocument",
                        ReferenceTableId = slot.Id,
                        DepartmentId = 1,
                        ModuleId = 1,
                        DocumentType = documentTypeId.ToString(),
                        BindingPurpose = remarks
                    },
                    _currentUserService.GetCurrentUserId(),
                    cancellationToken);
            }

            var documents = await _service.GetDocumentsByGrievanceIdAsync(grievanceDetailsId, cancellationToken);
            var saved = documents.FirstOrDefault(d => d.Id == slot.Id) ?? slot;

            return Ok(new ApiResponse<AssetGrievanceDocumentResponseDto> { Success = true, Items = saved, Message = "Document uploaded successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for GrievanceDetailsId: {GrievanceDetailsId}", grievanceDetailsId);
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "An error occurred while uploading the document." });
        }
    }

    /// <summary>Replaces the file on an existing evidence-document slot. The previous file's binding is deactivated, not destroyed.</summary>
    [HttpPut("{documentId}/replace")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetGrievanceDocumentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReplaceDocument(
        int documentId,
        IFormFile file,
        [FromForm] string? remarks,
        [FromForm] int? displayOrder,
        CancellationToken cancellationToken)
    {
        try
        {
            var existing = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
            if (existing == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Document not found." });

            var status = await GetGrievanceStatusAsync(existing.GrievanceDetailsId, cancellationToken);
            if (status == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Grievance not found." });
            if (status == StatusClosed)
                return Conflict(new ApiResponse<object> { Success = false, Message = "Cannot replace documents on a Closed grievance." });

            if (file == null || file.Length <= 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "A file is required." });

            var previousBindingId = existing.DocumentBindingId;
            var effectiveRemarks = remarks ?? existing.Remarks;

            var bulkSaveResponse = await _service.BulkSaveAsync(new AssetGrievanceDocumentBulkSaveDto
            {
                GrievanceDetailsId = existing.GrievanceDetailsId,
                Documents = new List<AssetGrievanceDocumentItemDto>
                {
                    new AssetGrievanceDocumentItemDto { Id = documentId, DocumentTypeId = existing.DocumentTypeId, DisplayOrder = displayOrder ?? existing.DisplayOrder, Remarks = effectiveRemarks, IsEnabled = true }
                }
            }, cancellationToken);

            if (bulkSaveResponse.Errors.Any())
                return BadRequest(new ApiResponse<object> { Success = false, Message = string.Join(" | ", bulkSaveResponse.Errors) });

            await using (var stream = file.OpenReadStream())
            {
                await _documentService.UploadDocumentAsync(
                    stream, file.FileName, file.ContentType, file.Length,
                    new DocumentUploadDto
                    {
                        ReferenceTableName = "AssetGrievanceDocument",
                        ReferenceTableId = documentId,
                        DepartmentId = 1,
                        ModuleId = 1,
                        DocumentType = existing.DocumentTypeId.ToString(),
                        BindingPurpose = effectiveRemarks
                    },
                    _currentUserService.GetCurrentUserId(),
                    cancellationToken);
            }

            if (previousBindingId.HasValue)
            {
                try
                {
                    await _documentService.DeactivateDocumentBindingAsync(previousBindingId.Value, _currentUserService.GetCurrentUserId(), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deactivate previous DocumentBinding {DocumentBindingId} while replacing AssetGrievanceDocument {DocumentId}", previousBindingId, documentId);
                }
            }

            var documents = await _service.GetDocumentsByGrievanceIdAsync(existing.GrievanceDetailsId, cancellationToken);
            var saved = documents.FirstOrDefault(d => d.Id == documentId);

            return Ok(new ApiResponse<AssetGrievanceDocumentResponseDto> { Success = true, Items = saved, Message = "Document replaced successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replacing AssetGrievanceDocument {DocumentId}", documentId);
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "An error occurred while replacing the document." });
        }
    }

    /// <summary>Removes a single evidence document (soft-disable — reuses AssetGrievanceDocumentApplicationService.BulkSaveAsync's existing IsEnabled=false path).</summary>
    [HttpDelete("{documentId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteDocument(int documentId, CancellationToken cancellationToken)
    {
        try
        {
            var existing = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
            if (existing == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Document not found." });

            var status = await GetGrievanceStatusAsync(existing.GrievanceDetailsId, cancellationToken);
            if (status == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Grievance not found." });
            if (status == StatusClosed)
                return Conflict(new ApiResponse<object> { Success = false, Message = "Cannot remove documents from a Closed grievance." });

            var response = await _service.BulkSaveAsync(new AssetGrievanceDocumentBulkSaveDto
            {
                GrievanceDetailsId = existing.GrievanceDetailsId,
                Documents = new List<AssetGrievanceDocumentItemDto>
                {
                    new AssetGrievanceDocumentItemDto { Id = documentId, DocumentTypeId = existing.DocumentTypeId, DisplayOrder = existing.DisplayOrder, Remarks = existing.Remarks, IsEnabled = false }
                }
            }, cancellationToken);

            if (response.Errors.Any())
                return BadRequest(new ApiResponse<object> { Success = false, Message = string.Join(" | ", response.Errors) });

            return Ok(new ApiResponse<object> { Success = true, Message = "Document removed successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting AssetGrievanceDocument {DocumentId}", documentId);
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "An error occurred while deleting the document." });
        }
    }
}
