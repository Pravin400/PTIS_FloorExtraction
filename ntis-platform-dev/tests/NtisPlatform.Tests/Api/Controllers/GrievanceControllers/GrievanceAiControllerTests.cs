using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers;

public class GrievanceAiControllerTests
{
    private readonly Mock<IGeminiAiService> _geminiServiceMock;
    private readonly Mock<ILogger<GrievanceAiController>> _loggerMock;

    public GrievanceAiControllerTests()
    {
        _geminiServiceMock = new Mock<IGeminiAiService>();
        _loggerMock = new Mock<ILogger<GrievanceAiController>>();
    }

    private GrievanceAiController CreateController()
    {
        return new GrievanceAiController(
            _geminiServiceMock.Object,
            _loggerMock.Object);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("ab")]
    public async Task RefineDescription_WhenTextTooShortOrEmpty_ReturnsBadRequest(string invalidText)
    {
        // Arrange
        var controller = CreateController();
        var dto = new RefineGrievanceDescriptionRequestDto { RawDescription = invalidText };

        _geminiServiceMock.Setup(g => g.RefineDescriptionAsync(invalidText, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Please provide a valid description of at least 3 characters."));

        // Act
        var result = await controller.RefineDescription(dto, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task RefineDescription_WhenValidText_ReturnsOkWithPolishedAnalysis()
    {
        // Arrange
        var controller = CreateController();
        var dto = new RefineGrievanceDescriptionRequestDto { RawDescription = "i hhave sssseeen the paaaaking issue on the main road" };

        var mockAnalysis = new GrievanceAiAnalysisDto
        {
            IsValidCivicIssue = true,
            DepartmentId = 5,
            DepartmentName = "Traffic Department",
            SuggestedTitle = "Illegal Parking Obstruction",
            SuggestedTitleLocal = "अवैध पार्किंग अडथळा",
            SuggestedDescription = "There is persistent illegal parking causing severe traffic blockage on the main road.",
            SuggestedDescriptionLocal = "मुख्य रस्त्यावर सातत्याने होत असलेल्या अवैध पार्किंगमुळे वाहतुकीस मोठा अडथळा होत आहे.",
            AccuracyPercentage = 92.5
        };

        _geminiServiceMock.Setup(g => g.RefineDescriptionAsync(dto.RawDescription, It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockAnalysis);

        // Act
        var result = await controller.RefineDescription(dto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analysis = Assert.IsType<GrievanceAiAnalysisDto>(okResult.Value);
        Assert.True(analysis.IsValidCivicIssue);
        Assert.Equal(5, analysis.DepartmentId);
        Assert.Equal("Traffic Department", analysis.DepartmentName);
    }

    [Fact]
    public async Task ScanImage_WhenNoFilesProvided_ReturnsBadRequest()
    {
        // Arrange
        var controller = CreateController();

        _geminiServiceMock.Setup(g => g.ScanUploadedPhotosAsync(null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("At least one valid image file must be uploaded."));

        // Act
        var result = await controller.ScanImage(null, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ScanImage_WhenFileNotImage_ReturnsBadRequest()
    {
        // Arrange
        var controller = CreateController();
        var file = CreateMockFormFile("document.pdf", "application/pdf", new byte[] { 1, 2, 3 });

        _geminiServiceMock.Setup(g => g.ScanUploadedPhotosAsync(It.IsAny<IEnumerable<IFormFile>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("File 'document.pdf' is not a supported image format. Allowed formats: JPG, JPEG, PNG, WEBP, JFIF."));

        // Act
        var result = await controller.ScanImage(new List<IFormFile> { file }, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ScanImage_WhenValidPhotos_CallsServiceAndReturnsOk()
    {
        // Arrange
        var controller = CreateController();
        var file1 = CreateMockFormFile("pothole1.jpg", "image/jpeg", new byte[] { 1, 2, 3 });
        var file2 = CreateMockFormFile("pothole2.png", "image/png", new byte[] { 4, 5, 6 });

        var mockAnalysis = new GrievanceAiAnalysisDto
        {
            DepartmentId = 1,
            DepartmentName = "Public Works",
            GrievanceTypeId = 10,
            GrievanceTypeName = "Potholes on Road",
            SuggestedTitle = "Severe Potholes on Roadway",
            SuggestedDescription = "Large potholes causing dangerous road conditions.",
            IsValidCivicIssue = true
        };

        _geminiServiceMock.Setup(g => g.ScanUploadedPhotosAsync(It.IsAny<IEnumerable<IFormFile>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockAnalysis);

        // Act
        var result = await controller.ScanImage(new List<IFormFile> { file1, file2 }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analysis = Assert.IsType<GrievanceAiAnalysisDto>(okResult.Value);
        Assert.Equal(1, analysis.DepartmentId);
        Assert.Equal("Public Works", analysis.DepartmentName);
    }

    [Fact]
    public async Task ScanImage_WhenGeminiReturnsServiceUnavailable_Returns503()
    {
        // Arrange
        var controller = CreateController();
        var file = CreateMockFormFile("pothole.jpg", "image/jpeg", new byte[] { 1, 2, 3 });

        _geminiServiceMock.Setup(g => g.ScanUploadedPhotosAsync(It.IsAny<IEnumerable<IFormFile>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceAiAnalysisDto?)null);

        // Act
        var result = await controller.ScanImage(new List<IFormFile> { file }, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, statusResult.StatusCode);
    }

    [Fact]
    public async Task ScanImage_WhenSinglePhotoUploaded_ReturnsOkAnalysis()
    {
        // Arrange
        var controller = CreateController();
        var file = CreateMockFormFile("single.jpg", "image/jpeg", new byte[] { 10, 20, 30 });

        var mockAnalysis = new GrievanceAiAnalysisDto
        {
            DepartmentId = 2,
            DepartmentName = "Solid Waste Management",
            SuggestedTitle = "Garbage Overflow",
            IsValidCivicIssue = true
        };

        _geminiServiceMock.Setup(g => g.ScanUploadedPhotosAsync(It.IsAny<IEnumerable<IFormFile>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockAnalysis);

        // Act
        var result = await controller.ScanImage(new List<IFormFile> { file }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analysis = Assert.IsType<GrievanceAiAnalysisDto>(okResult.Value);
        Assert.Equal(2, analysis.DepartmentId);
        Assert.Equal("Solid Waste Management", analysis.DepartmentName);
    }

    private static IFormFile CreateMockFormFile(string fileName, string contentType, byte[] content)
    {
        var fileMock = new Mock<IFormFile>();
        var ms = new MemoryStream(content);
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.ContentType).Returns(contentType);
        fileMock.Setup(f => f.Length).Returns(content.Length);
        fileMock.Setup(f => f.OpenReadStream()).Returns(ms);
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Callback<Stream, CancellationToken>((target, _) => ms.CopyTo(target))
            .Returns(Task.CompletedTask);
        return fileMock.Object;
    }
}
