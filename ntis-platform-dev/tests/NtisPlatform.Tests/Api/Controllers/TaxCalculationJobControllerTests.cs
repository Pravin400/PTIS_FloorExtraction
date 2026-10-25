using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.PropertyCertificate;
using NtisPlatform.Application.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class TaxCalculationJobControllerTests
{
    private readonly Mock<ITaxCalculationJobCoordinator> _mockCoordinator = new();
    private readonly Mock<ITaxCalculationNotifier> _mockNotifier = new();
    private readonly Mock<ILogger<TaxCalculationJobController>> _mockLogger = new();
    private readonly TaxCalculationJobController _controller;

    public TaxCalculationJobControllerTests()
    {
        _controller = new TaxCalculationJobController(
            _mockCoordinator.Object,
            _mockNotifier.Object,
            _mockLogger.Object);
    }

    private void SetUser(int userId, params string[] roles)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId.ToString()) };
        foreach (var role in roles)
        {
            claims.Add(new(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static Mock<ITaxCalculationJobContext> CreateMockJob(string jobId, int createdByUserId)
    {
        var mock = new Mock<ITaxCalculationJobContext>();
        mock.SetupGet(j => j.JobId).Returns(jobId);
        mock.SetupGet(j => j.EntityType).Returns("S");
        mock.SetupGet(j => j.SocietyDetailId).Returns(10);
        mock.SetupGet(j => j.TotalUnits).Returns(5);
        mock.SetupGet(j => j.ProcessedUnits).Returns(2);
        mock.SetupGet(j => j.CurrentPropertyId).Returns(101);
        mock.SetupGet(j => j.CreatedByUserId).Returns(createdByUserId);
        mock.SetupGet(j => j.Status).Returns(TaxCalculationJobStatus.Processing);
        return mock;
    }

    [Fact]
    public async Task PauseJob_DifferentUser_NotAdmin_ReturnsForbid()
    {
        SetUser(userId: 99); // different user
        var mockJob = CreateMockJob("JOB-1", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-1")).Returns(mockJob.Object);

        var result = await _controller.PauseJob("JOB-1");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task PauseJob_CreatorUser_ReturnsOk()
    {
        SetUser(userId: 42); // creator
        var mockJob = CreateMockJob("JOB-1", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-1")).Returns(mockJob.Object);
        _mockCoordinator.Setup(c => c.PauseJob("JOB-1")).Returns(true);

        var result = await _controller.PauseJob("JOB-1");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
        _mockNotifier.Verify(n => n.NotifyProgressAsync(It.Is<TaxCalculationProgressDto>(d => d.Status == "Paused"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PauseJob_AdminUser_ReturnsOk()
    {
        SetUser(userId: 99, "Admin"); // admin user
        var mockJob = CreateMockJob("JOB-1", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-1")).Returns(mockJob.Object);
        _mockCoordinator.Setup(c => c.PauseJob("JOB-1")).Returns(true);

        var result = await _controller.PauseJob("JOB-1");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    [Fact]
    public async Task CancelJob_CreatorUser_BroadcastsCancellingProgressAndReturnsAcceptedWithCancellingStatus()
    {
        SetUser(userId: 42);
        var mockJob = CreateMockJob("JOB-2", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-2")).Returns(mockJob.Object);
        _mockCoordinator.Setup(c => c.CancelJob("JOB-2")).Returns(true);

        var result = await _controller.CancelJob("JOB-2");

        var acceptedResult = Assert.IsType<AcceptedResult>(result);
        Assert.Equal(StatusCodes.Status202Accepted, acceptedResult.StatusCode);

        var statusProp = acceptedResult.Value?.GetType().GetProperty("status")?.GetValue(acceptedResult.Value)?.ToString();
        Assert.Equal("Cancelling", statusProp);
        Assert.NotEqual("Cancelled", statusProp);

        // Verify it broadcast "Cancelling" via NotifyProgressAsync, and did NOT call NotifyCompletedAsync
        _mockNotifier.Verify(n => n.NotifyProgressAsync(It.Is<TaxCalculationProgressDto>(d => d.Status == "Cancelling"), It.IsAny<CancellationToken>()), Times.Once);
        _mockNotifier.Verify(n => n.NotifyCompletedAsync(It.IsAny<TaxCalculationCompletedDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PauseJob_JobWithZeroCreatorUserId_NonAdminUser_ReturnsForbid()
    {
        SetUser(userId: 42); // regular user, not admin
        var mockJob = CreateMockJob("JOB-ZERO", createdByUserId: 0);
        _mockCoordinator.Setup(c => c.GetJob("JOB-ZERO")).Returns(mockJob.Object);

        var result = await _controller.PauseJob("JOB-ZERO");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task PauseJob_JobWithZeroCreatorUserId_AdminUser_ReturnsOk()
    {
        SetUser(userId: 99, "Admin"); // Admin user
        var mockJob = CreateMockJob("JOB-ZERO", createdByUserId: 0);
        _mockCoordinator.Setup(c => c.GetJob("JOB-ZERO")).Returns(mockJob.Object);
        _mockCoordinator.Setup(c => c.PauseJob("JOB-ZERO")).Returns(true);

        var result = await _controller.PauseJob("JOB-ZERO");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    [Fact]
    public async Task CancelJob_JobWithZeroCreatorUserId_NonAdminUser_ReturnsForbid()
    {
        SetUser(userId: 42); // regular user, not admin
        var mockJob = CreateMockJob("JOB-ZERO", createdByUserId: 0);
        _mockCoordinator.Setup(c => c.GetJob("JOB-ZERO")).Returns(mockJob.Object);

        var result = await _controller.CancelJob("JOB-ZERO");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public void GetJobStatus_DifferentUser_NotAdmin_ReturnsForbid()
    {
        SetUser(userId: 99);
        var mockJob = CreateMockJob("JOB-3", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-3")).Returns(mockJob.Object);

        var result = _controller.GetJobStatus("JOB-3");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public void GetJobStatus_JobWithZeroCreatorUserId_NonAdminUser_ReturnsForbid()
    {
        SetUser(userId: 42); // regular user, not admin
        var mockJob = CreateMockJob("JOB-ZERO", createdByUserId: 0);
        _mockCoordinator.Setup(c => c.GetJob("JOB-ZERO")).Returns(mockJob.Object);

        var result = _controller.GetJobStatus("JOB-ZERO");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public void GetJobStatus_CreatorUser_ReturnsOkWithJobDetails()
    {
        SetUser(userId: 42);
        var mockJob = CreateMockJob("JOB-3", createdByUserId: 42);
        _mockCoordinator.Setup(c => c.GetJob("JOB-3")).Returns(mockJob.Object);

        var result = _controller.GetJobStatus("JOB-3");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    [Fact]
    public async Task CancelLifecycle_StatusReturnsCancellingAfterCancel_AndCancelledOnlyAfterWorkerTermination()
    {
        SetUser(userId: 42);
        const string jobId = "JOB-REGRESSION-CANCEL";

        // Setup mutable status to model background lifecycle
        var currentStatus = TaxCalculationJobStatus.Processing;
        var isCancelled = false;

        var mockJob = new Mock<ITaxCalculationJobContext>();
        mockJob.SetupGet(j => j.JobId).Returns(jobId);
        mockJob.SetupGet(j => j.EntityType).Returns("S");
        mockJob.SetupGet(j => j.SocietyDetailId).Returns(10);
        mockJob.SetupGet(j => j.TotalUnits).Returns(5);
        mockJob.SetupGet(j => j.ProcessedUnits).Returns(2);
        mockJob.SetupGet(j => j.CurrentPropertyId).Returns(101);
        mockJob.SetupGet(j => j.CreatedByUserId).Returns(42);
        mockJob.SetupGet(j => j.Status).Returns(() => currentStatus);
        mockJob.SetupGet(j => j.IsCancellationRequested).Returns(() => isCancelled);

        _mockCoordinator.Setup(c => c.GetJob(jobId)).Returns(mockJob.Object);
        _mockCoordinator.Setup(c => c.CancelJob(jobId))
            .Returns(() =>
            {
                currentStatus = TaxCalculationJobStatus.Cancelling;
                isCancelled = true;
                return true;
            });

        // 1. Initial Status check -> Processing
        var initialStatusResult = _controller.GetJobStatus(jobId);
        var initialOk = Assert.IsType<OkObjectResult>(initialStatusResult);
        var initialStatusVal = initialOk.Value?.GetType().GetProperty("status")?.GetValue(initialOk.Value)?.ToString();
        Assert.Equal("Processing", initialStatusVal);

        // 2. User invokes POST /cancel -> returns HTTP 202 with status = "Cancelling"
        var cancelResult = await _controller.CancelJob(jobId);
        var acceptedResult = Assert.IsType<AcceptedResult>(cancelResult);
        Assert.Equal(StatusCodes.Status202Accepted, acceptedResult.StatusCode);
        var acceptedStatusVal = acceptedResult.Value?.GetType().GetProperty("status")?.GetValue(acceptedResult.Value)?.ToString();
        Assert.Equal("Cancelling", acceptedStatusVal);

        // 3. Client immediately polls GET /status while worker is still shutting down -> returns HTTP 200 with status = "Cancelling" (NOT "Cancelled")
        var intermediateStatusResult = _controller.GetJobStatus(jobId);
        var intermediateOk = Assert.IsType<OkObjectResult>(intermediateStatusResult);
        var intermediateStatusVal = intermediateOk.Value?.GetType().GetProperty("status")?.GetValue(intermediateOk.Value)?.ToString();
        Assert.Equal("Cancelling", intermediateStatusVal);
        Assert.NotEqual("Cancelled", intermediateStatusVal);

        // 4. Background worker finishes termination and sets status to Cancelled
        currentStatus = TaxCalculationJobStatus.Cancelled;

        // 5. Client polls GET /status after worker termination -> returns HTTP 200 with status = "Cancelled"
        var finalStatusResult = _controller.GetJobStatus(jobId);
        var finalOk = Assert.IsType<OkObjectResult>(finalStatusResult);
        var finalStatusVal = finalOk.Value?.GetType().GetProperty("status")?.GetValue(finalOk.Value)?.ToString();
        Assert.Equal("Cancelled", finalStatusVal);
    }
}
