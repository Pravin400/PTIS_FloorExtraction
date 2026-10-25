using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.Grievance;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers
{
    public class GrievancePhotoControllerTests
    {
        private readonly Mock<IGrievancePhotoService> _mockService;
        private readonly Mock<ILogger<GrievancePhotoController>> _mockLogger;
        private readonly GrievancePhotoController _controller;

        public GrievancePhotoControllerTests()
        {
            _mockService = new Mock<IGrievancePhotoService>();
            _mockLogger = new Mock<ILogger<GrievancePhotoController>>();
            _controller = new GrievancePhotoController(_mockService.Object, _mockLogger.Object);

            // Mock the User Claims to avoid UnauthorizedAccessException in GetUserId()
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetPhotosByGrievance_ReturnsOkResult_WithPhotos()
        {
            // Arrange
            var grievanceId = 10;
            var expectedData = new List<GrievancePhotoDto>
            {
                new GrievancePhotoDto { Id = 1, GrievanceApplicationId = 10 }
            };

            _mockService.Setup(s => s.GetPhotosByGrievanceIdAsync(grievanceId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetPhotosByGrievance(grievanceId, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(expectedData, okResult.Value);
        }

        [Fact]
        public async Task UploadPhoto_ReturnsOkResult_WhenSuccessful()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(100);
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            
            var dto = new UploadGrievancePhotoDto { GrievanceApplicationId = 10, PhotoTypeId = 1, File = fileMock.Object };
            _mockService.Setup(s => s.UploadPhotoAsync(dto, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(55); // returns GrievancePhotoId

            // Act
            var result = await _controller.UploadPhoto(dto, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UploadMultiplePhotos_ReturnsOkResult_WhenSuccessful()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(100);
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.ContentType).Returns("image/jpeg");

            var dto = new UploadMultipleGrievancePhotosDto { GrievanceApplicationId = 10, PhotoTypeId = 1, Files = new List<IFormFile> { fileMock.Object } };
            _mockService.Setup(s => s.UploadMultiplePhotosAsync(dto, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<int> { 55, 56 });

            // Act
            var result = await _controller.UploadMultiplePhotos(dto, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeletePhoto_ReturnsOkResult_WhenSuccessful()
        {
            // Arrange
            var photoId = 55;
            _mockService.Setup(s => s.DeletePhotoAsync(photoId, 1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeletePhoto(photoId, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task ViewPhoto_ReturnsFileResult()
        {
            // Arrange
            var stream = new MemoryStream(new byte[] { 1, 2, 3 });
            _mockService.Setup(s => s.ViewPhotoAsync(5, It.IsAny<CancellationToken>()))
                .ReturnsAsync((stream, "test.jpg", "image/jpeg"));

            // Act
            var result = await _controller.ViewPhoto(5, CancellationToken.None);

            // Assert
            var fileResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("image/jpeg", fileResult.ContentType);
            Assert.True(fileResult.EnableRangeProcessing);
        }

        [Fact]
        public async Task ViewPhoto_ReturnsNotFound_WhenNoFile()
        {
            // Arrange
            _mockService.Setup(s => s.ViewPhotoAsync(99, It.IsAny<CancellationToken>()))
                .ReturnsAsync((null, string.Empty, string.Empty));

            // Act
            var result = await _controller.ViewPhoto(99, CancellationToken.None);

            // Assert
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Contains("Photo not found", notFound.Value!.ToString());
        }
    }
}
