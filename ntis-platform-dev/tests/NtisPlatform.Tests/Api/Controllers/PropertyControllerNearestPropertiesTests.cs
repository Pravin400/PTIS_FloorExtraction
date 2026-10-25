using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyControllerNearestPropertiesTests
{
    private readonly Mock<IPropertyService> _mockPropertyService;
    private readonly Mock<ILogger<PropertyController>> _mockLogger;
    private readonly PropertyController _controller;

    public PropertyControllerNearestPropertiesTests()
    {
        _mockPropertyService = new Mock<IPropertyService>();
        _mockLogger = new Mock<ILogger<PropertyController>>();
        _controller = PropertyControllerTestHelper.CreateController(_mockPropertyService, _mockLogger);
    }

    [Fact]
    public async Task GetNearestProperties_WithValidCoordinates_ReturnsOk()
    {
        // Arrange
        var queryParams = new NearestPropertiesQueryParameters
        {
            Latitude = 19.2837407,
            Longitude = 72.9314766,
            RadiusInKm = 2.0,
            Limit = 10
        };

        var expectedProperties = new List<NearestPropertyDto>
        {
            new()
            {
                PropertyId = 1428599,
                WardId = 81,
                PropertyNo = "11",
                PartitionNo = "1",
                OwnerName = "THE HOLDER",
                Latitude = 19.2837407m,
                Longitude = 72.9314766m,
                DistanceInMeters = 0.0,
                DistanceInKm = 0.0
            }
        };

        _mockPropertyService
            .Setup(s => s.GetNearestPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedProperties);

        // Act
        var actionResult = await _controller.GetNearestProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<List<NearestPropertyDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Single(response.Items);
        Assert.Equal(1428599, response.Items[0].PropertyId);
    }

    [Fact]
    public async Task GetNearestProperties_WithInvalidLatitude_ReturnsBadRequest()
    {
        // Arrange
        var queryParams = new NearestPropertiesQueryParameters
        {
            Latitude = 95.0, // Invalid latitude > 90
            Longitude = 72.9314766
        };

        // Act
        var actionResult = await _controller.GetNearestProperties(queryParams, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<List<NearestPropertyDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Contains("Latitude", response.Message);
    }

    [Fact]
    public async Task GetNearestProperties_WithInvalidLongitude_ReturnsBadRequest()
    {
        // Arrange
        var queryParams = new NearestPropertiesQueryParameters
        {
            Latitude = 19.2837407,
            Longitude = 185.0 // Invalid longitude > 180
        };

        // Act
        var actionResult = await _controller.GetNearestProperties(queryParams, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<List<NearestPropertyDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Contains("Longitude", response.Message);
    }

    [Fact]
    public async Task GetNearestProperties_WhenServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var queryParams = new NearestPropertiesQueryParameters
        {
            Latitude = 19.2837407,
            Longitude = 72.9314766
        };

        _mockPropertyService
            .Setup(s => s.GetNearestPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Custom validation failed"));

        // Act
        var actionResult = await _controller.GetNearestProperties(queryParams, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<List<NearestPropertyDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("Custom validation failed", response.Message);
    }

    [Fact]
    public async Task GetNearestProperties_WhenServiceThrowsException_Returns500InternalServerError()
    {
        // Arrange
        var queryParams = new NearestPropertiesQueryParameters
        {
            Latitude = 19.2837407,
            Longitude = 72.9314766
        };

        _mockPropertyService
            .Setup(s => s.GetNearestPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failure"));

        // Act
        var actionResult = await _controller.GetNearestProperties(queryParams, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(500, objectResult.StatusCode);
        var response = Assert.IsType<ApiResponse<List<NearestPropertyDto>>>(objectResult.Value);
        Assert.False(response.Success);
    }
}
