using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.GrievanceControllers;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.GrievanceControllers
{
    public class GrievancePhotoTypeControllerTests
    {
        private readonly Mock<IGrievancePhotoTypeService> _mockService;
        private readonly Mock<ILogger<GrievancePhotoTypeController>> _mockLogger;
        private readonly GrievancePhotoTypeController _controller;

        public GrievancePhotoTypeControllerTests()
        {
            _mockService = new Mock<IGrievancePhotoTypeService>();
            _mockLogger = new Mock<ILogger<GrievancePhotoTypeController>>();
            _controller = new GrievancePhotoTypeController(_mockService.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GetAll_ReturnsOkResult_WithPagedData()
        {
            // Arrange
            var query = new GrievancePhotoTypeQueryParameters();
            var expectedData = new PagedResult<GrievancePhotoTypeDto>(new List<GrievancePhotoTypeDto>
            {
                new GrievancePhotoTypeDto { Id = 1, PhotoTypeName = "Test", PhotoTypeCode = "TST" }
            }, 1, 1, 10);

            _mockService.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetAll(query, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(expectedData, okResult.Value);
        }
    }
}
