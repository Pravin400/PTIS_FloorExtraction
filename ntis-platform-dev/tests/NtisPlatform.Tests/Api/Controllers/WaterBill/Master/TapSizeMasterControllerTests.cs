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

public class TapSizeMasterControllerTests
{
    private static TapSizeMasterController CreateController(
        out Mock<ITapSizeMasterService> mockService,
        out Mock<ILogger<TapSizeMasterController>> mockLogger)
    {
        mockService = new Mock<ITapSizeMasterService>();
        mockLogger = new Mock<ILogger<TapSizeMasterController>>();
        return new TapSizeMasterController(mockService.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var queryParams = new TapSizeMasterQueryParameters();
        var pagedResult = new PagedResult<TapSizeMasterDto>(
            new List<TapSizeMasterDto>
            {
                new() { Id = 1, TapSizeCode = "0.5IN", TapSize = "1/2\"", NominalSizeValue = 0.500m, SizeUnit = "inch" }
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
        var returnedResult = Assert.IsType<PagedResult<TapSizeMasterDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("0.5IN", returnedResult.Items.First().TapSizeCode);
        Assert.Equal("1/2\"", returnedResult.Items.First().TapSize);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult_WithDto()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var dto = new TapSizeMasterDto
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true
        };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<TapSizeMasterDto>(okResult.Value);
        Assert.Equal(1, returnedDto.Id);
        Assert.Equal("0.5IN", returnedDto.TapSizeCode);
        Assert.Equal("1/2\"", returnedDto.TapSize);
        Assert.Equal(0.500m, returnedDto.NominalSizeValue);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterDto?)null);

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
        var createDto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.75IN",
            TapSize = "3/4\"",
            NominalSizeValue = 0.750m,
            SizeUnit = "inch"
        };
        var createdDto = new TapSizeMasterDto
        {
            Id = 2,
            TapSizeCode = "0.75IN",
            TapSize = "3/4\"",
            NominalSizeValue = 0.750m,
            SizeUnit = "inch",
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TapSizeMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("0.75IN", response.Items.TapSizeCode);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "1IN",
            TapSize = "1\"",
            NominalSizeValue = 1.000m,
            SizeUnit = "inch",
            IsActive = true
        };
        var updatedDto = new TapSizeMasterDto
        {
            Id = 3,
            TapSizeCode = "1IN",
            TapSize = "1\"",
            NominalSizeValue = 1.000m,
            SizeUnit = "inch",
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(3, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await controller.Update(3, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TapSizeMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("1IN", response.Items.TapSizeCode);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsResponseWithFalseSuccess()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "NONEXISTENT",
            TapSize = "None"
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterDto?)null);

        // Act
        var result = await controller.Update(999, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TapSizeMasterDto>>(okResult.Value);
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
        var response = Assert.IsType<ApiResponse<TapSizeMasterDto>>(okResult.Value);
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
            .Setup(r => r.ValidateReferencesAsync<TapSizeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<TapSizeMasterEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Purge(1, mockCleanup.Object, mockReferenceValidation.Object, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<TapSizeMasterEntity, int>(1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
