using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Section129;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Application.Models;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

/// <summary>
/// Unit tests for Section 129A endpoints in PropertyController.Section129A.cs
/// </summary>
public class PropertyControllerSection129ATests
{
    private readonly Mock<IPropertyService> _mockPropertyService;
    private readonly Mock<ISection129Service> _mockSection129Service;
    private readonly Mock<ILogger<PropertyController>> _mockLogger;
    private readonly PropertyController _controller;

    public PropertyControllerSection129ATests()
    {
        _mockPropertyService = new Mock<IPropertyService>();
        _mockSection129Service = new Mock<ISection129Service>();
        _mockLogger = new Mock<ILogger<PropertyController>>();

        _controller = PropertyControllerTestHelper.CreateController(
            _mockPropertyService,
            _mockLogger,
            section129Service: _mockSection129Service);
    }

    [Fact]
    public async Task SearchSection129AByOldGpNo_WhenFound_ReturnsOkWithApiResponse()
    {
        // Arrange
        const string oldGpNo = "GP-123";
        var expectedDto = new Section129ScheduleDto
        {
            PropertyId = 42,
            Upic = "UPIC-001",
            OldGpNo = oldGpNo
        };

        _mockSection129Service
            .Setup(s => s.SearchByOldGpNoAsync(oldGpNo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoSearchResultDto.Found(expectedDto));

        // Act
        var result = await _controller.SearchSection129AByOldGpNo(oldGpNo, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(okResult.Value);
        Assert.True(envelope.Success);
        Assert.Equal("Record fetched successfully", envelope.Message);
        Assert.NotNull(envelope.Items);
        Assert.Equal(42, envelope.Items.PropertyId);
    }

    [Fact]
    public async Task SearchSection129AByOldGpNo_WhenNotFound_ReturnsNotFoundWithApiResponse()
    {
        // Arrange
        const string oldGpNo = "NON-EXISTENT";
        _mockSection129Service
            .Setup(s => s.SearchByOldGpNoAsync(oldGpNo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoSearchResultDto.NotFound);

        // Act
        var result = await _controller.SearchSection129AByOldGpNo(oldGpNo, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Contains(oldGpNo, envelope.Message);
    }

    [Fact]
    public async Task SearchSection129AByOldGpNo_WhenAmbiguous_ReturnsConflictWithApiResponse()
    {
        // Arrange
        const string oldGpNo = "AMBIGUOUS-NO";
        _mockSection129Service
            .Setup(s => s.SearchByOldGpNoAsync(oldGpNo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoSearchResultDto.Ambiguous);

        // Act
        var result = await _controller.SearchSection129AByOldGpNo(oldGpNo, CancellationToken.None);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(conflictResult.Value);
        Assert.False(envelope.Success);
        Assert.Contains(oldGpNo, envelope.Message);
        Assert.Null(envelope.Items);
    }

    [Fact]
    public async Task SearchSection129AByOldGpNo_WhenNotMapped_ReturnsNotFoundWithDistinctApiResponse()
    {
        // Arrange — the old number exists in PropertyMastOld but has no current, active mapping —
        // this is a different cause from "no such old number at all" and gets a distinct message.
        const string oldGpNo = "UNMAPPED-NO";
        _mockSection129Service
            .Setup(s => s.SearchByOldGpNoAsync(oldGpNo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoSearchResultDto.NotMapped);

        // Act
        var result = await _controller.SearchSection129AByOldGpNo(oldGpNo, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Contains(oldGpNo, envelope.Message);
        Assert.Contains("No property is mapped", envelope.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetSection129ASchedule_WhenPropertyExists_ReturnsOkWithApiResponse()
    {
        // Arrange
        const int propertyId = 101;
        var expectedDto = new Section129ScheduleDto
        {
            PropertyId = propertyId,
            Upic = "UPIC-101",
            BaseTaxCode = "General Tax"
        };

        _mockSection129Service
            .Setup(s => s.GetScheduleAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        // Act
        var result = await _controller.GetSection129ASchedule(propertyId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(okResult.Value);
        Assert.True(envelope.Success);
        Assert.Equal("Record fetched successfully", envelope.Message);
        Assert.NotNull(envelope.Items);
        Assert.Equal(propertyId, envelope.Items.PropertyId);
    }

    [Fact]
    public async Task GetSection129ASchedule_WhenPropertyNotFound_ReturnsNotFoundWithApiResponse()
    {
        // Arrange
        const int propertyId = 999;
        _mockSection129Service
            .Setup(s => s.GetScheduleAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129ScheduleDto?)null);

        // Act
        var result = await _controller.GetSection129ASchedule(propertyId, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Equal($"Property ID {propertyId} not found", envelope.Message);
    }

    [Fact]
    public async Task ApplySection129A_WhenPropertyExists_ReturnsOkWithApiResponse()
    {
        // Arrange
        const int propertyId = 202;
        var request = new Section129ApplyRequestDto
        {
            AreaChanged = false,
            UseChanged = false,
            OtherStructuralChange = false
        };
        var expectedDto = new Section129ScheduleDto
        {
            PropertyId = propertyId,
            IsApplied = true,
            CaseStatus = "Calculated"
        };

        _mockSection129Service
            .Setup(s => s.ApplyAsync(propertyId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        // Act
        var result = await _controller.ApplySection129A(propertyId, request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(okResult.Value);
        Assert.True(envelope.Success);
        Assert.Equal("Section 129A applied successfully", envelope.Message);
        Assert.NotNull(envelope.Items);
        Assert.True(envelope.Items.IsApplied);
    }

    [Fact]
    public async Task ApplySection129A_WhenPropertyNotFound_ReturnsNotFoundWithApiResponse()
    {
        // Arrange
        const int propertyId = 999;
        var request = new Section129ApplyRequestDto();

        _mockSection129Service
            .Setup(s => s.ApplyAsync(propertyId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129ScheduleDto?)null);

        // Act
        var result = await _controller.ApplySection129A(propertyId, request, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Equal($"Property ID {propertyId} not found", envelope.Message);
    }

    [Fact]
    public async Task RecalculateSection129A_WhenPropertyExists_ReturnsOkWithApiResponse()
    {
        // Arrange
        const int propertyId = 303;
        var expectedDto = new Section129ScheduleDto
        {
            PropertyId = propertyId,
            CaseStatus = "Calculated"
        };

        _mockSection129Service
            .Setup(s => s.RecalculateAsync(propertyId, It.IsAny<Section129RecalculateRequestDto?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        // Act
        var result = await _controller.RecalculateSection129A(propertyId, null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(okResult.Value);
        Assert.True(envelope.Success);
        Assert.Equal("Section 129A schedule recalculated successfully", envelope.Message);
        Assert.NotNull(envelope.Items);
    }

    [Fact]
    public async Task RecalculateSection129A_WhenPropertyNotFound_ReturnsNotFoundWithApiResponse()
    {
        // Arrange
        const int propertyId = 999;
        _mockSection129Service
            .Setup(s => s.RecalculateAsync(propertyId, It.IsAny<Section129RecalculateRequestDto?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129ScheduleDto?)null);

        // Act
        var result = await _controller.RecalculateSection129A(propertyId, null, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<Section129ScheduleDto>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Equal($"Property ID {propertyId} not found", envelope.Message);
    }

    [Fact]
    public async Task ExportSection129AScheduleCsv_WhenPropertyExists_ReturnsFileResult()
    {
        // Arrange
        const int propertyId = 404;
        const string csvContent = "UPIC,\"UPIC-404\"\nFinancial Year,Stage\n";

        _mockSection129Service
            .Setup(s => s.GetScheduleCsvAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(csvContent);

        // Act
        var result = await _controller.ExportSection129AScheduleCsv(propertyId, CancellationToken.None);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("text/csv", fileResult.ContentType);
        Assert.Equal("Section_129A_General_Tax_Schedule.csv", fileResult.FileDownloadName);
        Assert.NotNull(fileResult.FileContents);
        Assert.True(fileResult.FileContents.Length > 0);

        // Ensure UTF-8 BOM is present
        Assert.Equal(0xEF, fileResult.FileContents[0]);
        Assert.Equal(0xBB, fileResult.FileContents[1]);
        Assert.Equal(0xBF, fileResult.FileContents[2]);
    }

    [Fact]
    public async Task ExportSection129AScheduleCsv_WhenPropertyNotFound_ReturnsNotFoundWithApiResponse()
    {
        // Arrange
        const int propertyId = 999;
        _mockSection129Service
            .Setup(s => s.GetScheduleCsvAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        // Act
        var result = await _controller.ExportSection129AScheduleCsv(propertyId, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var envelope = Assert.IsType<ApiResponse<string>>(notFoundResult.Value);
        Assert.False(envelope.Success);
        Assert.Equal($"Property ID {propertyId} not found", envelope.Message);
    }
}
