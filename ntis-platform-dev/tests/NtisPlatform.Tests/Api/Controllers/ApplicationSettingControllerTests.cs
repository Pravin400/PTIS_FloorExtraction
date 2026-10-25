using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers;
using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers;

public class ApplicationSettingControllerTests
{
    private static ApplicationSettingController CreateController(out Mock<IApplicationSettingService> serviceMock)
    {
        serviceMock = new Mock<IApplicationSettingService>();
        var loggerMock = new Mock<ILogger<ApplicationSettingController>>();
        return new ApplicationSettingController(serviceMock.Object, loggerMock.Object);
    }

    [Fact]
    public async Task GetAllPaged_ReturnsOkWithPagedResult()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var query = new ApplicationSettingQueryParameters { PageNumber = 1, PageSize = 10 };
        var expectedItems = new List<ApplicationSettingDto>
        {
            new() { Id = 1, FlagName = "EnvirementStatus", DataType = "NVARCHAR", DefaultValue_NVARCHAR = "Development" },
            new() { Id = 2, FlagName = "IsOTPVerificationForSign", DataType = "BIT", DefaultValue_Bit = false }
        };
        var pagedResult = new PagedResult<ApplicationSettingDto>(expectedItems, 2, 1, 10);
        serviceMock.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>())).ReturnsAsync(pagedResult);

        // Act
        var result = await controller.GetAllPaged(query, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actual = Assert.IsType<PagedResult<ApplicationSettingDto>>(okResult.Value);
        Assert.Equal(2, actual.TotalCount);
        Assert.Equal("EnvirementStatus", actual.Items.First().FlagName);
    }

    [Fact]
    public async Task GetAllPaged_WithIsActiveFilter_PassesQueryToService()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var query = new ApplicationSettingQueryParameters { IsActive = true, DataType = "NVARCHAR" };
        var expectedItems = new List<ApplicationSettingDto>
        {
            new() { Id = 1, FlagName = "EnvirementStatus", DataType = "NVARCHAR", IsActive = true }
        };
        var pagedResult = new PagedResult<ApplicationSettingDto>(expectedItems, 1, 1, 10);
        serviceMock.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>())).ReturnsAsync(pagedResult);

        // Act
        var result = await controller.GetAllPaged(query, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actual = Assert.IsType<PagedResult<ApplicationSettingDto>>(okResult.Value);
        Assert.Single(actual.Items);
        Assert.True(actual.Items.First().IsActive);
        serviceMock.Verify(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_WithModuleId_ReturnsGroupedSettings()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var expectedList = new List<ApplicationSettingModuleDto>
        {
            new()
            {
                ModuleId = 8012,
                ModuleName = "GeoSequencing",
                Settings = new Dictionary<string, object?>
                {
                    ["GeoSequencing"] = new[]
                    {
                        new Dictionary<string, object?> { ["IsMaintenance"] = false }
                    }
                }
            }
        };
        serviceMock.Setup(s => s.GetSettingsAsync(8012, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedList);

        // Act
        var result = await controller.GetAll(8012, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actual = Assert.IsType<List<ApplicationSettingModuleDto>>(okResult.Value);
        Assert.Single(actual);
        Assert.Equal(8012, actual[0].ModuleId);
        serviceMock.Verify(s => s.GetSettingsAsync(8012, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var dto = new ApplicationSettingDto { Id = 1, FlagName = "EnvirementStatus", DataType = "NVARCHAR" };
        serviceMock.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dto);

        // Act
        var result = await controller.GetById(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actual = Assert.IsType<ApplicationSettingDto>(okResult.Value);
        Assert.Equal(1, actual.Id);
        Assert.Equal("EnvirementStatus", actual.FlagName);
    }

    [Fact]
    public async Task GetById_WhenNotExists_ReturnsNotFound()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        serviceMock.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((ApplicationSettingDto?)null);

        // Act
        var result = await controller.GetById(999, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ValidDto_ReturnsOk()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var createDto = new CreateApplicationSettingDto
        {
            FlagName = "NewFlag",
            DataType = "BIT",
            DefaultValue_Bit = true,
            Description = "Test flag"
        };
        var created = new ApplicationSettingDto
        {
            Id = 10,
            FlagName = "NewFlag",
            DataType = "BIT",
            DefaultValue_Bit = true,
            Description = "Test flag"
        };
        serviceMock.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        // Act
        var result = await controller.Create(createDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ApplicationSettingDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(10, response.Items.Id);
    }

    [Fact]
    public async Task Update_WhenFound_ReturnsOk()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        var updateDto = new UpdateApplicationSettingDto
        {
            Id = 1,
            FlagName = "EnvirementStatus",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "Production"
        };
        var updated = new ApplicationSettingDto
        {
            Id = 1,
            FlagName = "EnvirementStatus",
            DataType = "NVARCHAR",
            DefaultValue_NVARCHAR = "Production"
        };
        serviceMock.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        // Act
        var result = await controller.Update(1, updateDto, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ApplicationSettingDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Production", response.Items?.DefaultValue_NVARCHAR);
    }

    [Fact]
    public async Task Delete_WhenFound_ReturnsOk()
    {
        // Arrange
        var controller = CreateController(out var serviceMock);
        serviceMock.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        // Act
        var result = await controller.Delete(1, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<ApplicationSettingDto>>(okResult.Value);
        Assert.True(response.Success);
    }
}
