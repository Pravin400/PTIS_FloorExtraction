using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyMediaControllerTests
{
    private readonly Mock<IPropertyMediaDashboardService> _dashboardServiceMock = new();
    private readonly Mock<IPropertyMediaExportService> _exportServiceMock = new();
    private readonly Mock<IPropertyMediaUploadService> _uploadServiceMock = new();
    private readonly Mock<IPropertyMediaOperationsService> _operationsServiceMock = new();
    private readonly Mock<IPropertyMediaDownloadService> _downloadServiceMock = new();
    private readonly Mock<IWebHostEnvironment> _environmentMock = new();

    private PropertyMediaController CreateController(int userId = 1, bool isDevelopment = true)
    {
        _environmentMock.Setup(e => e.EnvironmentName).Returns(isDevelopment ? "Development" : "Production");

        var controller = new PropertyMediaController(
            _dashboardServiceMock.Object,
            _exportServiceMock.Object,
            _uploadServiceMock.Object,
            _operationsServiceMock.Object,
            _downloadServiceMock.Object);

        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.Role, "ADMIN")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    [Fact]
    public async Task PreviewServerImport_ReturnsOk_WithMatchedCount_WhenInDevelopment()
    {
        // Arrange
        var controller = CreateController(isDevelopment: true);
        var expectedResult = new ServerImportPreviewResultDto
        {
            TotalCount = 10,
            TotalMatched = 4,
            TotalUnmatched = 6,
            Page = 1,
            PageSize = 10,
            Items = new List<ServerImportImageDto>
            {
                new() { FileName = "DIMAJOR1-A-1-R6.WMF", Status = "Matched", IsMatched = true },
                new() { FileName = "MUMAJOR2-28-A15-A.jpg", Status = "Matched", IsMatched = true }
            }
        };

        _uploadServiceMock.Setup(s => s.GetServerImportImagesAsync(13, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await controller.PreviewServerImport(photoTypeId: 13, page: 1, pageSize: 10, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ServerImportPreviewResultDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(10, response.Items.TotalCount);
        Assert.Equal(4, response.Items.TotalMatched);
    }

    [Fact]
    public async Task ServerBulkUpload_ReturnsOk_WhenJobQueuedSuccessfully()
    {
        // Arrange
        var controller = CreateController(isDevelopment: true);
        var request = new ExecuteMediaJobRequestDto { PhotoTypeId = 13, Remarks = "Bulk upload plans" };
        var expectedResult = new ExecuteMediaJobResponseDto
        {
            JobId = 34,
            JobCode = "PMJ-IMP-20261001-0034",
            RecordsSelected = 4,
            Status = "Pending"
        };

        _operationsServiceMock.Setup(s => s.BulkUploadAsync(
                It.Is<ExecuteMediaJobRequestDto>(r => r.PhotoTypeId == 13),
                It.IsAny<OperationContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await controller.ServerBulkUpload(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ExecuteMediaJobResponseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(34, response.Items.JobId);
        Assert.Equal("Pending", response.Items.Status);
    }

    [Fact]
    public async Task PreviewLocalImport_ReturnsBadRequest_WhenNoFilesSelected()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.PreviewLocalImport(
            photoTypeId: 1,
            remarks: null,
            files: new List<IFormFile>(),
            CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Contains("No file was selected", response.Message);
    }

    [Fact]
    public async Task PreviewLocalImport_ReturnsOk_WithPreviewResults()
    {
        // Arrange
        var controller = CreateController();
        var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var file = new FormFile(stream, 0, 3, "files", "MUMAJOR2-2-A1-A.jpg");
        var files = new List<IFormFile> { file };

        var expectedResult = new PropertyMediaBrowsePreviewResultDto
        {
            PreviewId = "session-123",
            TotalCount = 1,
            TotalMatched = 1,
            TotalUnmatched = 0,
            Items = new List<ServerImportImageDto>
            {
                new() { FileName = "MUMAJOR2-2-A1-A.jpg", Status = "Matched", IsMatched = true }
            }
        };

        _operationsServiceMock.Setup(s => s.PreviewBrowsedFilesAsync(
                files, 1, "test upload", It.IsAny<OperationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await controller.PreviewLocalImport(
            photoTypeId: 1,
            remarks: "test upload",
            files: files,
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PropertyMediaBrowsePreviewResultDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(1, response.Items.TotalMatched);
        Assert.Equal("session-123", response.Items.PreviewId);
    }

    [Fact]
    public async Task ExecuteLocalBulkUpload_ReturnsBadRequest_WhenPreviewIdMissing()
    {
        // Arrange
        var controller = CreateController();
        var request = new ExecuteBrowseMediaJobRequestDto { PreviewId = null, JobId = null };

        // Act
        var result = await controller.ExecuteLocalBulkUpload(request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Contains("PreviewId is required", response.Message);
    }

    [Fact]
    public async Task ExecuteLocalBulkUpload_ReturnsOk_WhenJobQueued()
    {
        // Arrange
        var controller = CreateController();
        var request = new ExecuteBrowseMediaJobRequestDto { PreviewId = "session-123" };
        var expectedResult = new ExecuteMediaJobResponseDto
        {
            JobId = 35,
            JobCode = "PMJ-BRW-20261001-0035",
            RecordsSelected = 3,
            Status = "Pending"
        };

        _operationsServiceMock.Setup(s => s.ExecuteBrowsedUploadAsync(
                "session-123", It.IsAny<OperationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await controller.ExecuteLocalBulkUpload(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ExecuteMediaJobResponseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(35, response.Items.JobId);
        Assert.Equal("PMJ-BRW-20261001-0035", response.Items.JobCode);
    }

}
