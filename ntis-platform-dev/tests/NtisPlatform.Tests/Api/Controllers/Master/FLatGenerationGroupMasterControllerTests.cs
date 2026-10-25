using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class FLatGenerationGroupMasterControllerTests
{
    private readonly Mock<IFLatGenerationGroupMasterService> _mockService;
    private readonly Mock<ILogger<FLatGenerationGroupMasterController>> _mockLogger;
    private readonly FLatGenerationGroupMasterController _controller;

    public FLatGenerationGroupMasterControllerTests()
    {
        _mockService = new Mock<IFLatGenerationGroupMasterService>();
        _mockLogger = new Mock<ILogger<FLatGenerationGroupMasterController>>();
        _controller = new FLatGenerationGroupMasterController(_mockService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedData()
    {
        var query = new FLatGenerationGroupMasterQueryParameters();
        var pagedResult = new PagedResult<FLatGenerationGroupMasterDto>(new List<FLatGenerationGroupMasterDto>(), 0, 1, 10);

        _mockService.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(query, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOkResult()
    {
        var dto = new FLatGenerationGroupMasterDto { Id = 1, FLatGenerationGroup = "UPPER" };
        _mockService.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await _controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(dto, okResult.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _mockService.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FLatGenerationGroupMasterDto?)null);

        var result = await _controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOkWithApiResponse()
    {
        var createDto = new CreateFLatGenerationGroupMasterDto { FLatGenerationGroup = "GROUND" };
        var createdDto = new FLatGenerationGroupMasterDto { Id = 2, FLatGenerationGroup = "GROUND" };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        var result = await _controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FLatGenerationGroupMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(createdDto, response.Items);
    }

    [Fact]
    public async Task Update_WhenSuccessful_ReturnsOkResult()
    {
        var updateDto = new UpdateFLatGenerationGroupMasterDto { FLatGenerationGroup = "UPPER" };
        var updatedDto = new FLatGenerationGroupMasterDto { Id = 1, FLatGenerationGroup = "UPPER" };

        _mockService.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        var result = await _controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FLatGenerationGroupMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(updatedDto, response.Items);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsOkWithSuccessFalse()
    {
        var updateDto = new UpdateFLatGenerationGroupMasterDto { FLatGenerationGroup = "UPPER" };

        _mockService.Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FLatGenerationGroupMasterDto?)null);

        var result = await _controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FLatGenerationGroupMasterDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_WhenSuccessful_ReturnsOkWithSuccessTrue()
    {
        _mockService.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FLatGenerationGroupMasterDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Contains("marked for deletion", response.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsOkWithSuccessFalse()
    {
        _mockService.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _controller.Delete(999, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FLatGenerationGroupMasterDto>>(okResult.Value);
        Assert.False(response.Success);
        Assert.Equal("Record not found", response.Message);
    }

    [Fact]
    public void Controller_HasAuthorizeAttribute()
    {
        var type = typeof(FLatGenerationGroupMasterController);
        var authorizeAttribute = Attribute.GetCustomAttribute(type, typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute));

        Assert.NotNull(authorizeAttribute);
    }
}
