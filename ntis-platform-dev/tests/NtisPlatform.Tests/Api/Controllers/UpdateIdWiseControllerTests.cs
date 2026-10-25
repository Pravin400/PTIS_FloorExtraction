using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class UpdateIdWiseControllerTests
{
    private readonly Mock<IPropertyBulkUpdateService> _mockService;
    private readonly Mock<ILogger<UpdateIdWiseController>> _mockLogger;
    private readonly UpdateIdWiseController _controller;

    public UpdateIdWiseControllerTests()
    {
        _mockService = new Mock<IPropertyBulkUpdateService>();
        _mockLogger = new Mock<ILogger<UpdateIdWiseController>>();
        _controller = new UpdateIdWiseController(_mockService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task UpdateIdWiseDetails_Success_ReturnsOk()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1, 2 },
            OwnerName = "Test Owner",
            UpdatedBy = 5
        };

        var serviceResponse = new ApiResponse<bool>
        {
            Success = true,
            Message = "2 properties updated successfully.",
            Items = true
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceResponse);

        // Act
        var result = await _controller.UpdateIdWiseDetails(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeAssignableTo<ApiResponse<bool>>().Subject;

        apiResponse.Success.Should().BeTrue();
        apiResponse.Message.Should().Contain("2 properties updated successfully");
        apiResponse.Items.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateIdWiseDetails_NoFieldsProvided_ThrowsValidationException()
    {
        // Arrange — a DTO with no updatable fields
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 }
            // All updatable fields are null/default
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _controller.UpdateIdWiseDetails(dto, CancellationToken.None));

        ex.Message.Should().Contain("At least one field must be provided for update");
    }

    [Fact]
    public async Task UpdateIdWiseDetails_WithOwnerFieldsOnly_CallsServiceWithCorrectUpdatedBy()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test",
            UpdatedBy = 42
        };

        var serviceResponse = new ApiResponse<bool>
        {
            Success = true,
            Message = "1 properties updated successfully.",
            Items = true
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceResponse);

        // Act
        var result = await _controller.UpdateIdWiseDetails(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeAssignableTo<ApiResponse<bool>>().Subject;
        apiResponse.Success.Should().BeTrue();

        _mockService.Verify(
            s => s.UpdateIdWiseDetailsAsync(dto, 42, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateIdWiseDetails_NullUpdatedBy_PassesZeroToService()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test"
            // UpdatedBy is null
        };

        var serviceResponse = new ApiResponse<bool>
        {
            Success = true,
            Message = "1 properties updated successfully.",
            Items = true
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceResponse);

        // Act
        var result = await _controller.UpdateIdWiseDetails(dto, CancellationToken.None);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        _mockService.Verify(
            s => s.UpdateIdWiseDetailsAsync(dto, 0, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateIdWiseDetails_WithAssessmentFieldsOnly_CallsServiceSuccessfully()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1, 2, 3 },
            OwnerTypeId = 5,
            UpdatedBy = 10
        };

        var serviceResponse = new ApiResponse<bool>
        {
            Success = true,
            Message = "3 properties updated successfully.",
            Items = true
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceResponse);

        // Act
        var result = await _controller.UpdateIdWiseDetails(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeAssignableTo<ApiResponse<bool>>().Subject;
        apiResponse.Success.Should().BeTrue();
        apiResponse.Message.Should().Contain("3 properties updated successfully");
    }

    [Fact]
    public async Task UpdateIdWiseDetails_WithPhotoFieldsOnly_CallsServiceSuccessfully()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 5,
            DocumentBindingId = 10,
            UpdatedBy = 1
        };

        var serviceResponse = new ApiResponse<bool>
        {
            Success = true,
            Message = "1 properties updated successfully.",
            Items = true
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceResponse);

        // Act
        var result = await _controller.UpdateIdWiseDetails(dto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var apiResponse = okResult.Value.Should().BeAssignableTo<ApiResponse<bool>>().Subject;
        apiResponse.Success.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateIdWiseDetails_ServiceThrowsValidationException_PropagatesException()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 999 },
            OwnerName = "Test",
            UpdatedBy = 1
        };

        _mockService
            .Setup(s => s.UpdateIdWiseDetailsAsync(dto, 1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ValidationException(
                nameof(dto.PropertyIds),
                "None of the specified properties were found or are active.",
                OperationType.Update));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => _controller.UpdateIdWiseDetails(dto, CancellationToken.None));

        ex.Message.Should().Contain("None of the specified properties were found or are active");
    }
}
