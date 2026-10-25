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

public class ConnectionCategoryMasterControllerTests
{
    private static ConnectionCategoryMasterController CreateController(
        out Mock<IConnectionCategoryMasterService> mockService,
        out Mock<ILogger<ConnectionCategoryMasterController>> mockLogger)
    {
        mockService = new Mock<IConnectionCategoryMasterService>();
        mockLogger = new Mock<ILogger<ConnectionCategoryMasterController>>();
        return new ConnectionCategoryMasterController(mockService.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var queryParams = new ConnectionCategoryMasterQueryParameters();
        var pagedResult = new PagedResult<ConnectionCategoryMasterDto>(
            new List<ConnectionCategoryMasterDto>
            {
                new()
                {
                    Id = 1,
                    ConnectionCategoryCode = "REGULAR",
                    ConnectionCategory = "Regular Metered",
                    BillingFrequencyId = 2,
                    BillingFrequency = "Quarterly",
                    IsMetered = true,
                    BillingMethod = "Metered",
                    Description = "Standard quarterly metered billing"
                }
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
        var returnedResult = Assert.IsType<PagedResult<ConnectionCategoryMasterDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("REGULAR", returnedResult.Items.First().ConnectionCategoryCode);
        Assert.Equal("Quarterly", returnedResult.Items.First().BillingFrequency);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult_WithDto()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var dto = new ConnectionCategoryMasterDto
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            BillingFrequency = "Quarterly",
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Standard quarterly metered billing",
            IsActive = true
        };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<ConnectionCategoryMasterDto>(okResult.Value);
        Assert.Equal(1, returnedDto.Id);
        Assert.Equal("REGULAR", returnedDto.ConnectionCategoryCode);
        Assert.Equal("Quarterly", returnedDto.BillingFrequency);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionCategoryMasterDto?)null);

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
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "FLAT",
            ConnectionCategory = "Flat Rate",
            BillingFrequencyId = 2,
            IsMetered = false,
            BillingMethod = "Flat",
            Description = "Quarterly flat rate non-metered"
        };
        var createdDto = new ConnectionCategoryMasterDto
        {
            Id = 2,
            ConnectionCategoryCode = "FLAT",
            ConnectionCategory = "Flat Rate",
            BillingFrequencyId = 2,
            BillingFrequency = "Quarterly",
            IsMetered = false,
            BillingMethod = "Flat",
            Description = "Quarterly flat rate non-metered",
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionCategoryMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("FLAT", response.Items.ConnectionCategoryCode);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "SLAB",
            ConnectionCategory = "Slab Metered",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Slab",
            Description = "Quarterly slab-based tiered metered",
            IsActive = true
        };
        var updatedDto = new ConnectionCategoryMasterDto
        {
            Id = 3,
            ConnectionCategoryCode = "SLAB",
            ConnectionCategory = "Slab Metered",
            BillingFrequencyId = 2,
            BillingFrequency = "Quarterly",
            IsMetered = true,
            BillingMethod = "Slab",
            Description = "Quarterly slab-based tiered metered",
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(3, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await controller.Update(3, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionCategoryMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("SLAB", response.Items.ConnectionCategoryCode);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsResponseWithFalseSuccess()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "NONEXISTENT",
            ConnectionCategory = "None",
            BillingMethod = "Metered"
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionCategoryMasterDto?)null);

        // Act
        var result = await controller.Update(999, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ConnectionCategoryMasterDto>>(okResult.Value);
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
        var response = Assert.IsType<ApiResponse<ConnectionCategoryMasterDto>>(okResult.Value);
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
            .Setup(r => r.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<ConnectionCategoryMasterEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Purge(1, mockCleanup.Object, mockReferenceValidation.Object, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<ConnectionCategoryMasterEntity, int>(1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
