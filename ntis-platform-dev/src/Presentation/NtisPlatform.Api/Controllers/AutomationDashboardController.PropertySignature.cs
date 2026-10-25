using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertySignature;
using NtisPlatform.Core.Models;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers
{
   
    public partial class AutomationDashboardController
    {
        /// <summary>
        /// Returns all active signing authorities in sequential order:
        /// Clerk → Tax Inspector → Assistant Commissioner → Additional Commissioner.
        /// </summary>
        [HttpGet("PropertySignature/authorities")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<SignAuthorityDto>>>> GetAuthorities(
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetAuthoritiesAsync(cancellationToken);
                return OkItems(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sign authorities");
                throw;
            }
        }

        /// <summary>
        /// Downloads the Excel template for PropertySignature upload.
        /// Required columns: PropertyId. Optional column: Remarks.
        /// </summary>
        [HttpGet("approve/template-excel")]
        public async Task<IActionResult> DownloadApprovalTemplate(CancellationToken cancellationToken = default)
        {
            try
            {
                var bytes = await _signatureService.GetApprovalUploadTemplateAsync(cancellationToken);
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "PropertySignatureUploadTemplate.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading approval template");
                throw;
            }
        }


        /// <summary>
        /// Returns zone-wise / division-wise sign-off grid data.
        /// Shows Clerk, Tax Inspector, Assistant Commissioner, and Additional Commissioner
        /// signed property counts (structure and unit) and total demands.
        /// </summary>
        [HttpGet("PropertySignature/dashboard-sign-grid")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<SignAuthorityGridResponseDto>>>> GetSignAuthorityGrid(
            [FromQuery] int? zoneId = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var searchRequest = zoneId.HasValue
                    ? new PropertySearchRequestDto { ZoneId = zoneId.Value }
                    : null;

                var result = await _signatureService.GetSignAuthorityGridDataAsync(searchRequest, cancellationToken);

                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sign-off grid statistics");
                throw;
            }
        }

        /// <summary>
        /// Returns ward-wise sign-off grid data for a specific zone.
        /// Shows Clerk, Tax Inspector, Assistant Commissioner, and Additional Commissioner
        /// signed property counts (structure and unit) and total demands for each ward in the zone.
        /// </summary>
        [HttpGet("PropertySignature/ward-wise-summary/zone")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<SignAuthorityWardGridResponseDto>>>> GetSignAuthorityWardGrid(
            [FromQuery] PropertySignatureWardGridQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetSignAuthorityWardGridDataAsync(queryParameters, cancellationToken);

                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ward-wise sign-off grid for ZoneId={ZoneId}", queryParameters.ZoneId);
                throw;
            }
        }

        /// <summary>
        /// Returns building-wise signature data for a specific ward and workflow stage.
        /// </summary>
        [HttpGet("PropertySignature/get-building-wise-details")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<PropertySignaturePagedResultDto<PropertySignatureSubGridDto>>>>> GetBuildingWiseData(
            [FromQuery] PropertySignatureBuildingWiseQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetSubGridAsync(queryParameters, cancellationToken);

                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error retrieving building-wise data for WardId={WardId}, WorkflowStageId={WorkflowStageId}",
                    queryParameters.WardId, queryParameters.WorkflowStageId);
                throw;
            }
        }

        /// <summary>
        /// Returns property-wise signature data including PropertyId and all signature details.
        /// Supports pagination and filters by building/property number.
        /// </summary>
        [HttpGet("PropertySignature/get-property-wise-details")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<PropertySignaturePagedResultDto<PropertySignaturePropertyWiseDto>>>>> GetPropertyWiseData(
            [FromQuery] PropertySignaturePropertyWiseQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetPropertyWiseDataAsync(queryParameters, cancellationToken);

                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property-wise data for PropertyNo={PropertyNo}", queryParameters.PropertyNo);
                throw;
            }
        }



        /// <summary>
        /// Returns export-ready rows for properties pending at the selected signing authority.
        /// </summary>
        [HttpGet("PropertySignature/pending-export")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<PropertySignaturePendingExportDto>>>> GetPendingExportData(
            [FromQuery] int signAuthorityId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetPendingExportDataAsync(signAuthorityId, cancellationToken);

                return OkItems(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending export data for SignAuthorityId={SignAuthorityId}", signAuthorityId);
                throw;
            }
        }

        /// <summary>
        /// Returns pending sign rows for the selected user and signing authority.
        /// </summary>
        [HttpGet("PropertySignature/get-pending-signs")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<PropertySignaturePagedResultDto<PropertySignaturePendingSignDto>>>>> GetPendingSigns(
            [FromQuery] PropertySignaturePendingSignsQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.GetPendingSignsAsync(queryParameters, cancellationToken);

                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error retrieving pending signs for UserId={UserId}", queryParameters.UserId);
                throw;
            }
        }

        /// <summary>
        /// Updates the current pending signature status and creates the next pending signature row when applicable.
        /// </summary>
        [HttpPut("PropertySignature/update-property-sign")]
        public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<PropertySignatureUpdateSignResponseDto>>>> UpdatePropertySign(
            [FromBody] PropertySignatureUpdateSignRequestDto request, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _signatureService.UpdateSignAsync(request, cancellationToken);
                return OkItem(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error updating signature for UserId={UserId}, PropertyId={PropertyId}, SignAuthorityId={SignAuthorityId}",
                    request.UserId,
                    request.PropertyId,
                    request.SignAuthorityId);
                throw;
            }
        }

        /// <summary>
        /// Extracts UserId from JWT token claims.
        /// </summary>
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(ClaimTypes.Name)?.Value;

            return int.TryParse(claim, out var id) ? id : 0;
        }
    }

    public class PropertySignatureItemsResponse<T> : AutomationDashboardItemsResponse<T>
    {
    }

}
