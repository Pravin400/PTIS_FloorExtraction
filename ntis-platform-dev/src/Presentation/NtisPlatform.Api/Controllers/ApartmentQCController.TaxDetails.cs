using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers
{
   
    public partial class ApartmentQCController : ControllerBase
    {

        /// <summary>
        /// Tax details for an apartment, summed across every unit (PropertyMast row) sharing the
        /// given <paramref name="wardId"/> + <paramref name="propertyNo"/>. Pass
        /// <paramref name="wingMasterId"/> (the WingMaster/WingEntity primary key) to narrow the sum
        /// to a single wing's units instead of the whole complex. <paramref name="taxType"/> selects
        /// which current-tax table(s) to read - RV (ptis.PolicyTaxDetails), CV
        /// (ptis.PolicyTaxDetailsCV), or Dual for both; arrears (ptis.TransMast) are always included.
        /// </summary>
        /// <response code="200">Tax details for the resolved properties.</response>
        /// <response code="400">Validation error.</response>
        /// <response code="404">No property found for the given ward, property number (and wing).</response>
        /// <response code="500">Internal server error.</response>
        [HttpGet("taxdetails")]
        [ProducesResponseType(typeof(ApiResponse<ApartmentTaxDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTaxDetails(
            [FromQuery] int wardId,
            [FromQuery] string propertyNo,
            [FromQuery] int? wingMasterId,
            [FromQuery] string taxType,
            CancellationToken ct)
        {
            if (wardId <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "wardId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(propertyNo))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "propertyNo is required."
                });
            }

            if (!Enum.TryParse<ApartmentTaxType>(taxType, ignoreCase: true, out var parsedTaxType))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "taxType is required and must be one of: RV, CV, Dual."
                });
            }

            var query = new ApartmentTaxDetailsQueryParameters
            {
                WardId = wardId,
                PropertyNo = propertyNo,
                WingMasterId = wingMasterId,
                TaxType = parsedTaxType,
            };

            var result = await _taxDetailsService.GetTaxDetailsAsync(query, ct);

            if (result is null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No property found for the given ward, property number" + (wingMasterId.HasValue ? ", and wing." : ".")
                });
            }

            return Ok(new ApiResponse<ApartmentTaxDetailsDto>
            {
                Success = true,
                Message = "Record found successfully",
                Items = result
            });
        }

        /// <summary>
        /// Policy-code-wise current demand for an apartment, summed across every unit (PropertyMast
        /// row) sharing the given <paramref name="wardId"/> + <paramref name="propertyNo"/>. Sourced
        /// from ptis.PolicyTaxDetails (RV) / ptis.PolicyTaxDetailsCV (CV) where IsCurrent = true;
        /// unlike <c>taxdetails</c>, non-NETTAX rows keep their real PolicyCode instead of being
        /// collapsed to "Demand". Same inputs as <c>taxdetails</c>.
        /// </summary>
        /// <response code="200">Demand details for the resolved properties.</response>
        /// <response code="400">Validation error.</response>
        /// <response code="404">No property found for the given ward, property number (and wing).</response>
        /// <response code="500">Internal server error.</response>
        [HttpGet("demanddetails")]
        [ProducesResponseType(typeof(ApiResponse<ApartmentDemandDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDemandDetails(
            [FromQuery] int wardId,
            [FromQuery] string propertyNo,
            [FromQuery] int? wingMasterId,
            [FromQuery] string taxType,
            CancellationToken ct)
        {
            if (wardId <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "wardId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(propertyNo))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "propertyNo is required."
                });
            }

            if (!Enum.TryParse<ApartmentTaxType>(taxType, ignoreCase: true, out var parsedTaxType))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "taxType is required and must be one of: RV, CV, Dual."
                });
            }

            var query = new ApartmentTaxDetailsQueryParameters
            {
                WardId = wardId,
                PropertyNo = propertyNo,
                WingMasterId = wingMasterId,
                TaxType = parsedTaxType,
            };

            var result = await _taxDetailsService.GetDemandDetailsAsync(query, ct);

            if (result is null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No property found for the given ward, property number" + (wingMasterId.HasValue ? ", and wing." : ".")
                });
            }

            return Ok(new ApiResponse<ApartmentDemandDetailsDto>
            {
                Success = true,
                Message = "Record found successfully",
                Items = result
            });
        }

        /// <summary>
        /// Policy-code-wise ptis.TransMast totals for one specific finance year, summed across every
        /// unit (PropertyMast row) sharing the given <paramref name="wardId"/> + <paramref name="propertyNo"/>.
        /// Same inputs as <c>taxdetails</c>, plus <paramref name="financeYearId"/> (the YearMaster
        /// primary key) to select the year.
        /// </summary>
        /// <response code="200">Year-wise tax details for the resolved properties.</response>
        /// <response code="400">Validation error.</response>
        /// <response code="404">No property found for the given ward, property number (and wing).</response>
        /// <response code="500">Internal server error.</response>
        [HttpGet("yearwisedetails")]
        [ProducesResponseType(typeof(ApiResponse<ApartmentYearWiseTaxDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetYearWiseDetails(
            [FromQuery] int wardId,
            [FromQuery] string propertyNo,
            [FromQuery] int? wingMasterId,
            [FromQuery] string taxType,
            [FromQuery] int financeYearId,
            CancellationToken ct)
        {
            if (wardId <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "wardId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(propertyNo))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "propertyNo is required."
                });
            }

            if (!Enum.TryParse<ApartmentTaxType>(taxType, ignoreCase: true, out var parsedTaxType))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "taxType is required and must be one of: RV, CV, Dual."
                });
            }

            if (financeYearId <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "financeYearId is required."
                });
            }

            var query = new ApartmentYearWiseTaxDetailsQueryParameters
            {
                WardId = wardId,
                PropertyNo = propertyNo,
                WingMasterId = wingMasterId,
                TaxType = parsedTaxType,
                FinanceYearId = financeYearId,
            };

            var result = await _taxDetailsService.GetYearWiseTaxDetailsAsync(query, ct);

            if (result is null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No property found for the given ward, property number" + (wingMasterId.HasValue ? ", and wing." : ".")
                });
            }

            return Ok(new ApiResponse<ApartmentYearWiseTaxDetailsDto>
            {
                Success = true,
                Message = "Record found successfully",
                Items = result
            });
        }
    }
}
