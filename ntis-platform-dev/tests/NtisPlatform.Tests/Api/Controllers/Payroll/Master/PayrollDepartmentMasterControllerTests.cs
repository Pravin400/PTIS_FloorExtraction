using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Payroll.Master;
using NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Payroll.Master;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Payroll.Master;

public class PayrollDepartmentMasterControllerTests
{
    private static PayrollDepartmentMasterController Create(
        out Mock<IPayrollDepartmentMasterService> service,
        Mock<IHardDeleteCleanupService>? cleanupService = null,
        Mock<IReferenceValidationService>? referenceValidationService = null)
    {
        service = new Mock<IPayrollDepartmentMasterService>();
        var cleanup = cleanupService ?? new Mock<IHardDeleteCleanupService>();
        var refVal = referenceValidationService ?? new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<PayrollDepartmentMasterController>>();
        return new PayrollDepartmentMasterController(service.Object, cleanup.Object, refVal.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service);
        var query = new PayrollDepartmentMasterQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<PayrollDepartmentMasterDto>(new List<PayrollDepartmentMasterDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PayrollDepartmentMasterDto { Id = 1, DepartmentCode = "ADM", DepartmentName = "Administration" });

        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service);
        var dto = new CreatePayrollDepartmentMasterDto { DepartmentCode = "ADM", DepartmentName = "Administration", DepartmentNameMarathi = "प्रशासन" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PayrollDepartmentMasterDto { Id = 1, DepartmentCode = "ADM", DepartmentName = "Administration" });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var controller = Create(out var service);
        var dto = new UpdatePayrollDepartmentMasterDto { DepartmentCode = "ADM", DepartmentName = "Administration Updated", DepartmentNameMarathi = "प्रशासन" };
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PayrollDepartmentMasterDto { Id = 1, DepartmentCode = "ADM", DepartmentName = "Administration Updated" });

        var result = await controller.Update(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Purge_WithValidId_ReturnsOk()
    {
        var cleanupMock = new Mock<IHardDeleteCleanupService>();
        cleanupMock.Setup(s => s.ForceHardDeleteAsync<PayrollDepartmentMasterEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = Create(out _, cleanupMock);

        var result = await controller.Purge(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Purge_WithInvalidId_ReturnsOk()
    {
        var cleanupMock = new Mock<IHardDeleteCleanupService>();
        cleanupMock.Setup(s => s.ForceHardDeleteAsync<PayrollDepartmentMasterEntity, int>(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var controller = Create(out _, cleanupMock);

        var result = await controller.Purge(999, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void PurgeEndpoint_HasAuthorizeAttribute()
    {
        var purgeMethod = typeof(PayrollDepartmentMasterController).GetMethod("Purge");
        Assert.NotNull(purgeMethod);
        var authAttr = purgeMethod.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
    }

    [Fact]
    public void PurgeEndpoint_HasHttpDelete_WithIdPurgeRoute()
    {
        var purgeMethod = typeof(PayrollDepartmentMasterController).GetMethod("Purge");
        Assert.NotNull(purgeMethod);
        var deleteAttr = purgeMethod.GetCustomAttribute<HttpDeleteAttribute>();
        Assert.NotNull(deleteAttr);
        Assert.Equal("{id}/purge", deleteAttr.Template);
    }
}
