using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class SubFloorControllerTests
{
    private readonly Mock<ISubFloorService> _serviceMock;
    private readonly Mock<IHardDeleteCleanupService> _cleanupServiceMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<SubFloorController>> _loggerMock;
    private readonly SubFloorController _controller;

    public SubFloorControllerTests()
    {
        _serviceMock = new Mock<ISubFloorService>();
        _cleanupServiceMock = new Mock<IHardDeleteCleanupService>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _loggerMock = new Mock<ILogger<SubFloorController>>();
        _controller = new SubFloorController(
            _serviceMock.Object,
            _cleanupServiceMock.Object,
            _referenceValidationMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithDescriptionEnglish()
    {
        var queryParams = new SubFloorQueryParameters();
        var pagedResult = new PagedResult<SubFloorDto>
        {
            Items = new List<SubFloorDto>
            {
                new SubFloorDto
                {
                    Id = 1,
                    SubFloorCode = "SF01",
                    Description = "पहिला पोट मजला",
                    DescriptionEnglish = "1st Sub Floor",
                    SubFloorPercentage = 10.5m,
                    SequenceNo = 1
                }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };
        _serviceMock.Setup(s => s.GetAllAsync(It.IsAny<SubFloorQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(queryParams, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PagedResult<SubFloorDto>>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal("1st Sub Floor", response.Items.First().DescriptionEnglish);
        Assert.Equal("पहिला पोट मजला", response.Items.First().Description);
    }

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkResult_WithDescriptionEnglish()
    {
        var dto = new SubFloorDto
        {
            Id = 1,
            SubFloorCode = "SF01",
            Description = "पहिला पोट मजला",
            DescriptionEnglish = "1st Sub Floor",
            SubFloorPercentage = 10.5m,
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await _controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<SubFloorDto>(okResult.Value);
        Assert.Equal(1, response.Id);
        Assert.Equal("SF01", response.SubFloorCode);
        Assert.Equal("पहिला पोट मजला", response.Description);
        Assert.Equal("1st Sub Floor", response.DescriptionEnglish);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SubFloorDto?)null);

        var result = await _controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_WithValidDto_ReturnsOkResult_WithDescriptionEnglish()
    {
        var createDto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "नवीन पोट मजला",
            DescriptionEnglish = "New Sub Floor",
            SubFloorPercentage = 10.5m,
            SequenceNo = 1
        };
        var returnedDto = new SubFloorDto
        {
            Id = 1,
            SubFloorCode = "SF01",
            Description = "नवीन पोट मजला",
            DescriptionEnglish = "New Sub Floor",
            SubFloorPercentage = 10.5m,
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        var result = await _controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<SubFloorDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("New Sub Floor", response.Items.DescriptionEnglish);
        Assert.Equal("नवीन पोट मजला", response.Items.Description);
    }

    [Fact]
    public async Task Update_WithValidData_ReturnsOkResult_WithDescriptionEnglish()
    {
        var updateDto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "सुधारित पोट मजला",
            DescriptionEnglish = "Updated Sub Floor",
            SubFloorPercentage = 15.0m,
            SequenceNo = 1
        };
        var returnedDto = new SubFloorDto
        {
            Id = 1,
            SubFloorCode = "SF01",
            Description = "सुधारित पोट मजला",
            DescriptionEnglish = "Updated Sub Floor",
            SubFloorPercentage = 15.0m,
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        var result = await _controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<SubFloorDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Updated Sub Floor", response.Items.DescriptionEnglish);
        Assert.Equal("सुधारित पोट मजला", response.Items.Description);
    }

    [Fact]
    public async Task Update_WithInvalidId_ReturnsOkWithFailure()
    {
        var updateDto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "सुधारित पोट मजला",
            DescriptionEnglish = "Updated Sub Floor",
            SubFloorPercentage = 15.0m,
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SubFloorDto?)null);

        var result = await _controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<SubFloorDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_WithValidId_ReturnsOkResult()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<SubFloorDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ReturnsOkWithFailure()
    {
        _serviceMock.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _controller.Delete(999, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<SubFloorDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Purge_WithValidId_ReturnsOkResult()
    {
        _cleanupServiceMock.Setup(c => c.ForceHardDeleteAsync<SubFloorEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Purge(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Purge_WithInvalidId_ReturnsOkWithFailure()
    {
        _cleanupServiceMock.Setup(c => c.ForceHardDeleteAsync<SubFloorEntity, int>(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _controller.Purge(999, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.False(response.Success);
    }
}
