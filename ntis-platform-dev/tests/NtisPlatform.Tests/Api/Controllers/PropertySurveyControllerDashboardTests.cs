using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;
using NtisPlatform.Application.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertySurveyControllerDashboardTests
{
    private readonly Mock<IPropertySurveyService> _mockSurveyService;
    private readonly Mock<IPropertyVisitTrackerService> _mockVisitTrackerService;
    private readonly Mock<IPropertySurveyDashboardService> _mockDashboardService;
    private readonly Mock<ILogger<PropertySurveyController>> _mockLogger;
    private readonly PropertySurveyController _controller;

    public PropertySurveyControllerDashboardTests()
    {
        _mockSurveyService = new Mock<IPropertySurveyService>();
        _mockVisitTrackerService = new Mock<IPropertyVisitTrackerService>();
        _mockDashboardService = new Mock<IPropertySurveyDashboardService>();
        _mockLogger = new Mock<ILogger<PropertySurveyController>>();

        _controller = new PropertySurveyController(
            _mockSurveyService.Object,
            _mockVisitTrackerService.Object,
            _mockDashboardService.Object,
            _mockLogger.Object);
    }

    private void SetUserContext(string? userIdClaim)
    {
        var httpContext = new DefaultHttpContext();
        if (userIdClaim != null)
        {
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userIdClaim) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
        }
        else
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        }

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task GetPropertyDashboardDetailsAsync_ValidUser_ReturnsOkWithDashboardData()
    {
        // Arrange
        const int userId = 42;
        SetUserContext(userId.ToString());

        var queryParams = new SurveyDashboardQueryParameters
        {
            WardId = 5,
            FilterType = "All"
        };

        var expectedResponse = new SurveyDashboardResponseDto
        {
            TotalProperties = 100,
            TotalOldProperties = 20,
            TotalWings = 4,
            Assessed = 60,
            Unassessed = 40,
            TotalAmenities = 10,
            IndividualDetails = new IndividualDto { TotalIndividualProperties = 50 },
            ApartmentDetails = new ApartmentDto { TotalApartmentProperties = 30 },
            IndustryDetails = new IndustryDto { TotalIndustryProperties = 15 },
            PlotDetails = new PlotDto { TotalPlotProperties = 5 }
        };

        _mockDashboardService
            .Setup(s => s.GetAllAsync(queryParams, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPropertyDashboardDetailsAsync(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actualResponse = Assert.IsType<SurveyDashboardResponseDto>(okResult.Value);
        Assert.Equal(100, actualResponse.TotalProperties);
        Assert.Equal(20, actualResponse.TotalOldProperties);
        Assert.Equal(60, actualResponse.Assessed);
        Assert.Equal(40, actualResponse.Unassessed);
        Assert.Equal(50, actualResponse.IndividualDetails.TotalIndividualProperties);

        _mockDashboardService.Verify(
            s => s.GetAllAsync(queryParams, userId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-number")]
    [InlineData("0")]
    [InlineData("-5")]
    public async Task GetPropertyDashboardDetailsAsync_InvalidOrMissingUserIdClaim_ReturnsUnauthorized(string? userIdClaim)
    {
        // Arrange
        SetUserContext(userIdClaim);

        var queryParams = new SurveyDashboardQueryParameters { WardId = 1 };

        // Act
        var result = await _controller.GetPropertyDashboardDetailsAsync(queryParams, CancellationToken.None);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, unauthorizedResult.StatusCode);

        _mockDashboardService.Verify(
            s => s.GetAllAsync(It.IsAny<SurveyDashboardQueryParameters>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetPropertyDashboardDetailsAsync_PropagatesCancellationToken()
    {
        // Arrange
        const int userId = 10;
        SetUserContext(userId.ToString());

        var queryParams = new SurveyDashboardQueryParameters { WardId = 3 };
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        _mockDashboardService
            .Setup(s => s.GetAllAsync(queryParams, userId, token))
            .ReturnsAsync(new SurveyDashboardResponseDto());

        // Act
        var result = await _controller.GetPropertyDashboardDetailsAsync(queryParams, token);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockDashboardService.Verify(
            s => s.GetAllAsync(queryParams, userId, token),
            Times.Once);
    }

    [Fact]
    public void GetPropertyDashboardDetailsAsync_HasAuthorizeAttribute()
    {
        var method = typeof(PropertySurveyController).GetMethod(nameof(PropertySurveyController.GetPropertyDashboardDetailsAsync));
        Assert.NotNull(method);
        var authorizeAttribute = method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false);
        Assert.NotEmpty(authorizeAttribute);
    }
}
