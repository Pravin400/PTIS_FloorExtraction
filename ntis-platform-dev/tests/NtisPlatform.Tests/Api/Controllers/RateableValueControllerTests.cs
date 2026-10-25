using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

/// <summary>
/// Covers the standalone "Recalculate RV" endpoint. It goes through <see cref="IRetrospectiveTaxRefresher"/>, which
/// recalculates RV and then runs the Retrospective Rule Engine as one critical section per property: unlike the
/// certificate-change pipeline this endpoint previously left CC/OC/Electric-Bill amounts stale after an RV
/// recalculation, since nothing else re-triggered them.
/// </summary>
public class RateableValueControllerTests
{
    private const int PropertyId = 549441;

    private static RateableValueController Create(out Mock<IRetrospectiveTaxRefresher> refresher, int? userId = 42)
    {
        refresher = new Mock<IRetrospectiveTaxRefresher>();
        var logger = new Mock<ILogger<RateableValueController>>();

        var controller = new RateableValueController(refresher.Object, logger.Object);

        var httpContext = new DefaultHttpContext();
        if (userId.HasValue)
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString())
            }, "TestAuth"));
        }
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    private static void ArrangeRefresh(Mock<IRetrospectiveTaxRefresher> refresher, RateableValueResponseDto rv)
        => refresher
            .Setup(r => r.RefreshAsync(PropertyId, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RetrospectiveTaxRefreshResult(rv, null));

    [Fact]
    public async Task Calculate_OnSuccess_RefreshesThePropertyAsTheRequestingUser_AndReturnsTheRvResult()
    {
        const int userId = 42;
        var controller = Create(out var refresher, userId);
        var rvResult = new RateableValueResponseDto { PropertyId = PropertyId, TotalRateableValue = 12345m };
        ArrangeRefresh(refresher, rvResult);

        var result = await controller.Calculate(PropertyId);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(rvResult, ok.Value);
        refresher.Verify(r => r.RefreshAsync(PropertyId, userId, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Calculate_PassesTheForceFlagOn(bool forceRecalculate)
    {
        var controller = Create(out var refresher);
        ArrangeRefresh(refresher, new RateableValueResponseDto { PropertyId = PropertyId });

        await controller.Calculate(PropertyId, forceRecalculate);

        refresher.Verify(r => r.RefreshAsync(
                PropertyId, It.IsAny<int?>(),
                It.Is<RetrospectiveTaxRefreshOptions?>(o => o != null && o.ForceRecalculate == forceRecalculate),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Calculate_WhenTheEngineFails_TheRequestFails_ItIsNotAnsweredWithAnOkRvResult()
    {
        // The RV recalculation is saved and has replaced a certificate's current-year TransMast row with NETTAX; the failed
        // engine did not put it back. A 200 would hide a ledger that is known to need another calculation, so the failure
        // reaches the exception middleware (a message that is safe to show), not the RV endpoint's 404 for a rejected RV.
        var controller = Create(out var refresher);
        var failure = new RetrospectiveRefreshFailedException(PropertyId, "ab12cd34", null, new InvalidOperationException("boom"));
        refresher
            .Setup(r => r.RefreshAsync(PropertyId, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(failure);

        var thrown = await Assert.ThrowsAsync<RetrospectiveRefreshFailedException>(() => controller.Calculate(PropertyId));

        Assert.Same(failure, thrown);
    }

    [Fact]
    public async Task Calculate_NoDirectPropertyCertificate_StillRefreshes()
    {
        // A unit whose CC/OC/Electric-Bill evidence is only inherited from its Wing/Society
        // (EntityType 'W'/'S' rows carry no PropertyId of their own -- see
        // PropertyCertificateEntity.ValidateEntityScope) has no PropertyId-scoped certificate row.
        // The engine must still run for it: it resolves Wing/Society-inherited evidence internally
        // and handles "no evidence at all" cheaply on its own, so this endpoint must never gate the
        // call on a PropertyId-only certificate-existence check (that under-detects exactly this case).
        const int userId = 42;
        var controller = Create(out var refresher, userId);
        ArrangeRefresh(refresher, new RateableValueResponseDto { PropertyId = PropertyId });

        var result = await controller.Calculate(PropertyId);

        Assert.IsType<OkObjectResult>(result.Result);
        refresher.Verify(r => r.RefreshAsync(PropertyId, userId, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_RvCalculationRejected_ReturnsNotFound()
    {
        var controller = Create(out var refresher);
        refresher
            .Setup(r => r.RefreshAsync(PropertyId, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("no property details"));

        var result = await controller.Calculate(PropertyId);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Calculate_WhenAnotherCalculationHoldsThePropertysLock_ReturnsConflict_NotNotFound()
    {
        // the refresher did not start anything: the lock of the property was not granted in time. That is not "the
        // property cannot be calculated" (404), it is "try again in a moment" (409)
        var controller = Create(out var refresher);
        refresher
            .Setup(r => r.RefreshAsync(PropertyId, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RetrospectiveCalculationInProgressException(PropertyId, "Another retrospective calculation for property 549441 did not finish within 120 seconds; this one was not started. Try again."));

        var result = await controller.Calculate(PropertyId);

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
    }

    [Fact]
    public async Task Calculate_WithAnInvalidPropertyId_ReturnsBadRequest_AndRefreshesNothing()
    {
        var controller = Create(out var refresher);

        var result = await controller.Calculate(0);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        refresher.Verify(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Calculate_WithoutAUserClaim_Throws_AndRefreshesNothing()
    {
        // the user is read before anything is recalculated: an RV recalculation without a user to put the engine's rows
        // under would be half of the pipeline
        var controller = Create(out var refresher, userId: null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => controller.Calculate(PropertyId));

        refresher.Verify(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
