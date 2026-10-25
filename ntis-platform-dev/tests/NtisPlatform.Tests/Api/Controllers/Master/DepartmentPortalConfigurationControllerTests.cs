using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.WaterBill;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.WaterBill;

/// <summary>
/// Unit and security tests for CitizenServiceController DepartmentPortalConfiguration partial endpoints.
/// Validates authorization boundaries, anonymous citizen portal access, and controller action executions.
/// </summary>
public class DepartmentPortalConfigurationControllerTests
{
    private static CitizenServiceController CreateController(
        out Mock<IDepartmentPortalConfigurationService> mockService)
    {
        var mockCitizenService = new Mock<ICitizenServiceService>();
        var mockPortalContentService = new Mock<IPortalContentService>();
        mockService = new Mock<IDepartmentPortalConfigurationService>();
        var mockLogger = new Mock<ILogger<CitizenServiceController>>();

        return new CitizenServiceController(
            mockCitizenService.Object,
            mockPortalContentService.Object,
            mockService.Object,
            mockLogger.Object);
    }

    #region Security & Authorization Attribute Tests

    [Fact]
    public void GetByDepartmentId_HasAllowAnonymousAttribute()
    {
        var method = typeof(CitizenServiceController)
            .GetMethod(nameof(CitizenServiceController.GetDepartmentPortalConfigurationByDepartmentId));

        Assert.NotNull(method);
        var allowAnon = method.GetCustomAttribute<AllowAnonymousAttribute>();
        Assert.NotNull(allowAnon);
    }

    [Theory]
    [InlineData(nameof(CitizenServiceController.GetAllDepartmentPortalConfigurations))]
    [InlineData(nameof(CitizenServiceController.GetDepartmentPortalConfigurationById))]
    [InlineData(nameof(CitizenServiceController.CreateDepartmentPortalConfiguration))]
    [InlineData(nameof(CitizenServiceController.UpdateDepartmentPortalConfiguration))]
    [InlineData(nameof(CitizenServiceController.DeleteDepartmentPortalConfiguration))]
    [InlineData(nameof(CitizenServiceController.UpdateDepartmentPortalConfigurationStatus))]
    public void AdministrativeMutationsAndQueries_HaveAuthorizeAttribute(string methodName)
    {
        var method = typeof(CitizenServiceController)
            .GetMethod(methodName);

        Assert.NotNull(method);
        var authAttr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
    }

    #endregion

    #region GetByDepartmentId Tests

    [Fact]
    public async Task GetByDepartmentId_WhenFound_ReturnsOkResultWithData()
    {
        var controller = CreateController(out var service);
        var dto = new DepartmentPortalConfigurationDto
        {
            Id = 1,
            DepartmentId = 5,
            ConfigJson = "{}",
            ConfigVersion = 1,
            IsActive = true
        };

        service.Setup(s => s.GetByDepartmentIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await controller.GetDepartmentPortalConfigurationByDepartmentId(5, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<DepartmentPortalConfigurationDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(5, apiResponse.Items?.DepartmentId);
    }

    [Fact]
    public async Task GetByDepartmentId_WhenNotFound_ReturnsNotFoundResult()
    {
        var controller = CreateController(out var service);
        service.Setup(s => s.GetByDepartmentIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DepartmentPortalConfigurationDto?)null);

        var result = await controller.GetDepartmentPortalConfigurationByDepartmentId(99, CancellationToken.None);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<DepartmentPortalConfigurationDto>>(notFoundResult.Value);
        Assert.False(apiResponse.Success);
    }

    #endregion

    #region UpdateStatus Tests

    [Fact]
    public async Task UpdateStatus_WhenFound_CallsServiceAndReturnsOk()
    {
        var controller = CreateController(out var service);
        service.Setup(s => s.SetActiveStatusAsync(1, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.UpdateDepartmentPortalConfigurationStatus(1, new UpdatePortalConfigStatusDto { IsActive = false }, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Contains("deactivated", apiResponse.Message);

        service.Verify(s => s.SetActiveStatusAsync(1, false, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatus_WhenNotFound_ReturnsNotFound()
    {
        var controller = CreateController(out var service);
        service.Setup(s => s.SetActiveStatusAsync(999, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await controller.UpdateDepartmentPortalConfigurationStatus(999, new UpdatePortalConfigStatusDto { IsActive = true }, CancellationToken.None);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
        Assert.False(apiResponse.Success);
    }

    #endregion

    #region CRUD Action Delegation Tests

    [Fact]
    public async Task GetAll_ReturnsOkResult()
    {
        var controller = CreateController(out var service);
        var query = new DepartmentPortalConfigurationQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<DepartmentPortalConfigurationDto>(new List<DepartmentPortalConfigurationDto>(), 0, 1, 10));

        var result = await controller.GetAllDepartmentPortalConfigurations(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOkResult()
    {
        var controller = CreateController(out var service);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentPortalConfigurationDto { Id = 1, DepartmentId = 1 });

        var result = await controller.GetDepartmentPortalConfigurationById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOkResult()
    {
        var controller = CreateController(out var service);
        var dto = new CreateDepartmentPortalConfigurationDto { DepartmentId = 1, ConfigJson = "{}" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentPortalConfigurationDto { Id = 1, DepartmentId = 1 });

        var result = await controller.CreateDepartmentPortalConfiguration(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOkResult()
    {
        var controller = CreateController(out var service);
        var dto = new UpdateDepartmentPortalConfigurationDto { ConfigJson = "{}", ExpectedVersion = 1 };
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentPortalConfigurationDto { Id = 1, DepartmentId = 1, ConfigVersion = 2 });

        var result = await controller.UpdateDepartmentPortalConfiguration(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsOkResult()
    {
        var controller = CreateController(out var service);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.DeleteDepartmentPortalConfiguration(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    #endregion
}
