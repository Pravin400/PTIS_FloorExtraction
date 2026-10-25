using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class PropertyWiseControllerTests
{
    private readonly Mock<IPropertyWiseService> _serviceMock;
    private readonly Mock<ILogger<PropertyWiseController>> _loggerMock;
    private readonly PropertyWiseController _controller;

    public PropertyWiseControllerTests()
    {
        _serviceMock = new Mock<IPropertyWiseService>();
        _loggerMock = new Mock<ILogger<PropertyWiseController>>();
        _controller = new PropertyWiseController(_serviceMock.Object, _loggerMock.Object);
    }

    #region GetAll Tests

    [Fact]
    public async Task GetAll_ReturnsOkResult_WithPagedData()
    {
        // Arrange
        var queryParams = new PropertyWiseQueryParameters { PageNumber = 1, PageSize = 10 };
        var pagedResult = new PagedResult<PropertyWiseDto>
        {
            Items = new List<PropertyWiseDto>
            {
                new() { Id = 1, UserId = 10, ZoneId = 1, WardId = 2, FromPropertyNo = "1", ToPropertyNo = "10" }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _serviceMock
            .Setup(s => s.GetAllAsync(queryParams, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetAll(queryParams, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(pagedResult, okResult.Value);
    }

    #endregion

    #region GetById Tests

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkResult()
    {
        // Arrange
        var dto = new PropertyWiseDto { Id = 1, UserId = 10, ZoneId = 1, WardId = 2, FromPropertyNo = "1", ToPropertyNo = "10" };
        _serviceMock
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await _controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(dto, okResult.Value);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _serviceMock
            .Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyWiseDto?)null);

        // Act
        var result = await _controller.GetById(999, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    #endregion

    #region Create Tests

    [Fact]
    public async Task Create_WithValidDto_ReturnsOkResult()
    {
        // Arrange
        var createDto = new CreatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "10",
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 101 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 501 } }
            }
        };

        var createdResult = new List<PropertyWiseDto>
        {
            new()
            {
                Id = 1,
                UserId = 10,
                FromPropertyNo = "1",
                ToPropertyNo = "10"
            }
        };

        _serviceMock
            .Setup(s => s.CreateAllocationsAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdResult);

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<List<PropertyWiseDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Property wise allocations created successfully.", response.Message);
        Assert.Equal(createdResult, response.Items);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task Update_WithValidDto_ReturnsOkResult()
    {
        // Arrange
        int id = 1;
        var updateDto = new UpdatePropertyWiseDto
        {
            UserId = 10,
            DepartmentId = 1,
            ModuleId = 1,
            FromPropertyNo = "1",
            ToPropertyNo = "20"
        };

        var updatedResult = new PropertyWiseDto
        {
            Id = 1,
            UserId = 10,
            FromPropertyNo = "1",
            ToPropertyNo = "20"
        };

        _serviceMock
            .Setup(s => s.UpdateAsync(id, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedResult);

        // Act
        var result = await _controller.Update(id, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PropertyWiseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Record updated successfully", response.Message);
        Assert.Equal(updatedResult, response.Items);
    }

    [Fact]
    public async Task BulkUpdate_WithValidItems_ReturnsOkResult()
    {
        // Arrange
        var items = new[]
        {
            new BulkUpdateItem<int, UpdatePropertyWiseDto>(1, new UpdatePropertyWiseDto { UserId = 10 })
        };

        var bulkResult = new BulkResult<PropertyWiseDto>(1, 0, new List<PropertyWiseDto> { new() { Id = 1, UserId = 10 } });

        _serviceMock
            .Setup(s => s.BulkUpdateAsync(items, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        // Act
        var result = await _controller.BulkUpdate(items, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<PropertyWiseDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("1 records updated, 0 failed", response.Message);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task Delete_WithValidId_ReturnsOkResult()
    {
        // Arrange
        int id = 1;
        _serviceMock
            .Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(id, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PropertyWiseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Record marked for deletion", response.Message);
    }

    [Fact]
    public async Task BulkDelete_WithValidIds_ReturnsOkResult()
    {
        // Arrange
        var ids = new[] { 1, 2 };
        var bulkResult = new BulkResult<int>(2, 0, new List<int> { 1, 2 });

        _serviceMock
            .Setup(s => s.BulkDeleteAsync(ids, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bulkResult);

        // Act
        var result = await _controller.BulkDelete(ids, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<BulkResult<int>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("2 records deleted, 0 not found", response.Message);
    }

    #endregion
}
