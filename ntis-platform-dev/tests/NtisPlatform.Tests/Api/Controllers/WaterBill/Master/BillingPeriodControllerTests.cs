using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.WaterBill.Master;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.WaterBill.Master;

public class BillingPeriodControllerTests
{
    private static BillingPeriodController Create(out Mock<IBillingPeriodService> service, out Mock<IHardDeleteCleanupService> cleanup, out Mock<IReferenceValidationService> referenceValidation)
    {
        service = new Mock<IBillingPeriodService>();
        cleanup = new Mock<IHardDeleteCleanupService>();
        referenceValidation = new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<BillingPeriodController>>();

        return new BillingPeriodController(service.Object, cleanup.Object, referenceValidation.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var query = new BillingPeriodQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<BillingPeriodDto>(new List<BillingPeriodDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BillingPeriodDto { Id = 1, BillingPeriodCode = "BP2026-01" });

        var result = await controller.GetById(1, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<BillingPeriodDto>(okResult.Value);
        Assert.Equal(1, dto.Id);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingPeriodDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new CreateBillingPeriodDto();
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BillingPeriodDto { Id = 1, BillingPeriodCode = "BP2026-01" });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new UpdateBillingPeriodDto();
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BillingPeriodDto { Id = 1, BillingPeriodCode = "BP2026-01" });

        var result = await controller.Update(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }
}
