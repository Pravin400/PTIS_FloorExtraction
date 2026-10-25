using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Range;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Master;

public class FloorControllerTests
{
    private readonly Mock<IFloorService> _serviceMock;
    private readonly Mock<IHardDeleteCleanupService> _cleanupServiceMock;
    private readonly Mock<IReferenceValidationService> _referenceValidationMock;
    private readonly Mock<ILogger<FloorController>> _loggerMock;
    private readonly FloorController _controller;

    public FloorControllerTests()
    {
        _serviceMock = new Mock<IFloorService>();
        _cleanupServiceMock = new Mock<IHardDeleteCleanupService>();
        _referenceValidationMock = new Mock<IReferenceValidationService>();
        _loggerMock = new Mock<ILogger<FloorController>>();
        _controller = new FloorController(
            _serviceMock.Object,
            _cleanupServiceMock.Object,
            _referenceValidationMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithDescriptionEnglish()
    {
        var queryParams = new FloorQueryParameters();
        var pagedResult = new PagedResult<FloorDto>
        {
            Items = new List<FloorDto>
            {
                new FloorDto
                {
                    Id = 1,
                    FloorCode = "1",
                    Description = "१ ला मजला",
                    DescriptionEnglish = "1st Floor",
                    SequenceNo = 1,
                    MaxFloorNo = 1
                }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };
        _serviceMock.Setup(s => s.GetAllAsync(It.IsAny<FloorQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(queryParams, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PagedResult<FloorDto>>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal("1st Floor", response.Items.First().DescriptionEnglish);
        Assert.Equal("१ ला मजला", response.Items.First().Description);
    }

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkResult_WithDescriptionEnglish()
    {
        var dto = new FloorDto
        {
            Id = 1,
            FloorCode = "0",
            Description = "तळ मजला",
            DescriptionEnglish = "Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        _serviceMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await _controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<FloorDto>(okResult.Value);
        Assert.Equal(1, response.Id);
        Assert.Equal("0", response.FloorCode);
        Assert.Equal("तळ मजला", response.Description);
        Assert.Equal("Ground Floor", response.DescriptionEnglish);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FloorDto?)null);

        var result = await _controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_WithValidDto_ReturnsOkResult_WithDescriptionEnglish()
    {
        var createDto = new CreateFloorDto
        {
            FloorCode = "0",
            Description = "तळ मजला",
            DescriptionEnglish = "Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        var returnedDto = new FloorDto
        {
            Id = 1,
            FloorCode = "0",
            Description = "तळ मजला",
            DescriptionEnglish = "Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        _serviceMock.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        var result = await _controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FloorDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Ground Floor", response.Items.DescriptionEnglish);
        Assert.Equal("तळ मजला", response.Items.Description);
    }

    [Fact]
    public async Task CreateFromRange_WithValidRequest_ReturnsOkResult_WithDescriptionEnglish()
    {
        var request = new RangeCreateRequest<CreateFloorDto>
        {
            RangeFrom = "1",
            RangeTo = "2",
            Template = new CreateFloorDto
            {
                FloorCode = "F",
                Description = "मजला",
                DescriptionEnglish = "Floor",
                SequenceNo = 1,
                MaxFloorNo = 1,
                IsActive = true
            }
        };

        var rangeResult = new RangeResult<FloorDto>(2, 0, new List<FloorDto>
        {
            new FloorDto { Id = 1, FloorCode = "1", Description = "१ ला मजला", DescriptionEnglish = "1st Floor" },
            new FloorDto { Id = 2, FloorCode = "2", Description = "२ रा मजला", DescriptionEnglish = "2nd Floor" }
        });

        _serviceMock.Setup(s => s.CreateFromRangeAsync(
                It.IsAny<RangeCreateRequest<CreateFloorDto>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(rangeResult);

        _serviceMock.Setup(s => s.CreateFromRangeAsync(
                It.IsAny<RangeCreateRequest<CreateFloorDto>>(),
                It.IsAny<Func<CreateFloorDto, string, int, CreateFloorDto>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(rangeResult);

        var result = await _controller.CreateFromRange(request, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<RangeResult<FloorDto>>>(okResult.Value);
        Assert.NotNull(apiResponse.Items);
        Assert.Equal(2, apiResponse.Items.Results.Count);
        Assert.Equal("1st Floor", apiResponse.Items.Results[0].DescriptionEnglish);
        Assert.Equal("१ ला मजला", apiResponse.Items.Results[0].Description);
        Assert.Equal("2nd Floor", apiResponse.Items.Results[1].DescriptionEnglish);
        Assert.Equal("२ रा मजला", apiResponse.Items.Results[1].Description);
    }

    [Fact]
    public async Task BulkCreate_WithValidDtos_ReturnsOkResult_WithDescriptionEnglish()
    {
        var dtos = new[]
        {
            new CreateFloorDto { FloorCode = "1", Description = "१ ला मजला", DescriptionEnglish = "1st Floor", SequenceNo = 1, MaxFloorNo = 1 },
            new CreateFloorDto { FloorCode = "2", Description = "२ रा मजला", DescriptionEnglish = "2nd Floor", SequenceNo = 2, MaxFloorNo = 2 }
        };
        var bulkResult = new BulkResult<FloorDto>(
            2,
            0,
            new List<FloorDto>
            {
                new FloorDto { Id = 1, FloorCode = "1", Description = "१ ला मजला", DescriptionEnglish = "1st Floor", SequenceNo = 1, MaxFloorNo = 1 },
                new FloorDto { Id = 2, FloorCode = "2", Description = "२ रा मजला", DescriptionEnglish = "2nd Floor", SequenceNo = 2, MaxFloorNo = 2 }
            });
        _serviceMock.Setup(s => s.BulkCreateAsync(dtos, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkCreate(dtos, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<FloorDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(2, response.Items.SuccessCount);
        Assert.Equal("1st Floor", response.Items.Results[0].DescriptionEnglish);
        Assert.Equal("2nd Floor", response.Items.Results[1].DescriptionEnglish);
    }

    [Fact]
    public async Task Update_WithValidData_ReturnsOkResult_WithDescriptionEnglish()
    {
        var updateDto = new UpdateFloorDto
        {
            FloorCode = "0",
            Description = "सुधारित तळ मजला",
            DescriptionEnglish = "Updated Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        var returnedDto = new FloorDto
        {
            Id = 1,
            FloorCode = "0",
            Description = "सुधारित तळ मजला",
            DescriptionEnglish = "Updated Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        _serviceMock.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        var result = await _controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FloorDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal("Updated Ground Floor", response.Items.DescriptionEnglish);
        Assert.Equal("सुधारित तळ मजला", response.Items.Description);
    }

    [Fact]
    public async Task Update_WithInvalidId_ReturnsNotFound()
    {
        var updateDto = new UpdateFloorDto
        {
            FloorCode = "0",
            Description = "सुधारित तळ मजला",
            DescriptionEnglish = "Updated Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1
        };
        _serviceMock.Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FloorDto?)null);

        var result = await _controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FloorDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task BulkUpdate_WithValidData_ReturnsOkResult_WithDescriptionEnglish()
    {
        var items = new[]
        {
            new BulkUpdateItem<int, UpdateFloorDto>(1, new UpdateFloorDto { FloorCode = "1", Description = "सुधारित १ ला मजला", DescriptionEnglish = "Updated 1st Floor", SequenceNo = 1, MaxFloorNo = 1 })
        };
        var bulkResult = new BulkResult<FloorDto>(
            1,
            0,
            new List<FloorDto>
            {
                new FloorDto { Id = 1, FloorCode = "1", Description = "सुधारित १ ला मजला", DescriptionEnglish = "Updated 1st Floor", SequenceNo = 1, MaxFloorNo = 1 }
            });
        _serviceMock.Setup(s => s.BulkUpdateAsync(items, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkUpdate(items, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<FloorDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(1, response.Items.SuccessCount);
        Assert.Equal("Updated 1st Floor", response.Items.Results[0].DescriptionEnglish);
        Assert.Equal("सुधारित १ ला मजला", response.Items.Results[0].Description);
    }

    [Fact]
    public async Task Delete_WithValidId_ReturnsOkResult()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FloorDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _controller.Delete(999, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<FloorDto>>(okResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task BulkDelete_WithValidIds_ReturnsOkResult()
    {
        var ids = new[] { 1, 2 };
        var bulkResult = new BulkResult<int>(2, 0, new List<int> { 1, 2 });
        _serviceMock.Setup(s => s.BulkDeleteAsync(ids, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkDelete(ids, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<int>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(2, response.Items?.SuccessCount);
    }

    [Fact]
    public async Task Purge_WithValidId_ReturnsOkResult()
    {
        _cleanupServiceMock.Setup(c => c.ForceHardDeleteAsync<FloorEntity, int>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _controller.Purge(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task BulkPurge_WithValidIds_ReturnsOkResult()
    {
        var ids = new[] { 1, 2 };
        var bulkResult = new BulkResult<int>(2, 0, new List<int> { 1, 2 });
        _referenceValidationMock.Setup(s => s.GetReferencingTablesWithDataAsync<FloorEntity, int>(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string>());
        _cleanupServiceMock.Setup(c => c.BulkForceHardDeleteAsync<FloorEntity, int>(It.IsAny<int[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        var result = await _controller.BulkPurge(ids, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<int>>>(okResult.Value);
        Assert.True(response.Success);
    }

    #region GetMaxFlatGenerationSeq Tests

    [Fact]
    public async Task GetMaxFlatGenerationSeq_ReturnsOkResult_WithMaxSeq()
    {
        var groupId = 2;
        _serviceMock.Setup(s => s.GetMaxFlatGenerationSeqAsync(groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(32);

        var result = await _controller.GetMaxFlatGenerationSeq(groupId, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(32, response.Items);
    }

    [Fact]
    public async Task GetMaxFlatGenerationSeq_WhenNoFloors_ReturnsZero()
    {
        var groupId = 99;
        _serviceMock.Setup(s => s.GetMaxFlatGenerationSeqAsync(groupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var result = await _controller.GetMaxFlatGenerationSeq(groupId, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(0, response.Items);
    }

    #endregion
}
