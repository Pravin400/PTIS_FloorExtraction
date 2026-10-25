using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.WaterBill.Master;
using NtisPlatform.Api.Middleware;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.WaterBill.Master.PenaltyRule;

/// <summary>
/// Regression tests verifying authorization and audit identity handling on PenaltyRuleMasterController.
/// Ensures all mutation endpoints are protected with [Authorize], unauthenticated requests result in 401 Unauthorized,
/// and audit fields are populated with actual authenticated user credentials instead of "admin".
/// </summary>
public class PenaltyRuleMasterControllerTests
{
    private readonly Mock<IWaterPenaltyRuleService> _mockService;
    private readonly Mock<ILogger<PenaltyRuleMasterController>> _mockLogger;

    public PenaltyRuleMasterControllerTests()
    {
        _mockService = new Mock<IWaterPenaltyRuleService>();
        _mockLogger = new Mock<ILogger<PenaltyRuleMasterController>>();
    }

    private PenaltyRuleMasterController CreateController(ClaimsPrincipal? user = null)
    {
        var controller = new PenaltyRuleMasterController(_mockService.Object, _mockLogger.Object);
        var httpContext = new DefaultHttpContext();
        if (user != null)
        {
            httpContext.User = user;
        }
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    #region TASK 1 & TASK 5: Controller Level Authorization

    [Fact]
    public void Controller_HasAuthorizeAttribute()
    {
        var attributes = typeof(PenaltyRuleMasterController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true);

        Assert.NotNull(attributes);
        Assert.NotEmpty(attributes);
    }

    [Theory]
    [InlineData(nameof(PenaltyRuleMasterController.Create))]
    [InlineData(nameof(PenaltyRuleMasterController.Update))]
    [InlineData(nameof(PenaltyRuleMasterController.UpdateStatus))]
    [InlineData(nameof(PenaltyRuleMasterController.Delete))]
    [InlineData(nameof(PenaltyRuleMasterController.Validate))]
    public void Controller_ProtectsMutationEndpoints_UnderControllerAuthorize(string methodName)
    {
        var method = typeof(PenaltyRuleMasterController).GetMethod(methodName);
        Assert.NotNull(method);

        // Since [Authorize] is on the controller class, all actions inherit authorization requirement
        var controllerAuth = typeof(PenaltyRuleMasterController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true);
        Assert.NotEmpty(controllerAuth);

        // Verify none of the mutation endpoints accidentally bypass authorization with [AllowAnonymous]
        var allowAnon = method.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true);
        Assert.Empty(allowAnon);
    }

    #endregion

    #region TASK 2 & TASK 5: Unauthenticated Access Fails Closed (401 Unauthorized)

    [Fact]
    public async Task Create_WhenUnauthenticated_ThrowsUnauthorizedAccessException()
    {
        var controller = CreateController();
        var dto = new CreateWaterPenaltyRuleDto { FinancialYearId = 1, PenaltyType = "Percentage", PercentageRate = 5 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            controller.Create(dto, CancellationToken.None));

        Assert.Contains("user identification is required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Update_WhenUnauthenticated_ThrowsUnauthorizedAccessException()
    {
        var controller = CreateController();
        var dto = new UpdateWaterPenaltyRuleDto { PenaltyType = "Percentage", PercentageRate = 5 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            controller.Update(1L, dto, CancellationToken.None));

        Assert.Contains("user identification is required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateStatus_WhenUnauthenticated_ThrowsUnauthorizedAccessException()
    {
        var controller = CreateController();
        var dto = new WaterPenaltyRuleStatusDto { IsActive = true };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            controller.UpdateStatus(1L, dto, CancellationToken.None));

        Assert.Contains("user identification is required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnauthenticatedMutation_ThroughGlobalExceptionHandler_Returns401Unauthorized()
    {
        var controller = CreateController();
        var dto = new CreateWaterPenaltyRuleDto { FinancialYearId = 1, PenaltyType = "Percentage", PercentageRate = 5 };

        var mockLogger = new Mock<ILogger<GlobalExceptionHandlerMiddleware>>();
        var mockEnv = new Mock<IWebHostEnvironment>();
        mockEnv.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        RequestDelegate next = async (ctx) =>
        {
            await controller.Create(dto, CancellationToken.None);
        };

        var middleware = new GlobalExceptionHandlerMiddleware(next, mockLogger.Object, mockEnv.Object);
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(httpContext);

        Assert.Equal(StatusCodes.Status401Unauthorized, httpContext.Response.StatusCode);
    }

    #endregion

    #region TASK 2 & TASK 4: Authenticated Audit Identity (Never "admin")

    [Fact]
    public async Task Create_WhenAuthenticated_PopulatesCreatedByWithUserId_NotAdmin()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Name, "officer_sharma")
        }, "TestAuth"));

        var controller = CreateController(user);
        var createDto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m
        };

        var expectedDto = new WaterPenaltyRuleDto { PenaltyRuleId = 10, CreatedBy = 42 };
        _mockService.Setup(s => s.CreateAsync(It.IsAny<CreateWaterPenaltyRuleDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var result = await controller.Create(createDto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(42, createDto.CreatedBy);
        _mockService.Verify(s => s.CreateAsync(It.Is<CreateWaterPenaltyRuleDto>(d => d.CreatedBy == 42), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_WhenAuthenticated_PopulatesUpdatedByWithUserId_NotAdmin()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Name, "officer_sharma")
        }, "TestAuth"));

        var controller = CreateController(user);
        var updateDto = new UpdateWaterPenaltyRuleDto
        {
            PenaltyType = "Percentage",
            PercentageRate = 3.0m
        };

        var expectedDto = new WaterPenaltyRuleDto { PenaltyRuleId = 10, UpdatedBy = 42 };
        _mockService.Setup(s => s.UpdateAsync(10L, It.IsAny<UpdateWaterPenaltyRuleDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var result = await controller.Update(10L, updateDto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(42, updateDto.UpdatedBy);
        _mockService.Verify(s => s.UpdateAsync(10L, It.Is<UpdateWaterPenaltyRuleDto>(d => d.UpdatedBy == 42), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatus_WhenAuthenticated_PassesUserIdToService_NotAdmin()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Name, "officer_sharma")
        }, "TestAuth"));

        var controller = CreateController(user);
        var statusDto = new WaterPenaltyRuleStatusDto { IsActive = false };

        _mockService.Setup(s => s.UpdateStatusAsync(10L, false, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.UpdateStatus(10L, statusDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(response.Success);
        _mockService.Verify(s => s.UpdateStatusAsync(10L, false, 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Delete_WhenAuthenticated_PassesUserIdToService_NotAdmin()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Name, "officer_sharma")
        }, "TestAuth"));

        var controller = CreateController(user);
        _mockService.Setup(s => s.DeleteAsync(10L, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await controller.Delete(10L, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(response.Success);
        _mockService.Verify(s => s.DeleteAsync(10L, 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsNotFound()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42")
        }, "TestAuth"));

        var controller = CreateController(user);
        _mockService.Setup(s => s.DeleteAsync(999L, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await controller.Delete(999L, CancellationToken.None);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(notFoundResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Validate_WhenAuthenticated_ReturnsValidationResult()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Name, "officer_sharma")
        }, "TestAuth"));

        var controller = CreateController(user);
        var request = new WaterPenaltyRuleValidationRequestDto { FinancialYearId = 1, PenaltyType = "Percentage" };
        var validationResult = new WaterPenaltyRuleValidationResultDto();

        _mockService.Setup(s => s.ValidateConflictAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(validationResult);

        var result = await controller.Validate(request, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<WaterPenaltyRuleValidationResultDto>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task GetUserId_WhenClaimTypesNameIsAlphaUsername_AndUserIdClaimExists_CorrectlyResolvesNumericId()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Name, "superadmin_officer"),
            new Claim("userId", "88")
        }, "TestAuth"));

        var controller = CreateController(user);
        var createDto = new CreateWaterPenaltyRuleDto
        {
            FinancialYearId = 1,
            PenaltyType = "Percentage",
            PercentageRate = 2.5m
        };

        var expectedDto = new WaterPenaltyRuleDto { PenaltyRuleId = 10, CreatedBy = 88 };
        _mockService.Setup(s => s.CreateAsync(It.IsAny<CreateWaterPenaltyRuleDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var result = await controller.Create(createDto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(88, createDto.CreatedBy);
    }

    [Fact]
    public async Task Delete_WhenUnauthenticated_ThrowsUnauthorizedAccessException()
    {
        var controller = CreateController();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            controller.Delete(10L, CancellationToken.None));

        Assert.Contains("user identification is required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    #endregion
}
