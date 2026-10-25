using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class GisLayerMasterControllerTests
{
    private static GisLayerMasterController Create(out Mock<IGisLayerMasterService> service)
    {
        service = new Mock<IGisLayerMasterService>();
        var cleanupService = new Mock<IHardDeleteCleanupService>();
        var referenceValidationService = new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<GisLayerMasterController>>();
        return new GisLayerMasterController(service.Object, cleanupService.Object, referenceValidationService.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service);
        var query = new GisLayerMasterQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<GisLayerMasterDto>(new List<GisLayerMasterDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service);
        var dto = new CreateGisLayerMasterDto { LayerCode = "TAX_BOUNDARY", LayerName = "Tax Boundary Layer" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>())).ReturnsAsync(new GisLayerMasterDto { Id = 1 });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UploadGeoJson_WithNullFile_ReturnsBadRequest()
    {
        var controller = Create(out _);
        var result = await controller.UploadGeoJson(1, null!, CancellationToken.None);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task UploadGeoJson_WithValidFile_ReturnsOk()
    {
        var controller = Create(out var service);
        var content = "{\"type\":\"FeatureCollection\",\"features\":[]}";
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        var formFile = new FormFile(stream, 0, bytes.Length, "file", "test.geojson");

        service.Setup(s => s.UploadGeoJsonAsync(1, It.IsAny<Stream>(), "test.geojson", bytes.Length, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GisUploadResultDto
            {
                LayerMasterId = 1,
                LayerCode = "BOUNDARY",
                LayerName = "Boundary Layer",
                FileName = "test.geojson",
                FileSizeBytes = bytes.Length,
                FeatureCount = 0
            });

        var result = await controller.UploadGeoJson(1, formFile, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<GisUploadResultDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal("test.geojson", apiResponse.Items!.FileName);
    }

    [Fact]
    public async Task GetGeoJson_WhenFound_ReturnsContentResult()
    {
        var controller = Create(out var service);
        var expectedJson = "{\"type\":\"FeatureCollection\",\"features\":[]}";
        service.Setup(s => s.GetGeoJsonAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedJson);

        var result = await controller.GetGeoJson(1, CancellationToken.None);

        var contentResult = Assert.IsType<ContentResult>(result);
        Assert.Equal("application/json", contentResult.ContentType);
        Assert.Equal(expectedJson, contentResult.Content);
    }

    [Fact]
    public async Task GetGeoJson_WhenNotFound_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetGeoJsonAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var result = await controller.GetGeoJson(999, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
