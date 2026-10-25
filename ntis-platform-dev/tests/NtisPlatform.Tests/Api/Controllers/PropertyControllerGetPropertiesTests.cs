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

public class PropertyControllerGetPropertiesTests
{
    private readonly Mock<IPropertyService> _mockPropertyService;
    private readonly Mock<ILogger<PropertyController>> _mockLogger;
    private readonly PropertyController _controller;

    public PropertyControllerGetPropertiesTests()
    {
        _mockPropertyService = new Mock<IPropertyService>();
        _mockLogger = new Mock<ILogger<PropertyController>>();
        _controller = PropertyControllerTestHelper.CreateController(_mockPropertyService, _mockLogger);
    }

    [Fact]
    public async Task GetProperties_WithValidParameters_ReturnsOk()
    {
        // Arrange
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "1",
            FromPropertyNo = "1",
            ToPropertyNo = "10",
            UserId = 5,
            Flag = "ALL",
            PageNumber = 1,
            PageSize = 10,
            SearchText = "John"
        };

        var items = new List<GetPropertiesItemDto>
        {
            new()
            {
                PropertyId = 1,
                WardId = 1,
                WardNo = "1",
                PropertyNo = "1",
                OwnerName = "John Doe",
                MobileNo = "9876543210",
                IsVisited = true,
                LatestVisit = new PropertyLatestVisitDto
                {
                    VisitId = 10,
                    PropertyWorkflowDetailsId = 20,
                    Status = "Visited",
                    InternalSurveyVerified = true,
                    Latitude = 19.123m,
                    Longitude = 72.123m,
                    VisitedByUserId = 5,
                    VisitedByUserName = "surveyor1",
                    VisitedByFullName = "Surveyor User"
                },
                Visits = new List<PropertyLatestVisitDto>
                {
                    new()
                    {
                        VisitId = 10,
                        PropertyWorkflowDetailsId = 20,
                        Status = "Visited",
                        WorkflowStageId = 2,
                        WorkflowStageName = "InternalSurvey",
                        VisitedByFullName = "Surveyor User"
                    },
                    new()
                    {
                        VisitId = 5,
                        PropertyWorkflowDetailsId = 15,
                        Status = "Completed",
                        WorkflowStageId = 1,
                        WorkflowStageName = "GeoSequencing",
                        VisitedByFullName = "Admin User"
                    }
                },
                Photo = new PropertyPhotoSummaryDto
                {
                    PropertyPhotoId = 100,
                    PhotoTypeId = 1,
                    DocumentId = 200,
                    DocumentGuid = Guid.NewGuid(),
                    PhotoUrl = "/api/documents/some-guid/view"
                }
            }
        };
        var pagedResult = new PagedResult<GetPropertiesItemDto>(items, 1, 1, 10);

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Records fetched successfully", response.Message);
        Assert.NotNull(response.Items);
        Assert.Single(response.Items!.Items);
        var item = response.Items.Items.First();
        Assert.Equal(1, item.PropertyId);
        Assert.Equal("9876543210", item.MobileNo);
        Assert.True(item.IsVisited);
        Assert.NotNull(item.LatestVisit);
        Assert.Equal("Visited", item.LatestVisit!.Status);
        Assert.Equal(10, item.LatestVisit!.VisitId);
        Assert.Equal(2, item.Visits.Count);
        Assert.NotNull(item.Photo);
        Assert.Equal(100, item.Photo!.PropertyPhotoId);
        Assert.Equal(1, response.Items.TotalCount);
        Assert.Equal(1, response.TotalCount);
    }

    [Fact]
    public async Task GetProperties_WithoutFromAndToPropertyNo_ReturnsOk()
    {
        // Arrange
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "MM5",
            UserId = 1,
            Flag = "ALL"
        };

        var items = new List<GetPropertiesItemDto>
        {
            new() { PropertyId = 1, WardId = 1, WardNo = "MM5", PropertyNo = "346", OwnerName = "Owner 1" }
        };
        var pagedResult = new PagedResult<GetPropertiesItemDto>(items, 1, 1, 10);

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Records fetched successfully", response.Message);
        Assert.NotNull(response.Items);
        Assert.Single(response.Items!.Items);
    }

    [Fact]
    public async Task GetProperties_WithNullParameters_ReturnsBadRequest()
    {
        var result = await _controller.GetProperties(null!, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("Query parameters are required", response.Message);
    }

    [Theory]
    [InlineData("", "1", "10", 1, "ALL", "wardNo is required")]
    [InlineData("1", "1", "10", 0, "ALL", "userId is required and must be greater than 0")]
    [InlineData("1", "1", "10", 1, "", "flag is required")]
    public async Task GetProperties_WithInvalidParameters_ReturnsBadRequest(
        string wardNo,
        string fromPropertyNo,
        string toPropertyNo,
        int userId,
        string flag,
        string expectedMessage)
    {
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = wardNo,
            FromPropertyNo = fromPropertyNo,
            ToPropertyNo = toPropertyNo,
            UserId = userId,
            Flag = flag
        };

        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal(expectedMessage, response.Message);
    }

    [Fact]
    public async Task GetProperties_PassesSearchTextAndPaginationToService()
    {
        // Arrange
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "2",
            UserId = 10,
            Flag = "NEW",
            PageNumber = 3,
            PageSize = 25,
            SearchText = "Test Search"
        };

        var items = new List<GetPropertiesItemDto>
        {
            new() { PropertyId = 10, WardId = 2, WardNo = "2", PropertyNo = "50", OwnerName = "Test Search Owner" }
        };
        var pagedResult = new PagedResult<GetPropertiesItemDto>(items, 50, 3, 25);

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(
                It.Is<GetPropertiesQueryParameters>(p =>
                    p.WardNo == "2" &&
                    p.UserId == 10 &&
                    p.Flag == "NEW" &&
                    p.PageNumber == 3 &&
                    p.PageSize == 25 &&
                    p.SearchText == "Test Search"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(3, response.Items!.PageNumber);
        Assert.Equal(25, response.Items.PageSize);
        Assert.Equal(50, response.Items.TotalCount);
        Assert.Equal(50, response.TotalCount);
        _mockPropertyService.Verify(s => s.GetPropertiesAsync(
            It.Is<GetPropertiesQueryParameters>(p => p.SearchText == "Test Search" && p.PageNumber == 3 && p.PageSize == 25),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProperties_NotVisitedProperty_ReturnsIsVisitedFalseAndNullVisit()
    {
        // Arrange
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "1",
            UserId = 1,
            Flag = "ALL"
        };

        var items = new List<GetPropertiesItemDto>
        {
            new()
            {
                PropertyId = 101,
                WardId = 1,
                WardNo = "1",
                PropertyNo = "101",
                IsVisited = false,
                LatestVisit = null,
                Photo = new PropertyPhotoSummaryDto
                {
                    PropertyPhotoId = 50,
                    PhotoTypeId = 2,
                    PhotoUrl = "/api/documents/guid-123/view"
                }
            }
        };
        var pagedResult = new PagedResult<GetPropertiesItemDto>(items, 1, 1, 10);

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(okResult.Value);
        Assert.True(response.Success);
        var item = response.Items!.Items.First();
        Assert.False(item.IsVisited);
        Assert.Null(item.LatestVisit);
        Assert.Empty(item.Visits);
        Assert.NotNull(item.Photo);
    }

    [Fact]
    public async Task GetProperties_VisitedWithInternalSurveyUnverified_ReturnsCorrectStatus()
    {
        // Arrange
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "1",
            UserId = 1,
            Flag = "ALL"
        };

        var items = new List<GetPropertiesItemDto>
        {
            new()
            {
                PropertyId = 102,
                WardId = 1,
                WardNo = "1",
                PropertyNo = "102",
                IsVisited = true,
                LatestVisit = new PropertyLatestVisitDto
                {
                    VisitId = 5,
                    Status = "Visited",
                    InternalSurveyVerified = false,
                    WorkflowStageId = 2,
                    WorkflowStageName = "InternalSurvey"
                }
            }
        };
        var pagedResult = new PagedResult<GetPropertiesItemDto>(items, 1, 1, 10);

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(okResult.Value);
        Assert.True(response.Success);
        var item = response.Items!.Items.First();
        Assert.True(item.IsVisited);
        Assert.NotNull(item.LatestVisit);
        Assert.Equal("Visited", item.LatestVisit!.Status);
        Assert.False(item.LatestVisit.InternalSurveyVerified);
    }

    [Fact]
    public async Task GetProperties_WhenValidationExceptionThrown_ReturnsBadRequest()
    {
        var queryParams = new GetPropertiesQueryParameters
        {
            WardNo = "1",
            FromPropertyNo = "1",
            ToPropertyNo = "10",
            UserId = 1,
            Flag = "INVALID"
        };

        _mockPropertyService
            .Setup(s => s.GetPropertiesAsync(queryParams, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new NtisPlatform.Application.Exceptions.ValidationException("Flag", "Flag must be one of: New, Old, All.", NtisPlatform.Application.Enums.OperationType.Create));

        var result = await _controller.GetProperties(queryParams, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PagedResult<GetPropertiesItemDto>>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("Validation failed for Flag: Flag must be one of: New, Old, All.", response.Message);
    }
}
