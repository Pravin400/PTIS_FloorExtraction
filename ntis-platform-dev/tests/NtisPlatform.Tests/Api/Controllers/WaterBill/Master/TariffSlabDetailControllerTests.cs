using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master.WaterBill;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master.WaterBill;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class TariffSlabDetailControllerTests
{
    private static TariffSlabDetailController CreateController(
        out Mock<ITariffSlabDetailService> mockService,
        out Mock<ILogger<TariffSlabDetailController>> mockLogger)
    {
        mockService = new Mock<ITariffSlabDetailService>();
        mockLogger = new Mock<ILogger<TariffSlabDetailController>>();
        return new TariffSlabDetailController(mockService.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var queryParams = new TariffSlabDetailQueryParameters();
        var pagedResult = new PagedResult<TariffSlabDetailDto>(
            new List<TariffSlabDetailDto>
            {
                new()
                {
                    Id = 1,
                    TariffId = 1,
                    TariffName = "Test Tariff",
                    GeographyUnitId = 2,
                    GeographyUnitName = "Test Geo Unit",
                    FromUnit = 0.0m,
                    ToUnit = 100.0m,
                    UnitRate = 15.5m,
                    FixedCharge = 50.0m,
                    MinimumCharge = 20.0m,
                    FormulaCode = "FORMULA_1",
                    SortOrder = 1,
                    IsActive = true
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
        var returnedResult = Assert.IsType<PagedResult<TariffSlabDetailDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("Test Tariff", returnedResult.Items.First().TariffName);
        Assert.Equal(15.5m, returnedResult.Items.First().UnitRate);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult_WithDto()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var dto = new TariffSlabDetailDto
        {
            Id = 1,
            TariffId = 1,
            TariffName = "Test Tariff",
            GeographyUnitId = 2,
            GeographyUnitName = "Test Geo Unit",
            FromUnit = 0.0m,
            ToUnit = 100.0m,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true
        };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<TariffSlabDetailDto>(okResult.Value);
        Assert.Equal(1, returnedDto.Id);
        Assert.Equal("Test Tariff", returnedDto.TariffName);
        Assert.Equal(15.5m, returnedDto.UnitRate);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffSlabDetailDto?)null);

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
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 100.0m,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true
        };
        var createdDto = new TariffSlabDetailDto
        {
            Id = 2,
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 100.0m,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        // Act
        var result = await controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffSlabDetailDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(15.5m, response.Items.UnitRate);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 150.0m,
            UnitRate = 20.0m,
            FixedCharge = 60.0m,
            MinimumCharge = 25.0m,
            FormulaCode = "FORMULA_2",
            SortOrder = 2,
            IsActive = true
        };
        var updatedDto = new TariffSlabDetailDto
        {
            Id = 3,
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 150.0m,
            UnitRate = 20.0m,
            FixedCharge = 60.0m,
            MinimumCharge = 25.0m,
            FormulaCode = "FORMULA_2",
            SortOrder = 2,
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(3, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await controller.Update(3, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffSlabDetailDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(20.0m, response.Items.UnitRate);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsResponseWithFalseSuccess()
    {
        // Arrange
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 999
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffSlabDetailDto?)null);

        // Act
        var result = await controller.Update(999, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffSlabDetailDto>>(okResult.Value);
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
        var response = Assert.IsType<ApiResponse<TariffSlabDetailDto>>(okResult.Value);
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
            .Setup(r => r.ValidateReferencesAsync<TariffSlabDetailEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<TariffSlabDetailEntity, long>(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await controller.Purge(1L, mockCleanup.Object, mockReferenceValidation.Object, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<TariffSlabDetailEntity, long>(1L, It.IsAny<CancellationToken>()), Times.Once);
    }
}
