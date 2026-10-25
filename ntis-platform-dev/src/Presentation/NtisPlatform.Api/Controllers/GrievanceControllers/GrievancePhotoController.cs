using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Grievance;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

[ApiController]
[Route("api/grievance-photos")]
[Authorize]
public class GrievancePhotoController : ControllerBase
{
    private readonly IGrievancePhotoService _photoService;
    private readonly ILogger<GrievancePhotoController> _logger;

    public GrievancePhotoController(IGrievancePhotoService photoService, ILogger<GrievancePhotoController> logger)
    {
        _photoService = photoService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpGet("grievance/{grievanceId}")]
    public async Task<IActionResult> GetPhotosByGrievance(int grievanceId, CancellationToken cancellationToken)
    {
        try
        {
            var photos = await _photoService.GetPhotosByGrievanceIdAsync(grievanceId, cancellationToken);
            return Ok(photos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting photos for GrievanceId={GrievanceId}", grievanceId);
            return StatusCode(500, new { Message = "An error occurred while retrieving grievance photos" });
        }
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadPhoto([FromForm] UploadGrievancePhotoDto dto, CancellationToken cancellationToken)
    {
        try
        {
            if (!IsImageFile(dto.File))
            {
                return BadRequest(new { Message = "Only image files (jpeg, jpg, png, gif, jfif) are allowed." });
            }
            int userId = GetUserId();
            var photoId = await _photoService.UploadPhotoAsync(dto, userId, cancellationToken);
            return Ok(new { Message = "Photo uploaded successfully", GrievancePhotoId = photoId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading photo for GrievanceId={GrievanceId}", dto.GrievanceApplicationId);
            return StatusCode(500, new { Message = "An error occurred while uploading the photo" });
        }
    }

    [HttpPost("upload-multiple")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadMultiplePhotos([FromForm] UploadMultipleGrievancePhotosDto dto, CancellationToken cancellationToken)
    {
        try
        {
            foreach (var file in dto.Files)
            {
                if (!IsImageFile(file))
                {
                    return BadRequest(new { Message = "Only image files (jpeg, jpg, png, gif, jfif) are allowed." });
                }
            }
            int userId = GetUserId();
            var photoIds = await _photoService.UploadMultiplePhotosAsync(dto, userId, cancellationToken);
            return Ok(new { Message = $"{photoIds.Count} photos uploaded successfully", GrievancePhotoIds = photoIds });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading multiple photos for GrievanceId={GrievanceId}", dto.GrievanceApplicationId);
            return StatusCode(500, new { Message = "An error occurred while uploading multiple photos" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePhoto(int id, CancellationToken cancellationToken)
    {
        try
        {
            int userId = GetUserId();
            await _photoService.DeletePhotoAsync(id, userId, cancellationToken);
            return Ok(new { Message = "Photo deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Grievance Photo ID={Id}", id);
            return StatusCode(500, new { Message = "An error occurred while deleting the photo" });
        }
    }

    [AllowAnonymous]
    [HttpGet("{id}/view")]
    public async Task<IActionResult> ViewPhoto(int id, CancellationToken cancellationToken)
    {
        try
        {
            var (fileStream, fileName, mimeType) = await _photoService.ViewPhotoAsync(id, cancellationToken);
            if (fileStream == null)
            {
                return NotFound(new { Success = false, Message = "Photo not found" });
            }

            var contentDisposition = new Microsoft.Net.Http.Headers.ContentDispositionHeaderValue("inline");
            contentDisposition.SetHttpFileName(fileName);
            Response.Headers.ContentDisposition = contentDisposition.ToString();
            return File(fileStream, mimeType, enableRangeProcessing: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error viewing Grievance Photo ID={Id}", id);
            return StatusCode(500, new { Message = "An error occurred while viewing the photo" });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
        {
            throw new UnauthorizedAccessException("Valid user identification is required.");
        }
        return id;
    }

    private static bool IsImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0) return false;

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif" };
        var allowedMimeTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/jfif" };

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var mimeType = file.ContentType.ToLowerInvariant();

        return allowedExtensions.Contains(extension) && allowedMimeTypes.Contains(mimeType);
    }
}
