using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using Moq.Protected;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Grievance;

public class GeminiAiServiceTests
{
    private readonly Mock<IRepository<GrievanceDepartmentMasterEntity, int>> _deptRepoMock;
    private readonly Mock<IRepository<GrievanceTypeMasterEntity, int>> _typeRepoMock;
    private readonly IMemoryCache _memoryCache;
    private readonly Mock<ILogger<GeminiAiService>> _loggerMock;

    public GeminiAiServiceTests()
    {
        _deptRepoMock = new Mock<IRepository<GrievanceDepartmentMasterEntity, int>>();
        _typeRepoMock = new Mock<IRepository<GrievanceTypeMasterEntity, int>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _loggerMock = new Mock<ILogger<GeminiAiService>>();

        // Setup active departments
        var departments = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Public Works", DepartmentNameLocal = "सार्वजनिक बांधकाम", IsActive = true },
            new() { Id = 2, DepartmentName = "Solid Waste", DepartmentNameLocal = "घनकचरा व्यवस्थापन", IsActive = true }
        };
        _deptRepoMock.Setup(r => r.GetQueryable()).Returns(departments.BuildMock());

        // Setup active grievance types
        var types = new List<GrievanceTypeMasterEntity>
        {
            new() { Id = 10, GrievanceDepartmentId = 1, GrievanceType = "Road damage", IsActive = true },
            new() { Id = 20, GrievanceDepartmentId = 2, GrievanceType = "Garbage overflow", IsActive = true }
        };
        _typeRepoMock.Setup(r => r.GetQueryable()).Returns(types.BuildMock());
    }

    [Fact]
    public async Task ScanImageAsync_WhenBytesNullOrEmpty_ReturnsNull()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.ScanImageAsync(Array.Empty<byte>(), "image/jpeg", CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ScanImageAsync_WhenApiKeyIsPlaceholder_ReturnsNullWithoutCallingHttp()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Gemini:ApiKey"]).Returns("YOUR_GEMINI_API_KEY");
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.ScanImageAsync(new byte[] { 1, 2, 3 }, "image/jpeg", CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ScanImageAsync_WhenGeminiReturnsValidJson_ParsesCorrectly()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Gemini:ApiKey"]).Returns("valid-test-key");
        configMock.Setup(c => c["Gemini:BaseUrl"]).Returns("https://fake-gemini.com/");
        configMock.Setup(c => c["Gemini:Model"]).Returns("gemini-3.5-flash-lite");

        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        var fakeGeminiResponse = @"{
            ""candidates"": [
                {
                    ""content"": {
                        ""parts"": [
                            {
                                ""text"": ""{\""isValidCivicIssue\"": true, \""departmentId\"": 1, \""departmentName\"": \""Public Works\"", \""grievanceTypeId\"": 10, \""grievanceTypeName\"": \""Road damage\"", \""suggestedTitle\"": \""Road Defect\"", \""suggestedTitleLocal\"": \""रस्त्याची समस्या\"", \""suggestedDescription\"": \""There are severe potholes.\"", \""suggestedDescriptionLocal\"": \""मोठे खड्डे पडले आहेत.\"", \""accuracyPercentage\"": 0.95}""
                            }
                        ]
                    }
                }
            ]
        }";

        mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(fakeGeminiResponse, Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object);
        var service = new GeminiAiService(httpClient, configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.ScanImageAsync(new byte[] { 1, 2, 3 }, "image/jpeg", CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsValidCivicIssue);
        Assert.Equal(1, result.DepartmentId);
        Assert.Equal("Public Works", result.DepartmentName);
        Assert.Equal(95.0, result.AccuracyPercentage);
    }

    [Fact]
    public async Task ScanMultipleImagesAsync_WhenRejectionReasonReturned_PreservesSpecificRejectionReason()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Gemini:ApiKey"]).Returns("valid-test-key");
        configMock.Setup(c => c["Gemini:BaseUrl"]).Returns("https://fake-gemini.com/");
        configMock.Setup(c => c["Gemini:Model"]).Returns("gemini-3.5-flash-lite");

        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        var fakeGeminiResponse = @"{
            ""candidates"": [
                {
                    ""content"": {
                        ""parts"": [
                            {
                                ""text"": ""{\""isValidCivicIssue\"": false, \""isExplicitOrInappropriate\"": false, \""isImageUnclear\"": false, \""rejectionReason\"": \""Photo 2 is a personal photograph and not a civic complaint defect. Please upload photos showing the actual municipal issue.\"", \""rejectionReasonLocal\"": \""फोटो २ हे वैयक्तिक छायाचित्र आहे आणि नागरी तक्रार नाही. कृपया प्रत्यक्ष नागरी समस्येचे फोटो अपलोड करा.\"", \""departmentId\"": null, \""grievanceTypeId\"": null, \""accuracyPercentage\"": 0.0}""
                            }
                        ]
                    }
                }
            ]
        }";

        mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(fakeGeminiResponse, Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object);
        var service = new GeminiAiService(httpClient, configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.ScanMultipleImagesAsync(new[]
        {
            (new byte[] { 1, 2, 3 }, "image/jpeg"),
            (new byte[] { 4, 5, 6 }, "image/jpeg")
        }, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsValidCivicIssue);
        Assert.Equal("Photo 2 is a personal photograph and not a civic complaint defect. Please upload photos showing the actual municipal issue.", result.RejectionReason);
        Assert.Equal("फोटो २ हे वैयक्तिक छायाचित्र आहे आणि नागरी तक्रार नाही. कृपया प्रत्यक्ष नागरी समस्येचे फोटो अपलोड करा.", result.RejectionReasonLocal);
    }

    [Fact]
    public async Task ScanMultipleImagesAsync_WhenDisparateDepartmentsDetected_RejectsWithMultiDepartmentReason()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Gemini:ApiKey"]).Returns("valid-test-key");
        configMock.Setup(c => c["Gemini:BaseUrl"]).Returns("https://fake-gemini.com/");
        configMock.Setup(c => c["Gemini:Model"]).Returns("gemini-3.5-flash-lite");

        var expectedRejection = "The uploaded photos depict multiple unrelated municipal issues that belong to different departments. Each complaint can only address one municipal department. Please submit separate grievance tickets for each issue so the respective departments can take action.";
        var expectedRejectionLocal = "अपलोड केलेले फोटो वेगवेगळ्या विभागांशी संबंधित स्वतंत्र समस्या दर्शवतात. एका तक्रारीत केवळ एकाच विभागाशी संबंधित समस्या नोंदवता येते. योग्य कारवाईसाठी कृपया प्रत्येक समस्येसाठी स्वतंत्र तक्रार नोंदवा.";

        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        var fakeGeminiResponse = $@"{{
            ""candidates"": [
                {{
                    ""content"": {{
                        ""parts"": [
                            {{
                                ""text"": ""{{\""isValidCivicIssue\"": false, \""isExplicitOrInappropriate\"": false, \""isImageUnclear\"": false, \""rejectionReason\"": \""{expectedRejection}\"", \""rejectionReasonLocal\"": \""{expectedRejectionLocal}\"", \""departmentId\"": null, \""grievanceTypeId\"": null, \""accuracyPercentage\"": 0.0}}""
                            }}
                        ]
                    }}
                }}
            ]
        }}";

        mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(fakeGeminiResponse, Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object);
        var service = new GeminiAiService(httpClient, configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.ScanMultipleImagesAsync(new[]
        {
            (new byte[] { 1, 2, 3 }, "image/jpeg"),
            (new byte[] { 4, 5, 6 }, "image/jpeg")
        }, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsValidCivicIssue);
        Assert.Equal(expectedRejection, result.RejectionReason);
        Assert.Equal(expectedRejectionLocal, result.RejectionReasonLocal);
    }

    [Fact]
    public async Task RefineDescriptionAsync_WhenRawDescriptionEmpty_ThrowsArgumentException()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => service.RefineDescriptionAsync("   ", CancellationToken.None));
    }

    [Fact]
    public async Task RefineDescriptionAsync_WhenGeminiReturnsPolishedJson_ParsesAndValidatesCorrectly()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Gemini:ApiKey"]).Returns("valid-test-key");
        configMock.Setup(c => c["Gemini:BaseUrl"]).Returns("https://fake-gemini.com/");
        configMock.Setup(c => c["Gemini:Model"]).Returns("gemini-3.5-flash-lite");

        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        var fakeGeminiResponse = @"{
            ""candidates"": [
                {
                    ""content"": {
                        ""parts"": [
                            {
                                ""text"": ""{\""isValidCivicIssue\"": true, \""departmentId\"": 1, \""departmentName\"": \""Public Works\"", \""grievanceTypeId\"": 10, \""grievanceTypeName\"": \""Road damage\"", \""suggestedTitle\"": \""Severe Road Damage\"", \""suggestedTitleLocal\"": \""रस्त्याची दुरावस्था\"", \""suggestedDescription\"": \""Large potholes are severely damaging the road surface.\"", \""suggestedDescriptionLocal\"": \""रस्त्यावर मोठे खड्डे पडले आहेत.\"", \""accuracyPercentage\"": 95}""
                            }
                        ]
                    }
                }
            ]
        }";

        mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(fakeGeminiResponse, Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object);
        var service = new GeminiAiService(httpClient, configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act
        var result = await service.RefineDescriptionAsync("i hhave sssseeen the paaaaking issue", CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsValidCivicIssue);
        Assert.Equal(1, result.DepartmentId);
        Assert.Equal("Public Works", result.DepartmentName);
        Assert.Equal("Severe Road Damage", result.SuggestedTitle);
        Assert.Equal("Large potholes are severely damaging the road surface.", result.SuggestedDescription);
    }

    [Fact]
    public async Task ScanUploadedPhotosAsync_WhenNoPhotos_ThrowsArgumentException()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => service.ScanUploadedPhotosAsync(null, CancellationToken.None));
    }

    [Fact]
    public async Task ScanUploadedPhotosAsync_WhenMoreThan5Photos_ThrowsArgumentException()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);
        var files = new List<IFormFile>();
        for (int i = 0; i < 6; i++)
        {
            files.Add(CreateMockFormFile($"img{i}.jpg", "image/jpeg", new byte[] { 1, 2 }));
        }

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.ScanUploadedPhotosAsync(files, CancellationToken.None));
        Assert.Contains("maximum of 5", ex.Message);
    }

    [Fact]
    public async Task ScanUploadedPhotosAsync_WhenUnsupportedExtension_ThrowsArgumentException()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);
        var files = new List<IFormFile> { CreateMockFormFile("doc.pdf", "application/pdf", new byte[] { 1, 2 }) };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.ScanUploadedPhotosAsync(files, CancellationToken.None));
        Assert.Contains("not a supported image format", ex.Message);
    }

    [Fact]
    public async Task RefineDescriptionAsync_WhenTextTooShort_ThrowsArgumentException()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        var service = new GeminiAiService(new HttpClient(), configMock.Object, _deptRepoMock.Object, _typeRepoMock.Object, _memoryCache, _loggerMock.Object);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.RefineDescriptionAsync("ab", CancellationToken.None));
        Assert.Contains("at least 3 characters", ex.Message);
    }

    private static IFormFile CreateMockFormFile(string fileName, string contentType, byte[] content)
    {
        var stream = new MemoryStream(content);
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.ContentType).Returns(contentType);
        fileMock.Setup(f => f.Length).Returns(content.Length);
        fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns((Stream target, CancellationToken ct) => stream.CopyToAsync(target, ct));
        return fileMock.Object;
    }
}
