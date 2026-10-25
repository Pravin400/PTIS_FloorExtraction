using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.WaterBill.Master;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.WaterBill.Master.GeographyUnit;

public class GeographyUnitControllerTests
{
    private static GeographyUnitController Create(out Mock<IGeographyUnitService> service, out Mock<IHardDeleteCleanupService> cleanup, out Mock<IReferenceValidationService> referenceValidation)
    {
        service = new Mock<IGeographyUnitService>();
        cleanup = new Mock<IHardDeleteCleanupService>();
        referenceValidation = new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<GeographyUnitController>>();

        return new GeographyUnitController(service.Object, cleanup.Object, referenceValidation.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var query = new GeographyUnitQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GeographyUnitDto>(new List<GeographyUnitDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitDto { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" });

        var result = await controller.GetById(1, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<GeographyUnitDto>(okResult.Value);
        Assert.Equal(1, dto.Id);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyUnitDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitDto { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitDto { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" });

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

    [Fact]
    public async Task GetParentCandidates_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var candidates = new List<GeographyUnitLookupDto>
        {
            new() { Id = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" }
        };
        service.Setup(s => s.GetParentCandidatesAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(candidates);

        var result = await controller.GetParentCandidates(2, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(candidates, okResult.Value);
    }

    [Fact]
    public async Task GetHierarchyTree_NoRootId_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var tree = new List<GeographyUnitTreeNodeDto>
        {
            new() { Id = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" }
        };
        service.Setup(s => s.GetHierarchyTreeAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tree);

        var result = await controller.GetHierarchyTree(null, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(tree, okResult.Value);
    }

    [Fact]
    public async Task GetHierarchyTree_WithRootId_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var tree = new List<GeographyUnitTreeNodeDto>
        {
            new() { Id = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" }
        };
        service.Setup(s => s.GetHierarchyTreeAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tree);

        var result = await controller.GetHierarchyTree(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(tree, okResult.Value);
    }
}
