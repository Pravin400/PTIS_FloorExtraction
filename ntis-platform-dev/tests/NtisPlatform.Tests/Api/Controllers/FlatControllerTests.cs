using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class FlatControllerTests
{
    private readonly Mock<IFlatService> _mockService;
    private readonly Mock<ILogger<FlatController>> _mockLogger;
    private readonly FlatController _controller;

    public FlatControllerTests()
    {
        _mockService = new Mock<IFlatService>();
        _mockLogger = new Mock<ILogger<FlatController>>();
        _controller = new FlatController(_mockService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOkResult_WithData()
    {
        // Arrange
        int id = 1;
        var dto = new FlatDto { PropertyId = id, FlatShopNumber = "A-101" };

        _mockService.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await _controller.GetById(id, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnValue = okResult.Value.Should().BeAssignableTo<FlatDto>().Subject;
        returnValue.Should().BeEquivalentTo(dto);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFoundResult()
    {
        // Arrange
        int id = 999;
        _mockService.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FlatDto?)null);

        // Act
        var result = await _controller.GetById(id, CancellationToken.None);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateFlat_WhenSuccessful_ReturnsOkResult_WithSuccessMessage()
    {
        // Arrange
        int id = 1;
        var updateDto = new UpdateFlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };
        var returnedDto = new FlatDto
        {
            PropertyId = 1,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "A-102"
        };

        _mockService.Setup(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        // Act
        var result = await _controller.UpdateFlat(updateDto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<ApiResponse<FlatDto>>().Subject;
        response.Success.Should().BeTrue();
        response.Items.Should().BeEquivalentTo(returnedDto);
        _mockService.Verify(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateFlat_WhenNotFound_ReturnsNotFoundResult()
    {
        // Arrange
        var updateDto = new UpdateFlatDto
        {
            PropertyId = 999,
            SocietyDetailsId = 5,
            WingDetailsId = 10,
            FlatShopNumber = "B-201"
        };

        _mockService.Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FlatDto?)null);

        // Act
        var result = await _controller.UpdateFlat(updateDto, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<ApiResponse<FlatDto>>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Be("Record not found for Update ");
    }
}
