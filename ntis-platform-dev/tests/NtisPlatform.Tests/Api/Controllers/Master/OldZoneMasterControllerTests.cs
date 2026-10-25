using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class OldZoneMasterControllerTests
{
    private readonly Mock<IOldZoneMasterService> _mockService;
    private readonly Mock<ILogger<OldZoneMasterController>> _mockLogger;
    private readonly OldZoneMasterController _controller;

    public OldZoneMasterControllerTests()
    {
        _mockService = new Mock<IOldZoneMasterService>();
        _mockLogger = new Mock<ILogger<OldZoneMasterController>>();

        _controller = new OldZoneMasterController(
            _mockService.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_CallsService_AndReturnsOkObjectResult()
    {
        // Arrange
        var query = new OldZoneMasterQueryParameters();
        var pagedResult = new PagedResult<OldZoneMasterDto>(new List<OldZoneMasterDto>(), 0, 1, 10);

        _mockService.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(query, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_CallsService_AndReturnsOkObjectResult()
    {
        // Arrange
        var dto = new OldZoneMasterDto { Id = 1, OldZoneNo = "OZ01", OldZoneName = "Old Zone 1" };
        _mockService.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await _controller.GetById(1, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_CallsService_AndReturnsOkObjectResult()
    {
        // Arrange
        var createDto = new CreateOldZoneMasterDto { OldZoneNo = "OZ01", OldZoneName = "Old Zone 1" };
        var resultDto = new OldZoneMasterDto { Id = 1, OldZoneNo = "OZ01", OldZoneName = "Old Zone 1" };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resultDto);

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_CallsService_AndReturnsOkObjectResult()
    {
        // Arrange
        var updateDto = new UpdateOldZoneMasterDto { OldZoneNo = "OZ01-Updated", OldZoneName = "Old Zone 1 Updated" };
        var resultDto = new OldZoneMasterDto { Id = 1, OldZoneNo = "OZ01-Updated", OldZoneName = "Old Zone 1 Updated" };

        _mockService.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resultDto);

        // Act
        var result = await _controller.Update(1, updateDto, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Delete_CallsService_AndReturnsOkObjectResult()
    {
        // Arrange
        _mockService.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(1, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }
}
