using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/rateable-value")]
    [Authorize]
    public class RateableValueController : ControllerBase
    {
        private readonly IRetrospectiveTaxRefresher _retrospectiveTaxRefresher;
        private readonly ILogger<RateableValueController> _logger;

        public RateableValueController(
            IRetrospectiveTaxRefresher retrospectiveTaxRefresher,
            ILogger<RateableValueController> logger)
        {
            _retrospectiveTaxRefresher = retrospectiveTaxRefresher;
            _logger = logger;
        }

        [HttpPost("{propertyId:int}")]
        public async Task<ActionResult<RateableValueResponseDto>> Calculate(int propertyId, [FromQuery] bool forceRecalculate = false)
        {
            if (propertyId <= 0)
                return BadRequest("propertyId must be a positive integer.");

            try
            {
                // The RV recalculation and the Retrospective Rule Engine run as one critical section per property
                // (IRetrospectiveTaxRefresher): this standalone endpoint would otherwise leave CC/OC/Electric-Bill
                // amounts stale after the recalculation (they read the NETTAX rate snapshots RV just wrote), and the
                // current-year TransMast row of a certificate replaced by NETTAX, until the next certificate-change
                // event happens to fire. Every other caller of the RV recalculation goes through the same refresher.
                //
                // The engine always runs (no certificate-existence pre-check): a unit's CC/OC/Electric-Bill evidence
                // can come from its own PropertyId-scoped certificate OR be inherited from its Wing/Society
                // (EntityType 'W'/'S', which carries no PropertyId of its own -- see
                // PropertyCertificateEntity.ValidateEntityScope), so a PropertyId-only existence check under-detects
                // and silently skips the engine for exactly those units. The engine already resolves both cases
                // internally and handles "no evidence at all" cheaply (FindMatchingRuleAsync returns null, existing
                // rows are cleaned up, nothing throws).
                //
                // A failure of the engine fails the request (a RetrospectiveRefreshFailedException with a message that is safe
                // to show): the recalculation is already saved and has replaced a certificate's current-year TransMast row
                // with NETTAX, so answering 200 would hide a ledger that is known to need another calculation.
                var refresh = await _retrospectiveTaxRefresher.RefreshAsync(
                    propertyId,
                    GetUserId(),
                    new RetrospectiveTaxRefreshOptions { ForceRecalculate = forceRecalculate });

                return Ok(refresh.RateableValue);
            }
            catch (RetrospectiveCalculationInProgressException ex)
            {
                // Nothing was started: another calculation of this property holds its lock for longer than we wait.
                _logger.LogWarning(ex, "RV calculation for PropertyId={PropertyId} not started: another calculation of the property is still running", propertyId);
                return Conflict(new { error = "Another calculation for this property is still running. Please try again in a moment." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "RV calculation rejected for PropertyId={PropertyId}", propertyId);
                return NotFound(new { error = "Rateable value calculation could not be completed for the requested property." });
            }
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            {
                throw new UnauthorizedAccessException("Valid user identification is required.");
            }
            return id;
        }
    }
}
