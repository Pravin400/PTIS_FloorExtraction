using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers;

public class GrievanceApplicationControllerTests
{
    private static GrievanceApplicationController Create(out Mock<IGrievanceApplicationService> service)
    {
        service = new Mock<IGrievanceApplicationService>();
        var logger = new Mock<ILogger<GrievanceApplicationController>>();
        return new GrievanceApplicationController(service.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service);
        var query = new GrievanceApplicationQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceApplicationDto>(new List<GrievanceApplicationDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceApplicationDto { Id = 1, GrievanceNo = "GRV-2026-000001", CitizenId = 1 });

        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByGrievanceNo_ExistingNumber_ReturnsOk()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByGrievanceNoAsync("GRV-2026-000001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceApplicationDto { Id = 1, GrievanceNo = "GRV-2026-000001", CitizenId = 1 });

        var result = await controller.GetByGrievanceNo("GRV-2026-000001", CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<GrievanceApplicationDto>(okResult.Value);
        Assert.Equal("GRV-2026-000001", dto.GrievanceNo);
    }

    [Fact]
    public async Task GetByGrievanceNo_NonExistingNumber_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetByGrievanceNoAsync("NON_EXISTING", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceApplicationDto?)null);

        var result = await controller.GetByGrievanceNo("NON_EXISTING", CancellationToken.None);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetByCitizenId_ReturnsOk()
    {
        var controller = Create(out var service);
        var query = new GrievanceApplicationQueryParameters();
        service.Setup(s => s.GetByCitizenIdAsync(1, query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceApplicationDto>(new List<GrievanceApplicationDto>(), 0, 1, 10));

        var result = await controller.GetByCitizenId(1, query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByCitizenId_AuthenticatedAsSameCitizen_ReturnsOk()
    {
        var controller = Create(out var service);
        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Citizen")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = claimsPrincipal }
        };

        var query = new GrievanceApplicationQueryParameters();
        service.Setup(s => s.GetByCitizenIdAsync(1, query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GrievanceApplicationDto>(new List<GrievanceApplicationDto>(), 0, 1, 10));

        var result = await controller.GetByCitizenId(1, query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByCitizenId_AuthenticatedAsDifferentCitizen_ReturnsForbid()
    {
        var controller = Create(out var service);
        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "2"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Citizen")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = claimsPrincipal }
        };

        var query = new GrievanceApplicationQueryParameters();
        var result = await controller.GetByCitizenId(1, query, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Create_ValidDto_ReturnsOkResult()
    {
        var controller = Create(out var service);
        var createDto = new CreateGrievanceApplicationDto
        {
            CitizenId = 1,
            GrievanceDepartmentId = 10,
            GrievanceTypeId = 100
        };

        service.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrievanceApplicationDto { Id = 1, GrievanceNo = "GRV-2026-000001" });

        var result = await controller.Create(createDto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ExistingId_ReturnsOkResult()
    {
        var controller = Create(out var service);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetPublicDetailsByGrievanceNo_ExistingNumber_ReturnsOkWithPhotos()
    {
        var controller = Create(out var service);
        var expectedDto = new GrievancePublicDetailsDto
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            CitizenName = "John Doe",
            DepartmentName = "Public Works",
            Photos = new List<GrievancePublicPhotoDto>
            {
                new() { Id = 10, GrievanceApplicationId = 1, ViewPhotoUrl = "/api/grievance-photos/10/view" }
            }
        };

        service.Setup(s => s.GetPublicDetailsByGrievanceNoAsync("GRV-2026-000001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var result = await controller.GetPublicDetailsByGrievanceNo("GRV-2026-000001", CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<GrievancePublicDetailsDto>(okResult.Value);
        Assert.Equal("GRV-2026-000001", dto.GrievanceNo);
        Assert.Single(dto.Photos);
        Assert.Equal("/api/grievance-photos/10/view", dto.Photos[0].ViewPhotoUrl);
    }

    [Fact]
    public async Task GetPublicDetailsByGrievanceNo_NotFound_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetPublicDetailsByGrievanceNoAsync("UNKNOWN", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievancePublicDetailsDto?)null);

        var result = await controller.GetPublicDetailsByGrievanceNo("UNKNOWN", CancellationToken.None);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetPublicDetailsById_ExistingId_ReturnsOk()
    {
        var controller = Create(out var service);
        var expectedDto = new GrievancePublicDetailsDto
        {
            Id = 1,
            GrievanceNo = "GRV-2026-000001",
            DepartmentName = "Public Works"
        };

        service.Setup(s => s.GetPublicDetailsByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var result = await controller.GetPublicDetailsById(1, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<GrievancePublicDetailsDto>(okResult.Value);
        Assert.Equal(1, dto.Id);
    }

    [Fact]
    public async Task GetAllPublicDetails_ReturnsOkWithList()
    {
        var controller = Create(out var service);
        var expectedList = new List<GrievancePublicDetailsDto>
        {
            new()
            {
                Id = 1,
                GrievanceNo = "GRV-2026-000001",
                Photos = new List<GrievancePublicPhotoDto>
                {
                    new() { Id = 101, ViewPhotoUrl = "/api/grievance-photos/101/view" }
                }
            },
            new()
            {
                Id = 2,
                GrievanceNo = "GRV-2026-000002",
                Photos = new List<GrievancePublicPhotoDto>()
            }
        };

        service.Setup(s => s.GetAllPublicDetailsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedList);

        var result = await controller.GetAllPublicDetails(CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsType<List<GrievancePublicDetailsDto>>(okResult.Value);
        Assert.Equal(2, list.Count);
        Assert.Equal("/api/grievance-photos/101/view", list[0].Photos[0].ViewPhotoUrl);
    }
}
