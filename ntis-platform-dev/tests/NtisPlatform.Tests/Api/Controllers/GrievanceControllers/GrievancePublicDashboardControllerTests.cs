using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers;

public class GrievancePublicDashboardControllerTests
{
    private static GrievancePublicDashboardController Create(out Mock<IPublicDashboardService> service)
    {
        service = new Mock<IPublicDashboardService>();
        var logger = new Mock<ILogger<GrievancePublicDashboardController>>();
        return new GrievancePublicDashboardController(service.Object, logger.Object);
    }

    [Fact]
    public async Task GetDashboard_ReturnsOk_WithDashboardData()
    {
        var controller = Create(out var service);
        var query = new PublicDashboardQueryParameters();
        var expectedResponse = new PublicDashboardResponseDto
        {
            Summary = new PublicDashboardStatsDto
            {
                TotalReceived = 40,
                TotalResolved = 32,
                InProgress = 4,
                ResolutionRate = 80.0,
                AvgResolutionDays = 2.4
            },
            Departments = new List<DepartmentPerformanceDto>
            {
                new DepartmentPerformanceDto
                {
                    Id = 1,
                    DepartmentName = "Public Works Department",
                    TotalReceived = 11,
                    Resolved = 7,
                    ResolutionRate = 63.64,
                    AvgDays = 3.2
                }
            }
        };

        service.Setup(s => s.GetDashboardAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        var result = await controller.GetDashboard(query, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
        var actual = Assert.IsType<PublicDashboardResponseDto>(okResult.Value);
        Assert.Equal(40, actual.Summary.TotalReceived);
        Assert.Equal(32, actual.Summary.TotalResolved);
        Assert.Equal(80.0, actual.Summary.ResolutionRate);
        Assert.Single(actual.Departments);
        Assert.Equal("Public Works Department", actual.Departments[0].DepartmentName);
    }

    [Fact]
    public async Task GetDashboard_PassesQueryParametersToService()
    {
        var controller = Create(out var service);
        var query = new PublicDashboardQueryParameters
        {
            DepartmentId = 1,
            SearchTerm = "Water",
            FromDate = new DateTime(2026, 9, 1),
            ToDate = new DateTime(2026, 9, 30)
        };

        service.Setup(s => s.GetDashboardAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicDashboardResponseDto());

        var result = await controller.GetDashboard(query, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        service.Verify(s => s.GetDashboardAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDashboard_WhenServiceThrows_Returns500InternalServerError()
    {
        var controller = Create(out var service);
        var query = new PublicDashboardQueryParameters();

        service.Setup(s => s.GetDashboardAsync(query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database connection error"));

        var result = await controller.GetDashboard(query, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
    }
}
