using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NtisPlatform.Api.Controllers.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using Xunit;

namespace NtisPlatform.Tests.Api.Controllers.Asset_Management;

/// <summary>
/// Tests for <see cref="AssetCounterPaymentController"/>. The services are mocked; only the
/// controller's user-id resolution, routing to the right service method and response shaping are
/// exercised here.
/// </summary>
public class AssetCounterPaymentControllerTests
{
    private static AssetCounterPaymentController Create(out Mock<IAssetCounterPaymentService> service, int? currentUserId = 42)
        => Create(out service, out _, out _, currentUserId);

    private static AssetCounterPaymentController Create(
        out Mock<IAssetCounterPaymentService> service,
        out Mock<IAssetLeaseRentDetailsService> leaseService,
        int? currentUserId = 42)
        => Create(out service, out leaseService, out _, currentUserId);

    /// <summary>The lease service's asset and lease access checks allow everything unless a test overrides them.</summary>
    private static AssetCounterPaymentController Create(
        out Mock<IAssetCounterPaymentService> service,
        out Mock<IAssetLeaseRentDetailsService> leaseService,
        out Mock<ILeaseRentBillingService> billingService,
        int? currentUserId = 42)
    {
        service = new Mock<IAssetCounterPaymentService>();
        leaseService = new Mock<IAssetLeaseRentDetailsService>();
        leaseService.Setup(s => s.CanUserAccessAssetAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        leaseService.Setup(s => s.CanUserAccessLeaseAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        billingService = new Mock<ILeaseRentBillingService>();
        var controller = new AssetCounterPaymentController(service.Object, leaseService.Object, billingService.Object);

        var claims = new List<Claim>();
        if (currentUserId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, currentUserId.Value.ToString()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")) }
        };

        return controller;
    }

    [Fact]
    public void Controller_HasExpectedRoutePrefix()
    {
        var attribute = typeof(AssetCounterPaymentController)
            .GetCustomAttributes(typeof(RouteAttribute), false)
            .FirstOrDefault() as RouteAttribute;

        Assert.NotNull(attribute);
        Assert.Equal("api/[controller]", attribute!.Template);
    }

    [Fact]
    public void Controller_RequiresAuthorization()
    {
        Assert.NotEmpty(typeof(AssetCounterPaymentController).GetCustomAttributes(typeof(AuthorizeAttribute), false));
    }

    [Fact]
    public async Task Search_PassesCurrentUserToService_AndWrapsResult()
    {
        var controller = Create(out var service, currentUserId: 42);
        var response = new AssetCounterPaymentSearchResponseDto
        {
            SearchText = "9876543210",
            MatchedBy = CounterPaymentSearchField.TenantMobile,
            MatchType = CounterPaymentMatchType.Exact,
            Results = new List<AssetCounterPaymentSearchResultDto>
            {
                new() { LeaseRentDetailsId = 7, AssetId = 10, TenantName = "Acme Traders", TenantMobile = "9876543210" }
            }
        };
        service.Setup(s => s.SearchAsync("9876543210", 42, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var result = await controller.Search(new AssetCounterPaymentSearchQuery { SearchText = "9876543210" }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<ApiResponse<AssetCounterPaymentSearchResponseDto>>(ok.Value);
        Assert.True(body.Success);
        Assert.Same(response, body.Items);
        Assert.Equal(1, body.TotalCount);
        Assert.Contains(CounterPaymentSearchField.TenantMobile, body.Message);
    }

    [Fact]
    public async Task Search_NoResults_ReturnsOkWithEmptyList()
    {
        var controller = Create(out var service);
        service.Setup(s => s.SearchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetCounterPaymentSearchResponseDto { SearchText = "Nobody" });

        var result = await controller.Search(new AssetCounterPaymentSearchQuery { SearchText = "Nobody" }, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<AssetCounterPaymentSearchResponseDto>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Empty(body.Items!.Results);
        Assert.Equal(0, body.TotalCount);
    }

    [Fact]
    public async Task Search_WithoutUserClaim_ThrowsUnauthorized()
    {
        var controller = Create(out var service, currentUserId: null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => controller.Search(new AssetCounterPaymentSearchQuery { SearchText = "x" }, CancellationToken.None));
        service.Verify(s => s.SearchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetDemandDetails_AccessibleAsset_ReturnsOkWithDetails()
    {
        var controller = Create(out var service, out var leaseService, currentUserId: 42);
        var details = new AssetDemandDetailsDto { AssetId = 10, AssetNo = "AMC-BLD-SHP-0010" };
        service.Setup(s => s.GetDemandDetailsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(details);

        var result = await controller.GetDemandDetails(10, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<AssetDemandDetailsDto>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Same(details, body.Items);
        leaseService.Verify(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDemandDetails_AssetOutsideCallersDepartments_ReturnsForbid()
    {
        var controller = Create(out var service, out var leaseService);
        leaseService.Setup(s => s.CanUserAccessAssetAsync(10, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.GetDemandDetails(10, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        service.Verify(s => s.GetDemandDetailsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetDemandDetails_UnknownAsset_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetDemandDetailsAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((AssetDemandDetailsDto?)null);

        var result = await controller.GetDemandDetails(999, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<object>>(Assert.IsType<NotFoundObjectResult>(result).Value);
        Assert.False(body.Success);
    }

    private static CreateBillPaymentDto PaymentRequest(string paymentMode) => new()
    {
        PaymentType = "Full",
        PaymentMode = paymentMode,
        PaymentDate = new DateTime(2026, 9, 30),
        PayerMobile = "9876543210",
        PaidAmount = 18000m
    };

    [Fact]
    public void Pay_IsPostOnLeaseId()
    {
        var method = typeof(AssetCounterPaymentController).GetMethod(nameof(AssetCounterPaymentController.Pay))!;

        Assert.Equal("{leaseId:int}", method.GetCustomAttribute<HttpPostAttribute>()!.Template);
    }

    [Fact]
    public void UpdateChequeStatus_IsPatchOnChequeTransactionStatus()
    {
        var method = typeof(AssetCounterPaymentController).GetMethod(nameof(AssetCounterPaymentController.UpdateChequeStatus))!;

        Assert.Equal("{leaseId:int}/cheque-transactions/{chequeTransactionId:int}/status",
            method.GetCustomAttribute<HttpPatchAttribute>()!.Template);
    }

    [Theory]
    [InlineData("Cash")]
    [InlineData("UPI")]
    [InlineData("NEFT")]
    public async Task Pay_NonChequeMode_PostsImmediately_AndReturnsReceipt(string paymentMode)
    {
        var controller = Create(out _, out _, out var billing, currentUserId: 42);
        var dto = PaymentRequest(paymentMode);
        var receipt = new BillReceiptDto { TransactionId = 812, TransactionNo = "TXN-2026-000812" };
        billing.Setup(s => s.ProcessPaymentAsync(7, dto, 42, It.IsAny<CancellationToken>())).ReturnsAsync(receipt);

        var result = await controller.Pay(7, dto, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<BillReceiptDto>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Equal("Payment processed successfully", body.Message);
        Assert.Same(receipt, body.Items);
        billing.Verify(s => s.ProcessChequePaymentAsync(It.IsAny<int>(), It.IsAny<CreateBillPaymentDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Pay_Cheque_IsStaged_AndReturnsAcknowledgement()
    {
        var controller = Create(out _, out _, out var billing, currentUserId: 42);
        var dto = PaymentRequest("Cheque");
        var acknowledgement = new ChequeAcknowledgementDto { Id = 57, AcknowledgementNo = "CHQ-2026-000057", Status = "Received" };
        billing.Setup(s => s.ProcessChequePaymentAsync(7, dto, 42, It.IsAny<CancellationToken>())).ReturnsAsync(acknowledgement);

        var result = await controller.Pay(7, dto, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<ChequeAcknowledgementDto>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Equal("Cheque received; pending clearance", body.Message);
        Assert.Same(acknowledgement, body.Items);
        billing.Verify(s => s.ProcessPaymentAsync(It.IsAny<int>(), It.IsAny<CreateBillPaymentDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Pay_WithoutUserClaim_ThrowsUnauthorized()
    {
        var controller = Create(out _, out _, out var billing, currentUserId: null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => controller.Pay(7, PaymentRequest("Cash"), CancellationToken.None));
        billing.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Pay_ChecksLeaseAccessForCurrentUser()
    {
        var controller = Create(out _, out var leaseService, out _, currentUserId: 42);

        await controller.Pay(7, PaymentRequest("Cash"), CancellationToken.None);

        leaseService.Verify(s => s.CanUserAccessLeaseAsync(7, 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("Cash")]
    [InlineData("Cheque")]
    public async Task Pay_LeaseOutsideCallersDepartments_ReturnsForbid_AndPostsNothing(string paymentMode)
    {
        var controller = Create(out _, out var leaseService, out var billing, currentUserId: 42);
        leaseService.Setup(s => s.CanUserAccessLeaseAsync(7, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.Pay(7, PaymentRequest(paymentMode), CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        billing.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateChequeStatus_PassesCurrentUserToService_AndReturnsSuccess()
    {
        var controller = Create(out _, out var leaseService, out var billing, currentUserId: 42);
        var dto = new UpdateChequeStatusDto { Status = "Bounced", Reason = "Insufficient funds" };

        var result = await controller.UpdateChequeStatus(7, 57, dto, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<object>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Equal("Cheque status updated successfully", body.Message);
        leaseService.Verify(s => s.CanUserAccessLeaseAsync(7, 42, It.IsAny<CancellationToken>()), Times.Once);
        billing.Verify(s => s.UpdateChequeStatusAsync(7, 57, dto, 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateChequeStatus_LeaseOutsideCallersDepartments_ReturnsForbid_AndChangesNothing()
    {
        var controller = Create(out _, out var leaseService, out var billing, currentUserId: 42);
        leaseService.Setup(s => s.CanUserAccessLeaseAsync(7, 42, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await controller.UpdateChequeStatus(7, 57, new UpdateChequeStatusDto { Status = "Cleared" }, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        billing.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateChequeStatus_WithoutUserClaim_ThrowsUnauthorized()
    {
        var controller = Create(out _, out _, out var billing, currentUserId: null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => controller.UpdateChequeStatus(7, 57, new UpdateChequeStatusDto { Status = "Deposited" }, CancellationToken.None));
        billing.VerifyNoOtherCalls();
    }

    [Fact]
    public void GetReceiptByUuid_IsGetOnAbsoluteLeaseRentBillRoute()
    {
        var method = typeof(AssetCounterPaymentController).GetMethod(nameof(AssetCounterPaymentController.GetReceiptByUuid))!;

        Assert.Equal("/api/LeaseRentBill/receipt/uuid/{uuid}", method.GetCustomAttribute<HttpGetAttribute>()!.Template);
    }

    [Fact]
    public async Task GetReceiptByUuid_Found_ReturnsOkWithReceipt()
    {
        var controller = Create(out var service);
        var uuid = Guid.NewGuid();
        var receipt = new LeaseRentReceiptDto { Uuid = uuid, ReceiptNo = "RCPT-2026-000001" };
        service.Setup(s => s.GetReceiptByUuidAsync(uuid, It.IsAny<CancellationToken>())).ReturnsAsync(receipt);

        var result = await controller.GetReceiptByUuid(uuid.ToString(), CancellationToken.None);

        var body = Assert.IsType<ApiResponse<LeaseRentReceiptDto>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.True(body.Success);
        Assert.Equal("Receipt retrieved successfully", body.Message);
        Assert.Same(receipt, body.Items);
    }

    [Fact]
    public async Task GetReceiptByUuid_Unknown_ReturnsNotFound()
    {
        var controller = Create(out var service);
        service.Setup(s => s.GetReceiptByUuidAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((LeaseRentReceiptDto?)null);

        var result = await controller.GetReceiptByUuid(Guid.NewGuid().ToString(), CancellationToken.None);

        var body = Assert.IsType<ApiResponse<object>>(Assert.IsType<NotFoundObjectResult>(result).Value);
        Assert.False(body.Success);
        Assert.Equal("Payment_Receipt_NotFound", body.Message);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("")]
    public async Task GetReceiptByUuid_InvalidGuid_ReturnsBadRequest(string uuid)
    {
        var controller = Create(out var service);

        var result = await controller.GetReceiptByUuid(uuid, CancellationToken.None);

        var body = Assert.IsType<ApiResponse<object>>(Assert.IsType<BadRequestObjectResult>(result).Value);
        Assert.False(body.Success);
        Assert.Equal("Payment_Receipt_Uuid_Invalid", body.Message);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetReceiptByUuid_DoesNotRequireAUserClaim()
    {
        var controller = Create(out var service, currentUserId: null);
        service.Setup(s => s.GetReceiptByUuidAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaseRentReceiptDto());

        var result = await controller.GetReceiptByUuid(Guid.NewGuid().ToString(), CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }
}
