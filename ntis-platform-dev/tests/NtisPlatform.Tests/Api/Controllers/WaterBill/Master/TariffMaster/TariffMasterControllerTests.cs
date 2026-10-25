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

namespace NtisPlatform.Tests.Api.Controllers.WaterBill.Master.TariffMaster;

public class TariffMasterControllerTests
{
    private static TariffMasterController CreateController(
        out Mock<ITariffMasterService> mockService,
        out Mock<ILogger<TariffMasterController>> mockLogger)
    {
        mockService = new Mock<ITariffMasterService>();
        mockLogger = new Mock<ILogger<TariffMasterController>>();
        return new TariffMasterController(mockService.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        var controller = CreateController(out var mockService, out _);
        var queryParams = new TariffMasterQueryParameters();
        var pagedResult = new PagedResult<TariffMasterDto>(
            new List<TariffMasterDto>
            {
                new() { Id = 1, TariffCode = "TRF01", TariffName = "Residential", FinancialYear = "2025", ConnectionTypeName = "Residential", ConnectionCategoryName = "Regular", TapSizeName = "1/2\"" }
            },
            totalCount: 1,
            pageNumber: 1,
            pageSize: 10);

        mockService
            .Setup(s => s.GetAllAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await controller.GetAll(queryParams, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<TariffMasterDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("TRF01", returnedResult.Items.First().TariffCode);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult_WithDto()
    {
        var controller = CreateController(out var mockService, out _);
        var dto = new TariffMasterDto { Id = 1, TariffCode = "TRF01", TariffName = "Residential" };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<TariffMasterDto>(okResult.Value);
        Assert.Equal("TRF01", returnedDto.TariffCode);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffMasterDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ValidDto_ReturnsOkResult()
    {
        var controller = CreateController(out var mockService, out _);
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };
        var createdDto = new TariffMasterDto
        {
            Id = 1,
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYear = "2025",
            ConnectionTypeName = "Residential",
            ConnectionCategoryName = "Regular",
            TapSizeName = "1/2\"",
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        var result = await controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("TRF01", response.Items.TariffCode);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };
        var updatedDto = new TariffMasterDto
        {
            Id = 1,
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Residential Updated", response.Items.TariffName);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsResponseWithFalseSuccess()
    {
        var controller = CreateController(out var mockService, out _);
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "NONEXISTENT",
            TariffName = "None",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffMasterDto?)null);

        var result = await controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffMasterDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_ExistingId_ReturnsOkResult()
    {
        var controller = CreateController(out var mockService, out _);
        mockService
            .Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<TariffMasterDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Purge_CallsForceDelete_ReturnsOkResult()
    {
        var controller = CreateController(out _, out _);
        var mockCleanup = new Mock<IHardDeleteCleanupService>();
        var mockReferenceValidation = new Mock<IReferenceValidationService>();

        mockReferenceValidation
            .Setup(r => r.ValidateReferencesAsync<TariffMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<TariffMasterEntity, long>(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Purge(1L, mockCleanup.Object, mockReferenceValidation.Object, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<TariffMasterEntity, long>(1L, It.IsAny<CancellationToken>()), Times.Once);
    }
}
