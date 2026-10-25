using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master.WaterBill;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master.WaterBill;

using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class ConnectionTypeMasterControllerTests
{
    private static ConnectionTypeMasterController CreateController(
        out Mock<IConnectionTypeMasterService> mockService,
        out Mock<ILogger<ConnectionTypeMasterController>> mockLogger)
    {
        mockService = new Mock<IConnectionTypeMasterService>();
        mockLogger = new Mock<ILogger<ConnectionTypeMasterController>>();
        return new ConnectionTypeMasterController(mockService.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var queryParams = new ConnectionTypeMasterQueryParameters();
        var pagedResult = new PagedResult<ConnectionTypeMasterDto>(
            new List<ConnectionTypeMasterDto>
            {
                new() { Id = 1, ConnectionTypeCode = "RES", ConnectionType = "Residential", Description = "Residential domestic" }
            },
            totalCount: 1,
            pageNumber: 1,
            pageSize: 10);

        mockService
            .Setup(s => s.GetAllAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await controller.GetAll(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<ConnectionTypeMasterDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("RES", returnedResult.Items.First().ConnectionTypeCode);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult_WithDto()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var dto = new ConnectionTypeMasterDto
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Domestic connection",
            IsActive = true
        };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<ConnectionTypeMasterDto>(okResult.Value);
        Assert.Equal(1, returnedDto.Id);
        Assert.Equal("RES", returnedDto.ConnectionTypeCode);
        Assert.Equal("Residential", returnedDto.ConnectionType);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionTypeMasterDto?)null);

        // Act
        var result = await controller.GetById(999, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ValidDto_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var createDto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial",
            Description = "Commercial enterprise"
        };
        var createdDto = new ConnectionTypeMasterDto
        {
            Id = 2,
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial",
            Description = "Commercial enterprise",
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionTypeMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("COM", response.Items.ConnectionTypeCode);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "IND",
            ConnectionType = "Industrial",
            Description = "Industrial manufacturing",
            IsActive = true
        };
        var updatedDto = new ConnectionTypeMasterDto
        {
            Id = 3,
            ConnectionTypeCode = "IND",
            ConnectionType = "Industrial",
            Description = "Industrial manufacturing",
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(3, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await controller.Update(3, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionTypeMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("IND", response.Items.ConnectionTypeCode);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsResponseWithFalseSuccess()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "NONEXISTENT",
            ConnectionType = "None"
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionTypeMasterDto?)null);

        // Act
        var result = await controller.Update(999, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionTypeMasterDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Delete(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionTypeMasterDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Purge_CallsForceDelete_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out _, out _);
        var mockCleanup = new Mock<IHardDeleteCleanupService>();
        var mockReferenceValidation = new Mock<IReferenceValidationService>();

        mockReferenceValidation
            .Setup(r => r.ValidateReferencesAsync<ConnectionTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<ConnectionTypeMasterEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Purge(1, mockCleanup.Object, mockReferenceValidation.Object, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<ConnectionTypeMasterEntity, int>(1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
