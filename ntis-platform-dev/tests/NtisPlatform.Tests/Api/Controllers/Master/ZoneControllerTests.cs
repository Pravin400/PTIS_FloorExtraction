using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class ZoneControllerTests
{
    private readonly Mock<IZoneService> _serviceMock;
    private readonly Mock<IHardDeleteCleanupService> _cleanupServiceMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<ZoneController>> _loggerMock;
    private readonly ZoneController _controller;

    public ZoneControllerTests()
    {
        _serviceMock = new Mock<IZoneService>();
        _cleanupServiceMock = new Mock<IHardDeleteCleanupService>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _loggerMock = new Mock<ILogger<ZoneController>>();
        _controller = new ZoneController(
            _serviceMock.Object,
            _cleanupServiceMock.Object,
            _referenceValidationMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithDescriptionEnglish()
    {
        var queryParams = new ZoneQueryParameters();
        var pagedResult = new PagedResult<ZoneDto>
        {
            Items = new List<ZoneDto>
            {
                new ZoneDto
                {
                    Id = 1,
                    ZoneNo = "Z1",
                    Description = "मध्य विभाग",
                    DescriptionEnglish = "Central Zone",
                    SequenceNo = 1
                }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };
        _serviceMock.Setup(s => s.GetAllAsync(It.IsAny<ZoneQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(queryParams, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PagedResult<ZoneDto>>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal("Central Zone", response.Items.First().DescriptionEnglish);
        Assert.Equal("मध्य विभाग", response.Items.First().Description);
    }

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkResult_WithDescriptionEnglish()
    {
        var dto = new ZoneDto
        {
            Id = 1,
            ZoneNo = "Z1",
            Description = "मध्य विभाग",
            DescriptionEnglish = "Central Zone",
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await _controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ZoneDto>(okResult.Value);
        Assert.Equal(1, response.Id);
        Assert.Equal("Z1", response.ZoneNo);
        Assert.Equal("मध्य विभाग", response.Description);
        Assert.Equal("Central Zone", response.DescriptionEnglish);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ZoneDto?)null);

        var result = await _controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_WithValidDto_ReturnsOkResult_WithDescriptionEnglish()
    {
        var createDto = new CreateZoneDto
        {
            ZoneNo = "Z1",
            Description = "मध्य विभाग",
            DescriptionEnglish = "Central Zone",
            SequenceNo = 1
        };
        var createdDto = new ZoneDto
        {
            Id = 1,
            ZoneNo = "Z1",
            Description = "मध्य विभाग",
            DescriptionEnglish = "Central Zone",
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.CreateAsync(It.IsAny<CreateZoneDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        var result = await _controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ZoneDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Central Zone", response.Items.DescriptionEnglish);
        Assert.Equal("मध्य विभाग", response.Items.Description);
    }

    [Fact]
    public async Task Update_WithValidData_ReturnsOkResult_WithDescriptionEnglish()
    {
        var updateDto = new UpdateZoneDto
        {
            ZoneNo = "Z1",
            Description = "सुधारित मध्य विभाग",
            DescriptionEnglish = "Updated Central Zone",
            SequenceNo = 1
        };
        var updatedDto = new ZoneDto
        {
            Id = 1,
            ZoneNo = "Z1",
            Description = "सुधारित मध्य विभाग",
            DescriptionEnglish = "Updated Central Zone",
            SequenceNo = 1
        };
        _serviceMock.Setup(s => s.UpdateAsync(1, It.IsAny<UpdateZoneDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedDto);

        var result = await _controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ZoneDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Updated Central Zone", response.Items.DescriptionEnglish);
        Assert.Equal("सुधारित मध्य विभाग", response.Items.Description);
    }

    [Fact]
    public async Task Update_WithInvalidId_ReturnsOkWithFailureMessage()
    {
        var updateDto = new UpdateZoneDto { ZoneNo = "Z99" };
        _serviceMock.Setup(s => s.UpdateAsync(999, It.IsAny<UpdateZoneDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ZoneDto?)null);

        var result = await _controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ZoneDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Delete_WithValidId_ReturnsOk()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Delete(1, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ReturnsOk()
    {
        _serviceMock.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _controller.Delete(999, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Purge_WithValidId_ReturnsOk()
    {
        _cleanupServiceMock.Setup(s => s.ForceHardDeleteAsync<ZoneEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Purge(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task BulkCreate_WithValidItems_ReturnsOkResult_WithDescriptionEnglish()
    {
        var items = new[]
        {
            new CreateZoneDto
            {
                ZoneNo = "Z1",
                Description = "मध्य विभाग",
                DescriptionEnglish = "Central Zone",
                SequenceNo = 1
            },
            new CreateZoneDto
            {
                ZoneNo = "Z2",
                Description = "पूर्व विभाग",
                DescriptionEnglish = "East Zone",
                SequenceNo = 2
            }
        };

        var bulkResult = new BulkResult<ZoneDto>(
            SuccessCount: 2,
            FailedCount: 0,
            Results: new List<ZoneDto>
            {
                new ZoneDto { Id = 1, ZoneNo = "Z1", Description = "मध्य विभाग", DescriptionEnglish = "Central Zone" },
                new ZoneDto { Id = 2, ZoneNo = "Z2", Description = "पूर्व विभाग", DescriptionEnglish = "East Zone" }
            });

        _serviceMock.Setup(s => s.BulkCreateAsync(items, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkCreate(items, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<ZoneDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(2, response.Items.SuccessCount);
        Assert.Equal("Central Zone", response.Items.Results[0].DescriptionEnglish);
        Assert.Equal("East Zone", response.Items.Results[1].DescriptionEnglish);
    }

    [Fact]
    public async Task BulkUpdate_WithValidItems_ReturnsOkResult_WithDescriptionEnglish()
    {
        var items = new[]
        {
            new BulkUpdateItem<int, UpdateZoneDto>(1, new UpdateZoneDto
            {
                ZoneNo = "Z1",
                Description = "सुधारित मध्य विभाग",
                DescriptionEnglish = "Updated Central Zone"
            })
        };

        var bulkResult = new BulkResult<ZoneDto>(
            SuccessCount: 1,
            FailedCount: 0,
            Results: new List<ZoneDto>
            {
                new ZoneDto { Id = 1, ZoneNo = "Z1", Description = "सुधारित मध्य विभाग", DescriptionEnglish = "Updated Central Zone" }
            });

        _serviceMock.Setup(s => s.BulkUpdateAsync(items, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkUpdate(items, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<ZoneDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Updated Central Zone", response.Items.Results[0].DescriptionEnglish);
    }

    [Fact]
    public async Task BulkDelete_WithValidIds_ReturnsOkResult()
    {
        var ids = new[] { 1, 2 };
        var bulkResult = new BulkResult<int>(
            SuccessCount: 2,
            FailedCount: 0,
            Results: new List<int> { 1, 2 });

        _serviceMock.Setup(s => s.BulkDeleteAsync(ids, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkDelete(ids, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<int>>>(okResult.Value);
        Assert.True(response.Success);
    }
}
