using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers;

public class CitizenMasterControllerTests
{
    private static CitizenMasterController Create(out Mock<ICitizenMasterService> service)
    {
        service = new Mock<ICitizenMasterService>();
        var logger = new Mock<ILogger<CitizenMasterController>>();
        return new CitizenMasterController(service.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service);
        var query = new CitizenMasterQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<CitizenMasterDto>(new List<CitizenMasterDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CitizenMasterDto { Id = 1, Name = "Test Citizen", MobileNo = "9876543210" });

        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByMobileNo_ExistingMobile_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByMobileNoAsync("9876543210", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CitizenMasterDto { Id = 1, Name = "Test Citizen", MobileNo = "9876543210" });

        var result = await controller.GetByMobileNo("9876543210", CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<CitizenMasterDto>(okResult.Value);
        Assert.Equal("9876543210", dto.MobileNo);
    }

    [Fact]
    public async Task GetByMobileNo_NonExistingMobile_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByMobileNoAsync("9999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((CitizenMasterDto?)null);

        var result = await controller.GetByMobileNo("9999999999", CancellationToken.None);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service);
        var dto = new CreateCitizenMasterDto { Name = "New Citizen", MobileNo = "9876543210" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CitizenMasterDto { Id = 1, Name = "New Citizen", MobileNo = "9876543210" });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var controller = Create(out var service);
        var dto = new UpdateCitizenMasterDto { Name = "Updated Citizen", MobileNo = "9876543210" };
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CitizenMasterDto { Id = 1, Name = "Updated Citizen", MobileNo = "9876543210" });

        var result = await controller.Update(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }
}
