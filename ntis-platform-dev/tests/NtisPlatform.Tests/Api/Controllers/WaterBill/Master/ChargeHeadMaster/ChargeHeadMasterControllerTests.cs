using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.WaterBill.Master;
using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterControllerTests
{
    private static ChargeHeadMasterController Create(
        out Mock<IChargeHeadMasterService> mockService,
        out Mock<IHardDeleteCleanupService> mockCleanup,
        out Mock<IReferenceValidationService> mockRefValidation,
        out Mock<ILogger<ChargeHeadMasterController>> mockLogger)
    {
        mockService = new Mock<IChargeHeadMasterService>();
        mockCleanup = new Mock<IHardDeleteCleanupService>();
        mockRefValidation = new Mock<IReferenceValidationService>();
        mockLogger = new Mock<ILogger<ChargeHeadMasterController>>();
        return new ChargeHeadMasterController(mockService.Object, mockCleanup.Object, mockRefValidation.Object, mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        var queryParams = new ChargeHeadMasterQueryParameters();
        var pagedResult = new PagedResult<ChargeHeadMasterDto>(
            new List<ChargeHeadMasterDto>
            {
                new ChargeHeadMasterDto { Id = 1, ChargeHeadCode = "CHG01", ChargeHeadName = "Connection Fee", ChargeType = "Fee" }
            },
            1, 1, 10);

        mockService
            .Setup(s => s.GetAllAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await controller.GetAll(queryParams, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsType<PagedResult<ChargeHeadMasterDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
        Assert.Equal("CHG01", returnedResult.Items.First().ChargeHeadCode);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOkResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        var dto = new ChargeHeadMasterDto { Id = 1, ChargeHeadCode = "CHG01", ChargeHeadName = "Connection Fee", ChargeType = "Fee" };

        mockService
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedDto = Assert.IsType<ChargeHeadMasterDto>(okResult.Value);
        Assert.Equal("CHG01", returnedDto.ChargeHeadCode);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFoundResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);

        mockService
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChargeHeadMasterDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ValidDto_ReturnsOkResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Connection Fee",
            ChargeType = "Fee"
        };
        var createdDto = new ChargeHeadMasterDto
        {
            Id = 1,
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Connection Fee",
            ChargeType = "Fee",
            IsActive = true
        };

        mockService
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        var result = await controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ChargeHeadMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("CHG01", response.Items.ChargeHeadCode);
    }

    [Fact]
    public async Task Update_ExistingId_ReturnsOkResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Connection Fee Updated",
            ChargeType = "Fee",
            IsActive = true
        };
        var updatedDto = new ChargeHeadMasterDto
        {
            Id = 1,
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Connection Fee Updated",
            ChargeType = "Fee",
            IsActive = true
        };

        mockService
            .Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ChargeHeadMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Connection Fee Updated", response.Items.ChargeHeadName);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsOkResultWithNullData()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Connection Fee",
            ChargeType = "Fee"
        };

        mockService
            .Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChargeHeadMasterDto?)null);

        var result = await controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ChargeHeadMasterDto>>(okResult.Value);
        Assert.False(response.Success);
        Assert.Null(response.Items);
    }

    [Fact]
    public async Task Delete_ExistingId_ReturnsOkResult()
    {
        var controller = Create(out var mockService, out _, out _, out _);
        mockService
            .Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ChargeHeadMasterDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Purge_CallsForceDelete_ReturnsOkResult()
    {
        var controller = Create(out _, out var mockCleanup, out var mockReferenceValidation, out _);

        mockReferenceValidation
            .Setup(r => r.ValidateReferencesAsync<ChargeHeadMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        mockCleanup
            .Setup(c => c.ForceHardDeleteAsync<ChargeHeadMasterEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Purge(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
        mockCleanup.Verify(c => c.ForceHardDeleteAsync<ChargeHeadMasterEntity, int>(1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
