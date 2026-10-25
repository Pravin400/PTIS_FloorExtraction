using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Api.Controllers.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Tests.Api.Controllers.Asset_Management;

/// <summary>
/// Tests for <see cref="AssetLeaseRentDetailsController"/> covering the standard CRUD endpoints
/// (delegated through CrudControllerExtensions) plus the hand-written workflow-transition
/// endpoints (SendForVerification, SendToVerification, Verify, Approve, Reject,
/// RevertToRegistration, RevertToVerification) and GetPreviousTenantHistory. The service is fully
/// mocked; only controller-level response-shaping, not-found handling, and the
/// GetCurrentUserId()/RunTransition() helpers are exercised here.
/// </summary>
public class AssetLeaseRentDetailsControllerTests
{
    private static AssetLeaseRentDetailsController Create(
        out Mock<IAssetLeaseRentDetailsService> service,
        out Mock<ILogger<AssetLeaseRentDetailsController>> logger,
        int? currentUserId = 42)
    {
        service = new Mock<IAssetLeaseRentDetailsService>();
        logger = new Mock<ILogger<AssetLeaseRentDetailsController>>();
        var fileValidationHelper = new FileValidationHelper(new ConfigurationBuilder().Build());
        var controller = new AssetLeaseRentDetailsController(service.Object, fileValidationHelper, logger.Object);

        var claims = new List<Claim>();
        if (currentUserId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, currentUserId.Value.ToString()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")) }
        };

        return controller;
    }

    private static AssetLeaseRentDetailsDto MakeDto(int id = 1, string workflowStatus = "Pending") => new()
    {
        Id = id,
        AssetId = 10,
        TenantName = "Acme Traders",
        TenantMobile = "9999999999",
        WorkflowStatus = workflowStatus
    };

    #region Controller Contract Tests

    [Fact]
    public void Controller_HasExpectedRoutePrefix()
    {
        var attribute = typeof(AssetLeaseRentDetailsController)
            .GetCustomAttributes(typeof(RouteAttribute), false)
            .FirstOrDefault() as RouteAttribute;

        Assert.NotNull(attribute);
        Assert.Equal("api/[controller]", attribute!.Template);
    }

    [Fact]
    public void Controller_RequiresAuthorization()
    {
        var attributes = typeof(AssetLeaseRentDetailsController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), false);

        Assert.NotEmpty(attributes);
    }

    #endregion

    #region GetAll / GetById Tests

    [Fact]
    public async Task GetAll_DelegatesToService_ReturnsPagedResult()
    {
        var controller = Create(out var service, out _);
        var query = new AssetLeaseRentDetailsQueryParameters { PageNumber = 1, PageSize = 10 };
        var pagedResult = new PagedResult<AssetLeaseRentDetailsDto>(new List<AssetLeaseRentDetailsDto> { MakeDto() }, 1, 1, 10);
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>())).ReturnsAsync(pagedResult);

        var result = await controller.GetAll(query, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<PagedResult<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.Equal(1, returned.TotalCount);
    }

    [Fact]
    public async Task GetAll_WhenFilterValidationExceptionThrown_Returns400()
    {
        var controller = Create(out var service, out _);
        var query = new AssetLeaseRentDetailsQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new FilterValidationException("SortBy", "Unknown sort field"));

        var result = await controller.GetAll(query, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetById_WhenFound_Returns200WithDto()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var dto = MakeDto();
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dto);

        var result = await controller.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, Assert.IsType<AssetLeaseRentDetailsDto>(okResult.Value).Id);
    }

    [Fact]
    public async Task GetById_WhenNotFound_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.GetById(999, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    /// <summary>
    /// Regression test for the Copilot finding: leases carry tenant Aadhaar/PAN/address, so a
    /// single lease read must be gated the same way documents/history are.
    /// </summary>
    [Fact]
    public async Task GetById_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.GetById(1, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region Create / Update Tests

    [Fact]
    public async Task Create_WithValidDto_Returns200WithApiResponse()
    {
        var controller = Create(out var service, out _);
        var createDto = new CreateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>())).ReturnsAsync(MakeDto());

        var result = await controller.Create(createDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal(1, response.Items!.Id);
    }

    [Fact]
    public async Task Create_WhenServiceThrowsDuplicateMessage_Returns409()
    {
        var controller = Create(out var service, out _);
        var createDto = new CreateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Violation of UNIQUE constraint - duplicate"));

        var result = await controller.Create(createDto, CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.False(Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(conflict.Value).Success);
    }

    /// <summary>
    /// Regression test for the Copilot finding: creation was guarded only by [Authorize] — any
    /// authenticated user could create a lease (with tenant PII) against another department's
    /// asset. The controller must check CanUserAccessAssetAsync before ever calling CreateAsync.
    /// </summary>
    [Fact]
    public async Task Create_UserCannotAccessTargetAsset_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var createDto = new CreateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Create(createDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.CreateAsync(It.IsAny<CreateAssetLeaseRentDetailsDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// Regression test for the Copilot finding: CreatedBy was still accepted from the request body
    /// and mapped straight onto the entity (only UpdatedBy was being overwritten), so a caller
    /// could forge the creator audit id or leave it null. The controller must overwrite it with the
    /// authenticated claim before the DTO reaches the service.
    /// </summary>
    [Theory]
    [InlineData(999)] // forged
    [InlineData(null)] // omitted
    public async Task Create_CreatedByInRequestBody_IsOverwrittenWithAuthenticatedUserId(int? createdByInBody)
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var createDto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme",
            TenantMobile = "9999999999",
            CreatedBy = createdByInBody
        };
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateAssetLeaseRentDetailsDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto());

        var result = await controller.Create(createDto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        service.Verify(s => s.CreateAsync(It.Is<CreateAssetLeaseRentDetailsDto>(d => d.CreatedBy == 42), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_WhenFound_Returns200WithApiResponseSuccessTrue()
    {
        var controller = Create(out var service, out _);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.UpdateAsync(1, updateDto, It.IsAny<CancellationToken>())).ReturnsAsync(MakeDto());

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.True(Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Success);
    }

    /// <summary>
    /// Regression test for the Copilot finding: any authenticated caller who guesses an id could
    /// change another department's tenant/financial data — a plain PUT must be authorized against
    /// the lease it targets.
    /// </summary>
    [Fact]
    public async Task Update_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.UpdateAsync(It.IsAny<int>(), It.IsAny<UpdateAssetLeaseRentDetailsDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// Regression test for the Copilot finding: AssetId is mutable through this DTO. Being
    /// authorized for the lease's CURRENT asset isn't enough — the caller must also be authorized
    /// for the TARGET asset the request is reassigning the lease to.
    /// </summary>
    [Fact]
    public async Task Update_UserCannotAccessTargetAsset_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 20, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(20, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.UpdateAsync(It.IsAny<int>(), It.IsAny<UpdateAssetLeaseRentDetailsDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// Regression test for the Copilot finding: UpdatedBy was taken straight from the client-
    /// supplied request body, letting a caller forge the audit actor (or omit it entirely for a
    /// bogus "0"). The controller must always overwrite it with the authenticated claim before the
    /// DTO reaches the service — it feeds both the entity's own audit column and the history
    /// snapshot's PerformedBy/CreatedBy.
    /// </summary>
    [Fact]
    public async Task Update_ForgedUpdatedByInRequestBody_IsOverwrittenWithAuthenticatedUserId()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme",
            TenantMobile = "9999999999",
            UpdatedBy = 999 // forged — must never reach the service as-is
        };
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.UpdateAsync(1, It.Is<UpdateAssetLeaseRentDetailsDto>(d => d.UpdatedBy == 42), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto());

        var result = await controller.Update(1, updateDto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(42, updateDto.UpdatedBy);
        service.Verify(s => s.UpdateAsync(1, It.Is<UpdateAssetLeaseRentDetailsDto>(d => d.UpdatedBy == 42), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// ExecuteUpdate's not-found path returns 200 OK with Success = false (not 404) — this is
    /// CrudControllerExtensions' existing behavior, distinct from ExecuteGetById's 404. Pinned
    /// here so a future change to that behavior is a deliberate, visible decision.
    /// </summary>
    [Fact]
    public async Task Update_WhenNotFound_ReturnsOkWithSuccessFalse()
    {
        var controller = Create(out var service, out _);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.UpdateAsync(999, updateDto, It.IsAny<CancellationToken>())).ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.Update(999, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.False(Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Success);
    }

    /// <summary>
    /// Regression test for the Copilot finding: DeleteAsync was reachable through the service
    /// (inherited from BaseCommonCrudService) but had no HTTP route on this controller.
    /// </summary>
    [Fact]
    public async Task Delete_WhenFound_ReturnsOkWithSuccessTrue()
    {
        var controller = Create(out var service, out _);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.True(Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Success);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsOkWithSuccessFalse()
    {
        var controller = Create(out var service, out _);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.DeleteAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Delete(999, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.False(Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Success);
    }

    /// <summary>
    /// Regression test for the Copilot finding: Delete had no department authorization check.
    /// </summary>
    [Fact]
    public async Task Delete_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Delete(1, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.DeleteAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region SendForVerification Tests

    [Fact]
    public async Task SendForVerification_Found_ReturnsOkWithUpdatedDto()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.UpdateAndSendToVerificationAsync(1, updateDto, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto());

        var result = await controller.SendForVerification(1, updateDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Sent for verification successfully.", response.Message);
    }

    [Fact]
    public async Task SendForVerification_NotFound_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };
        service.Setup(s => s.UpdateAndSendToVerificationAsync(999, updateDto, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.SendForVerification(999, updateDto, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task SendForVerification_NoUserIdClaim_ThrowsUnauthorizedAccessException()
    {
        var controller = Create(out var service, out _, currentUserId: null);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => controller.SendForVerification(1, updateDto, CancellationToken.None));

        service.Verify(s => s.UpdateAndSendToVerificationAsync(
            It.IsAny<int>(), It.IsAny<UpdateAssetLeaseRentDetailsDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// Regression test for the Copilot finding: RunTransition (shared by every workflow-mutation
    /// endpoint) must check department-scoped access to the lease BEFORE invoking the transition.
    /// SendForVerification is representative — RunTransition itself is what's under test here.
    /// </summary>
    [Fact]
    public async Task SendForVerification_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "Acme", TenantMobile = "9999999999" };

        var result = await controller.SendForVerification(1, updateDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.UpdateAndSendToVerificationAsync(
            It.IsAny<int>(), It.IsAny<UpdateAssetLeaseRentDetailsDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// Regression test for the Copilot finding: this DTO can reassign the lease to a different
    /// AssetId than it currently has. Being authorized for the lease's CURRENT asset (the check
    /// above) isn't enough — the caller must also be authorized for the TARGET asset.
    /// </summary>
    [Fact]
    public async Task SendForVerification_UserCannotAccessTargetAsset_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.CanUserAccessAssetAsync(20, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 20, TenantName = "Acme", TenantMobile = "9999999999" };

        var result = await controller.SendForVerification(1, updateDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.UpdateAndSendToVerificationAsync(
            It.IsAny<int>(), It.IsAny<UpdateAssetLeaseRentDetailsDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region SendToVerification / Verify / Approve / Reject / Revert Tests

    [Fact]
    public async Task SendToVerification_Found_ReturnsOkWithMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.SendToVerificationAsync(1, "note", 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto());

        var result = await controller.SendToVerification(1, new LeaseWorkflowActionDto { Remarks = "note" }, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Sent to verification successfully", response.Message);
    }

    [Fact]
    public async Task SendToVerification_NotFound_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.SendToVerificationAsync(999, null, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.SendToVerification(999, new LeaseWorkflowActionDto(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task SendToVerification_InvalidTransition_PropagatesInvalidOperationException()
    {
        // No catch for this in the controller/RunTransition — the global exception handler maps
        // InvalidOperationException to 400. Verify it is not silently swallowed here.
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.SendToVerificationAsync(1, null, 42, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("LeaseRent_InvalidTransition:Verified->Pending"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => controller.SendToVerification(1, new LeaseWorkflowActionDto(), CancellationToken.None));
    }

    [Fact]
    public async Task Verify_Found_ReturnsOkWithVerifiedMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.VerifyAsync(1, null, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto(workflowStatus: "Verified"));

        var result = await controller.Verify(1, new LeaseWorkflowActionDto(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.Equal("Verified successfully", response.Message);
        Assert.Equal("Verified", response.Items!.WorkflowStatus);
    }

    [Fact]
    public async Task Verify_NotFound_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.VerifyAsync(999, null, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.Verify(999, new LeaseWorkflowActionDto(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Approve_Found_ReturnsOkWithApprovedMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.ApproveAsync(1, null, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto(workflowStatus: "Approved"));

        var result = await controller.Approve(1, new LeaseWorkflowActionDto(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Approved successfully", Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Message);
    }

    [Fact]
    public async Task Reject_Found_ReturnsOkWithRejectedMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.RejectAsync(1, "Non-payment", 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto(workflowStatus: "Rejected"));

        var result = await controller.Reject(1, new LeaseRejectDto { Reason = "Non-payment" }, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value);
        Assert.Equal("Rejected successfully", response.Message);
        Assert.Equal("Rejected", response.Items!.WorkflowStatus);
    }

    [Fact]
    public async Task Reject_NotFound_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(999, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.RejectAsync(999, "Reason", 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetLeaseRentDetailsDto?)null);

        var result = await controller.Reject(999, new LeaseRejectDto { Reason = "Reason" }, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task RevertToRegistration_Found_ReturnsOkWithMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.RevertToRegistrationAsync(1, null, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto());

        var result = await controller.RevertToRegistration(1, new LeaseWorkflowActionDto(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Reverted to registration successfully", Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Message);
    }

    [Fact]
    public async Task RevertToVerification_Found_ReturnsOkWithMessage()
    {
        var controller = Create(out var service, out _, currentUserId: 7);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.RevertToVerificationAsync(1, null, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeDto(workflowStatus: "Verified"));

        var result = await controller.RevertToVerification(1, new LeaseWorkflowActionDto(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Reverted to verification successfully", Assert.IsType<ApiResponse<AssetLeaseRentDetailsDto>>(okResult.Value).Message);
    }

    #endregion

    #region GetPreviousTenantHistory Tests

    [Fact]
    public async Task GetPreviousTenantHistory_UserCanAccessLease_ReturnsOkWithList()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var history = new List<AssetLeaseRentPreviousTenantHistoryDto>
        {
            new() { Id = 1, TenantName = "Old Tenant", TenantMobile = "8888888888" }
        };
        service.Setup(s => s.GetPreviousTenantHistoryAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(history);

        var result = await controller.GetPreviousTenantHistory(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<List<AssetLeaseRentPreviousTenantHistoryDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Single(response.Items!);
    }

    [Fact]
    public async Task GetPreviousTenantHistory_NoHistory_ReturnsOkWithEmptyList()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.GetPreviousTenantHistoryAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AssetLeaseRentPreviousTenantHistoryDto>());

        var result = await controller.GetPreviousTenantHistory(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<List<AssetLeaseRentPreviousTenantHistoryDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Empty(response.Items!);
    }

    /// <summary>
    /// Regression test for the Copilot finding: this endpoint returns Aadhaar/PAN/address/
    /// financial history, so it must be gated the same way GetDocuments is — no bare
    /// [Authorize]-only access.
    /// </summary>
    [Fact]
    public async Task GetPreviousTenantHistory_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.GetPreviousTenantHistory(1, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.GetPreviousTenantHistoryAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region GetDocuments — Department-Scoped Authorization

    [Fact]
    public async Task GetDocuments_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await controller.GetDocuments(1, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.GetDocumentsByAssetLeaseRentDetailsIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetDocuments_UserCanAccessLease_ReturnsOkWithList()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var documents = new List<AssetLeaseRentDetailsDocumentDto>
        {
            new() { DocumentId = 1, FileName = "lease.pdf" }
        };
        service.Setup(s => s.GetDocumentsByAssetLeaseRentDetailsIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(documents);

        var result = await controller.GetDocuments(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<List<AssetLeaseRentDetailsDocumentDto>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.Single(response.Items!);
    }

    #endregion

    #region UploadDocument — Department-Scoped Authorization

    private static Mock<IFormFile> MockPdfFormFile(string content = "file content")
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(content);
        var file = new Mock<IFormFile>();
        file.Setup(f => f.Length).Returns(bytes.Length);
        file.Setup(f => f.FileName).Returns("test.pdf");
        file.Setup(f => f.ContentType).Returns("application/pdf");
        file.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(bytes));
        return file;
    }

    /// <summary>
    /// Regression test for the Copilot finding: uploading must not be reachable just because the
    /// caller knows an active lease id — the same department check GetDocuments/
    /// GetPreviousTenantHistory use must run first, before the file is even opened.
    /// </summary>
    [Fact]
    public async Task UploadDocument_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var formDto = new AssetLeaseRentDetailsDocumentUploadFormDto
        {
            File = MockPdfFormFile().Object,
            AssetLeaseRentDetailsId = 1,
            ModuleId = 1
        };

        var result = await controller.UploadDocument(formDto, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.UploadDocumentAsync(
            It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<long>(),
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
            It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UploadDocument_UserCanAccessLease_CallsService_ReturnsOk()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var response = new AssetLeaseRentDetailsDocumentUploadResponseDto
        {
            DocumentGuid = Guid.NewGuid(),
            DocumentId = 5,
            DocumentBindingId = 6,
            FileName = "test.pdf",
            FileSizeBytes = 12,
            StoragePath = "uploads/test.pdf"
        };
        service.Setup(s => s.UploadDocumentAsync(
            It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<long>(),
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
            It.IsAny<bool>(), It.IsAny<string?>(), 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var formDto = new AssetLeaseRentDetailsDocumentUploadFormDto
        {
            File = MockPdfFormFile().Object,
            AssetLeaseRentDetailsId = 1,
            ModuleId = 1
        };

        var result = await controller.UploadDocument(formDto, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<AssetLeaseRentDetailsDocumentUploadResponseDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(response.DocumentGuid, apiResponse.Items!.DocumentGuid);
    }

    #endregion

    #region DownloadDocument — Department-Scoped Authorization

    /// <summary>
    /// Regression test for the Copilot finding: download was the one document endpoint with no
    /// department check — the bound-to-lease check alone let anyone holding another department's
    /// lease id + document GUID stream the file. It must be gated like GetDocuments, before the
    /// service ever opens the file.
    /// </summary>
    [Fact]
    public async Task DownloadDocument_UserCannotAccessLease_ReturnsForbid()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var documentGuid = Guid.NewGuid();
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.DownloadDocument(1, documentGuid, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.GetDocumentFileAsync(
            It.IsAny<int>(), It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DownloadDocument_UserCanAccessLease_ReturnsFileStream()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var documentGuid = Guid.NewGuid();
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.GetDocumentFileAsync(1, documentGuid, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new MemoryStream(new byte[10]), "lease.pdf", "application/pdf"));

        var result = await controller.DownloadDocument(1, documentGuid, CancellationToken.None);

        var fileResult = Assert.IsType<FileStreamResult>(result);
        Assert.Equal("lease.pdf", fileResult.FileDownloadName);
        Assert.Equal("application/pdf", fileResult.ContentType);
    }

    [Fact]
    public async Task DownloadDocument_DocumentNotBoundToLease_Returns404()
    {
        var controller = Create(out var service, out _, currentUserId: 42);
        var documentGuid = Guid.NewGuid();
        service.Setup(s => s.CanUserAccessLeaseAsync(1, 42, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        service.Setup(s => s.GetDocumentFileAsync(1, documentGuid, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)null, string.Empty, string.Empty));

        var result = await controller.DownloadDocument(1, documentGuid, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    #endregion

    #region GetCurrentUserId Edge Cases

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("not-a-number")]
    public async Task Verify_InvalidUserIdClaim_ThrowsUnauthorizedAccessException(string claimValue)
    {
        var controller = new AssetLeaseRentDetailsController(
            new Mock<IAssetLeaseRentDetailsService>().Object,
            new FileValidationHelper(new ConfigurationBuilder().Build()),
            new Mock<ILogger<AssetLeaseRentDetailsController>>().Object);
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, claimValue) };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")) }
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => controller.Verify(1, new LeaseWorkflowActionDto(), CancellationToken.None));
    }

    #endregion
}
