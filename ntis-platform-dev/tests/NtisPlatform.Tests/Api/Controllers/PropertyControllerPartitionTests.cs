using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyControllerPartitionTests
{
    private readonly Mock<IPropertyService> _mockPropertyService;
    private readonly Mock<ILogger<PropertyController>> _mockLogger;
    private readonly PropertyController _controller;

    public PropertyControllerPartitionTests()
    {
        var mocks = PropertyControllerTestHelper.CreateControllerWithMocks();
        _controller = mocks.Controller;
        _mockPropertyService = mocks.PropertyService;
        _mockLogger = mocks.Logger;
    }

    #region GenerateMissingPartition Tests

    [Fact]
    public async Task GenerateMissingPartition_ReturnsOk_WhenServiceReturnsSuccess()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 89,
            MainPropertyNo = "100",
            UserId = 1,
            IsMainPropertyDataAttach = true
        };

        var expectedResponse = new ApiResponse<GenerateMissingPartitionResponseDto>
        {
            Success = true,
            Message = "GenerateMissingPartition_Success.",
            Items = new GenerateMissingPartitionResponseDto
            {
                MainPropertyNo = "100",
                MissingFoundCount = 1,
                CreatedCount = 1,
                CreatedList = new List<string> { "100-P2" },
                SkippedList = new List<string> { "100-P1", "100-P3" }
            }
        };

        _mockPropertyService
            .Setup(x => x.GenerateMissingPartition(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
        var response = Assert.IsType<ApiResponse<GenerateMissingPartitionResponseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(1, response.Items.CreatedCount);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsBadRequest_WhenServiceReturnsFailure()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 0,
            MainPropertyNo = "100",
            UserId = 1
        };

        var failureResponse = new ApiResponse<GenerateMissingPartitionResponseDto>
        {
            Success = false,
            Message = "GenerateMissingPartition_WardId_is_Invalid.",
            Items = new GenerateMissingPartitionResponseDto
            {
                MainPropertyNo = "100"
            }
        };

        _mockPropertyService
            .Setup(x => x.GenerateMissingPartition(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);
        var response = Assert.IsType<ApiResponse<GenerateMissingPartitionResponseDto>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("GenerateMissingPartition_WardId_is_Invalid.", response.Message);
    }

    [Fact]
    public async Task GenerateMissingPartition_ReturnsInternalServerError_WhenServiceThrowsException()
    {
        // Arrange
        var request = new GenerateMissingPartitionRequestDto
        {
            WardId = 89,
            MainPropertyNo = "100",
            UserId = 1
        };

        _mockPropertyService
            .Setup(x => x.GenerateMissingPartition(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connectivity failure"));

        // Act
        var result = await _controller.GenerateMissingPartition(request, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        var response = Assert.IsType<ApiResponse<GenerateMissingPartitionResponseDto>>(objectResult.Value);
        Assert.False(response.Success);
        Assert.Equal("An unexpected error occurred while generating missing partition properties.", response.Message);
    }

    #endregion

    #region CreateNewPartitionProperty Tests

    [Fact]
    public async Task CreateNewPartitionProperty_ReturnsOk_WhenServiceReturnsSuccess()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 89,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2,
            IsMainPropertyDataAttach = true,
            ModuleId = 5
        };

        var expectedResponse = new ApiResponse<CreateNewPartitionResponseDto>
        {
            Success = true,
            Message = "Property no 100 is Partition no P4 to P5 generated successfully",
            Items = new CreateNewPartitionResponseDto
            {
                MainPropertyNo = "100",
                CreatedCount = 2,
                CreatedList = new List<CreatedPartitionDetailDto>
                {
                    new() { PropertyId = 10, PropertyNo = "100", PartitionNo = "P4", UPICId = "UPIC100P4" },
                    new() { PropertyId = 11, PropertyNo = "100", PartitionNo = "P5", UPICId = "UPIC100P5" }
                }
            }
        };

        _mockPropertyService
            .Setup(x => x.CreateNewPartitionPropertysAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateNewPartitionProperty(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
        var response = Assert.IsType<ApiResponse<CreateNewPartitionResponseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(2, response.Items.CreatedCount);
        Assert.Equal(2, response.Items.CreatedList.Count);
    }

    [Fact]
    public async Task CreateNewPartitionProperty_ReturnsBadRequest_WhenServiceReturnsFailure()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 89,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 0
        };

        var failureResponse = new ApiResponse<CreateNewPartitionResponseDto>
        {
            Success = false,
            Message = "CreateNewPartition_Nopartition_must_be_greater_than_zero.",
            Items = new CreateNewPartitionResponseDto
            {
                MainPropertyNo = "100",
                CreatedCount = 0
            }
        };

        _mockPropertyService
            .Setup(x => x.CreateNewPartitionPropertysAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.CreateNewPartitionProperty(request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);
        var response = Assert.IsType<ApiResponse<CreateNewPartitionResponseDto>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("CreateNewPartition_Nopartition_must_be_greater_than_zero.", response.Message);
    }

    [Fact]
    public async Task CreateNewPartitionProperty_ReturnsInternalServerError_WhenServiceThrowsException()
    {
        // Arrange
        var request = new CreateNewPartitionRequestDto
        {
            WardId = 89,
            MainPropertyNo = "100",
            UserId = 1,
            Nopartition = 2
        };

        _mockPropertyService
            .Setup(x => x.CreateNewPartitionPropertysAsync(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected database deadlock"));

        // Act
        var result = await _controller.CreateNewPartitionProperty(request, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        var response = Assert.IsType<ApiResponse<CreateNewPartitionResponseDto>>(objectResult.Value);
        Assert.False(response.Success);
        Assert.Equal("An unexpected error occurred while creating new partition property.", response.Message);
    }

    #endregion
}
