using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.Asset_Management.LeaseRentBill;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Asset_Management;

/// <summary>
/// Tests for the DTOs in LeaseRentBillDtos.cs: BillPaymentAllocationDto, CreateBillPaymentDto
/// (per-field rules and its IValidatableObject.Validate cross-field rules), BillReceiptLineDto,
/// BillReceiptDto, ChequeAcknowledgementDto, UpdateChequeStatusDto and BillTransactionDto.
/// Validation messages are localization keys (Payment_*).
/// </summary>
public class LeaseRentBillDtosTests
{
    #region BillPaymentAllocationDto

    [Fact]
    public void BillPaymentAllocationDto_PropertiesGetAndSetCorrectly()
    {
        var dto = new BillPaymentAllocationDto
        {
            MonthWiseDemandId = 5,
            PayAmount = 1250.50m
        };

        Assert.Equal(5, dto.MonthWiseDemandId);
        Assert.Equal(1250.50m, dto.PayAmount);
    }

    #endregion

    #region CreateBillPaymentDto - valid requests

    /// <summary>A valid Full / Cash request; tests change one thing at a time.</summary>
    private static CreateBillPaymentDto ValidRequest() => new()
    {
        PaymentType = "Full",
        PaymentMode = "Cash",
        PaymentDate = new DateTime(2026, 9, 30),
        PayerMobile = "9876543210",
        PaidAmount = 18000m
    };

    [Fact]
    public void Create_WithValidFullPayment_IsValid()
    {
        Assert.Empty(ValidateModel(ValidRequest()));
    }

    [Fact]
    public void Create_WithValidPartialPayment_IsValid()
    {
        var dto = ValidRequest();
        dto.PaymentType = "Partial";
        dto.PaymentMode = "UPI";
        dto.CustomAmount = 8000m;

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithValidMonthwiseNeftPayment_IsValid()
    {
        var dto = ValidRequest();
        dto.PaymentType = "Monthwise";
        dto.PaymentMode = "NEFT";
        dto.BankName = "SBI";
        dto.ChequeDate = new DateTime(2026, 9, 29);
        dto.ChequeOrTransactionNo = "UTR123456";
        dto.Allocations = new List<BillPaymentAllocationDto> { new() { MonthWiseDemandId = 101 }, new() { MonthWiseDemandId = 102 } };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithAdvancePaymentType_IsValid()
    {
        var dto = ValidRequest();
        dto.PaymentType = "Advance";

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithValidCheque_IsValid()
    {
        var dto = ValidRequest();
        dto.PaymentMode = "Cheque";
        dto.BankName = "HDFC";
        dto.BranchName = "Deccan";
        dto.ChequeOrTransactionNo = "004512";
        dto.ChequeDate = new DateTime(2026, 9, 28);

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithoutPayerEmail_IsValid()
    {
        var dto = ValidRequest();
        dto.PayerEmail = null;

        Assert.Empty(ValidateModel(dto));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5000)]
    public void Create_WithZeroOrNegativeAdjustment_IsValid(int adjustment)
    {
        // A negative adjustment is money drawn from the wallet.
        var dto = ValidRequest();
        dto.AdjustmentAmount = adjustment;

        Assert.Empty(ValidateModel(dto));
    }

    [Theory]
    [InlineData("0.01")]
    [InlineData("100")]
    public void Create_WithPositiveAdjustment_IsInvalid(string adjustment)
    {
        var dto = ValidRequest();
        dto.AdjustmentAmount = decimal.Parse(adjustment, System.Globalization.CultureInfo.InvariantCulture);

        AssertHasError(dto, nameof(CreateBillPaymentDto.AdjustmentAmount), "Payment_AdjustmentAmount_Invalid");
    }

    public static TheoryData<Action<CreateBillPaymentDto>, string> ThreeDecimalAmountCases => new()
    {
        { d => d.PaidAmount = 18000.005m, nameof(CreateBillPaymentDto.PaidAmount) },
        { d => { d.PaymentType = "Partial"; d.CustomAmount = 100.001m; }, nameof(CreateBillPaymentDto.CustomAmount) },
        { d => d.DiscountAmount = 0.005m, nameof(CreateBillPaymentDto.DiscountAmount) },
        { d => d.AdjustmentAmount = -0.001m, nameof(CreateBillPaymentDto.AdjustmentAmount) },
    };

    [Theory]
    [MemberData(nameof(ThreeDecimalAmountCases))]
    public void Create_WithAmountBeyondTwoDecimals_IsInvalid(Action<CreateBillPaymentDto> setAmount, string member)
    {
        var dto = ValidRequest();
        setAmount(dto);

        AssertHasError(dto, member, $"Payment_{member}_MaxDecimals_2");
    }

    [Fact]
    public void Create_WithTwoDecimalAmounts_OrTrailingZeros_IsValid()
    {
        var dto = ValidRequest();
        dto.PaidAmount = 18000.50m;
        dto.DiscountAmount = 100.500m; // scale 3, but the value has only two decimals
        dto.AdjustmentAmount = -0.01m;

        Assert.Empty(ValidateModel(dto));
    }

    [Theory]
    [InlineData("Full")]
    [InlineData("Partial")]
    public void Create_FullOrPartial_WithNullAllocations_IsValid(string paymentType)
    {
        var dto = ValidRequest();
        dto.PaymentType = paymentType;
        dto.CustomAmount = 8000m;
        dto.Allocations = null;

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_MonthwiseWithNullAllocations_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentType = "Monthwise";
        dto.Allocations = null;

        AssertHasError(dto, nameof(CreateBillPaymentDto.Allocations), "Payment_Allocations_Required");
    }

    [Theory]
    [InlineData("Full")]
    [InlineData("Partial")]
    public void Create_FullOrPartial_WithSwaggerPlaceholderAllocation_IsValid(string paymentType)
    {
        // Allocations are validated for Monthwise only, so the Swagger placeholder item can't 400 these.
        var dto = ValidRequest();
        dto.PaymentType = paymentType;
        dto.CustomAmount = 8000m;
        dto.Allocations = new List<BillPaymentAllocationDto> { new() { MonthWiseDemandId = 0, PayAmount = 0m } };

        Assert.Empty(ValidateModel(dto));
    }

    #endregion

    #region CreateBillPaymentDto - per-field rules

    [Theory]
    [InlineData("", "Payment_PaymentType_Required")]
    [InlineData("Half", "Payment_PaymentType_Invalid")]
    [InlineData("full", "Payment_PaymentType_Invalid")]
    public void Create_WithBadPaymentType_IsInvalid(string paymentType, string expectedKey)
    {
        var dto = ValidRequest();
        dto.PaymentType = paymentType;

        AssertHasError(dto, nameof(CreateBillPaymentDto.PaymentType), expectedKey);
    }

    [Theory]
    [InlineData("", "Payment_PaymentMode_Required")]
    [InlineData("Bitcoin", "Payment_PaymentMode_Invalid")]
    [InlineData("cash", "Payment_PaymentMode_Invalid")] // case-sensitive
    public void Create_WithBadPaymentMode_IsInvalid(string paymentMode, string expectedKey)
    {
        var dto = ValidRequest();
        dto.PaymentMode = paymentMode;

        AssertHasError(dto, nameof(CreateBillPaymentDto.PaymentMode), expectedKey);
    }

    [Fact]
    public void Create_WithOmittedPaymentDate_IsInvalid()
    {
        // Nullable, so an omitted date fails [Required] instead of silently becoming 0001-01-01.
        var dto = ValidRequest();
        dto.PaymentDate = null;

        AssertHasError(dto, nameof(CreateBillPaymentDto.PaymentDate), "Payment_PaymentDate_Required");
    }

    [Theory]
    [InlineData("", "Payment_PayerMobile_Required")]
    [InlineData("987654321", "Payment_PayerMobile_Invalid")]
    [InlineData("98765432101", "Payment_PayerMobile_Invalid")]
    [InlineData("98765abcde", "Payment_PayerMobile_Invalid")]
    public void Create_WithBadPayerMobile_IsInvalid(string mobile, string expectedKey)
    {
        var dto = ValidRequest();
        dto.PayerMobile = mobile;

        AssertHasError(dto, nameof(CreateBillPaymentDto.PayerMobile), expectedKey);
    }

    [Fact]
    public void Create_WithInvalidPayerEmailFormat_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PayerEmail = "not-an-email";

        AssertHasError(dto, nameof(CreateBillPaymentDto.PayerEmail), "Payment_PayerEmail_Invalid");
    }

    [Fact]
    public void Create_WithPayerEmailExceeding200Characters_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PayerEmail = new string('a', 195) + "@test.com";

        AssertHasError(dto, nameof(CreateBillPaymentDto.PayerEmail), "Payment_PayerEmail_MaxLen_200");
    }

    public static TheoryData<Action<CreateBillPaymentDto>, string, string> MaxLengthCases => new()
    {
        { d => d.BankName = new string('B', 101), nameof(CreateBillPaymentDto.BankName), "Payment_BankName_MaxLen_100" },
        { d => d.BranchName = new string('B', 101), nameof(CreateBillPaymentDto.BranchName), "Payment_BranchName_MaxLen_100" },
        { d => d.ChequeOrTransactionNo = new string('1', 101), nameof(CreateBillPaymentDto.ChequeOrTransactionNo), "Payment_ChequeOrTransactionNo_MaxLen_100" },
        { d => d.OnlineTransactionId = new string('1', 101), nameof(CreateBillPaymentDto.OnlineTransactionId), "Payment_OnlineTransactionId_MaxLen_100" },
        { d => d.PaymentGatewayName = new string('G', 101), nameof(CreateBillPaymentDto.PaymentGatewayName), "Payment_PaymentGatewayName_MaxLen_100" },
        { d => d.DDPayeeName = new string('P', 251), nameof(CreateBillPaymentDto.DDPayeeName), "Payment_DDPayeeName_MaxLen_250" },
        { d => d.Remark = new string('R', 501), nameof(CreateBillPaymentDto.Remark), "Payment_Remark_MaxLen_500" },
    };

    [Theory]
    [MemberData(nameof(MaxLengthCases))]
    public void Create_WithTooLongText_IsInvalid(Action<CreateBillPaymentDto> makeTooLong, string member, string expectedKey)
    {
        var dto = ValidRequest();
        makeTooLong(dto);

        AssertHasError(dto, member, expectedKey);
    }

    [Fact]
    public void Create_WithUnknownPaymentStatus_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentStatus = "Captured";

        AssertHasError(dto, nameof(CreateBillPaymentDto.PaymentStatus), "Payment_PaymentStatus_Invalid");
    }

    public static TheoryData<Action<CreateBillPaymentDto>, string, string> NegativeAmountCases => new()
    {
        { d => d.DiscountAmount = -1m, nameof(CreateBillPaymentDto.DiscountAmount), "Payment_DiscountAmount_Invalid" },
        { d => d.PaidAmount = -1m, nameof(CreateBillPaymentDto.PaidAmount), "Payment_PaidAmount_Invalid" },
        { d => d.CustomAmount = -1m, nameof(CreateBillPaymentDto.CustomAmount), "Payment_CustomAmount_Invalid" },
    };

    [Theory]
    [MemberData(nameof(NegativeAmountCases))]
    public void Create_WithNegativeAmount_IsInvalid(Action<CreateBillPaymentDto> makeNegative, string member, string expectedKey)
    {
        var dto = ValidRequest();
        makeNegative(dto);

        AssertHasError(dto, member, expectedKey);
    }

    #endregion

    #region CreateBillPaymentDto - cross-field rules

    [Fact]
    public void Create_WithMonthwiseAndNoAllocations_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentType = "Monthwise";
        dto.Allocations = new List<BillPaymentAllocationDto>();

        AssertHasError(dto, nameof(CreateBillPaymentDto.Allocations), "Payment_Allocations_Required");
    }

    [Fact]
    public void Create_WithMonthwiseAndInvalidAllocationDemandId_IsInvalid()
    {
        // Each allocation with MonthWiseDemandId < 1 is reported against its indexed member name.
        var dto = ValidRequest();
        dto.PaymentType = "Monthwise";
        dto.Allocations = new List<BillPaymentAllocationDto> { new() { MonthWiseDemandId = 101 }, new() { MonthWiseDemandId = 0 } };

        AssertHasError(dto, "Allocations[1].MonthWiseDemandId", "Payment_DemandId_Invalid");
    }

    [Fact]
    public void Create_WithPartialAndZeroCustomAmount_IsInvalid()
    {
        // 0 passes [Range(0, ...)], so only the cross-field rule catches it.
        var dto = ValidRequest();
        dto.PaymentType = "Partial";
        dto.CustomAmount = 0m;

        AssertHasError(dto, nameof(CreateBillPaymentDto.CustomAmount), "Payment_CustomAmount_Required");
    }

    [Fact]
    public void Create_DdWithoutPayeeName_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentMode = "DD";
        dto.BankName = "SBI";
        dto.ChequeDate = new DateTime(2026, 9, 29);

        AssertHasError(dto, nameof(CreateBillPaymentDto.DDPayeeName), "Payment_DDPayeeName_Required");
    }

    [Theory]
    [InlineData("Cheque")]
    [InlineData("DD")]
    [InlineData("NEFT")]
    [InlineData("RTGS")]
    public void Create_BankInstrumentWithoutBankOrDate_IsInvalid(string paymentMode)
    {
        var dto = ValidRequest();
        dto.PaymentMode = paymentMode;
        dto.ChequeOrTransactionNo = "004512";
        dto.DDPayeeName = "Municipal Corporation";

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateBillPaymentDto.BankName)) && r.ErrorMessage == "Payment_BankName_Required");
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateBillPaymentDto.ChequeDate)) && r.ErrorMessage == "Payment_ChequeDate_Required");
    }

    [Theory]
    [InlineData("Cash")]
    [InlineData("UPI")]
    public void Create_NonBankModeWithoutBankDetails_IsValid(string paymentMode)
    {
        var dto = ValidRequest();
        dto.PaymentMode = paymentMode;

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_ChequeWithoutNumber_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentMode = "Cheque";
        dto.BankName = "HDFC";
        dto.ChequeDate = new DateTime(2026, 9, 28);

        AssertHasError(dto, nameof(CreateBillPaymentDto.ChequeOrTransactionNo), "Payment_ChequeOrTransactionNo_Required");
    }

    [Fact]
    public void Create_OnlineWithoutGateway_IsInvalid()
    {
        var dto = ValidRequest();
        dto.PaymentMode = "Online";

        AssertHasError(dto, nameof(CreateBillPaymentDto.PaymentGatewayName), "Payment_PaymentGatewayName_Required");
    }

    [Fact]
    public void Create_CrossFieldRules_RunOnlyAfterFieldRulesPass()
    {
        // A per-field failure (bad mobile) hides the cross-field ones (missing bank details).
        var dto = ValidRequest();
        dto.PaymentMode = "NEFT";
        dto.PayerMobile = "12345";

        var results = ValidateModel(dto);

        Assert.Single(results);
        Assert.Equal("Payment_PayerMobile_Invalid", results[0].ErrorMessage);
    }

    [Fact]
    public void Create_Defaults_OptionalFieldsAreNull_AllocationsIsEmptyList()
    {
        var dto = new CreateBillPaymentDto();

        Assert.Equal("Full", dto.PaymentType);
        Assert.Equal(string.Empty, dto.PaymentMode);
        Assert.Null(dto.PaymentDate);
        Assert.Equal(string.Empty, dto.PayerMobile);
        Assert.Null(dto.PayerEmail);
        Assert.Null(dto.BankName);
        Assert.Null(dto.BranchName);
        Assert.Null(dto.ChequeOrTransactionNo);
        Assert.Null(dto.ChequeDate);
        Assert.Null(dto.OnlineTransactionId);
        Assert.Null(dto.PaymentGatewayName);
        Assert.Null(dto.DDPayeeName);
        Assert.Null(dto.PaymentStatus);
        Assert.Null(dto.Remark);
        Assert.Equal(0m, dto.DiscountAmount);
        Assert.Equal(0m, dto.AdjustmentAmount);
        Assert.Equal(0m, dto.PaidAmount);
        Assert.Equal(0m, dto.CustomAmount);
        Assert.NotNull(dto.Allocations);
        Assert.Empty(dto.Allocations);
    }

    #endregion

    #region UpdateChequeStatusDto

    [Theory]
    [InlineData("Deposited")]
    [InlineData("Cleared")]
    [InlineData("Bounced")]
    public void UpdateChequeStatus_WithForwardStatus_IsValid(string status)
    {
        Assert.Empty(ValidateModel(new UpdateChequeStatusDto { Status = status, Reason = "reason" }));
    }

    [Theory]
    [InlineData("", "Payment_ChequeStatus_Required")]
    [InlineData("Received", "Payment_ChequeStatus_Invalid")]
    [InlineData("cleared", "Payment_ChequeStatus_Invalid")]
    public void UpdateChequeStatus_WithBadStatus_IsInvalid(string status, string expectedKey)
    {
        AssertHasError(new UpdateChequeStatusDto { Status = status }, nameof(UpdateChequeStatusDto.Status), expectedKey);
    }

    [Fact]
    public void UpdateChequeStatus_WithReasonExceeding500Characters_IsInvalid()
    {
        AssertHasError(new UpdateChequeStatusDto { Status = "Bounced", Reason = new string('R', 501) },
            nameof(UpdateChequeStatusDto.Reason), "Payment_ChequeBounceReason_MaxLen_500");
    }

    #endregion

    #region BillReceiptLineDto

    [Fact]
    public void BillReceiptLineDto_PropertiesGetAndSetCorrectly()
    {
        var dto = new BillReceiptLineDto
        {
            MonthWiseDemandId = 1,
            DemandYear = 2025,
            DemandMonth = 4,
            CurrentPaidAmount = 1000m,
            BalanceAmount = 0m,
            PaymentStatus = "Paid"
        };

        Assert.Equal(1, dto.MonthWiseDemandId);
        Assert.Equal(2025, dto.DemandYear);
        Assert.Equal((byte)4, dto.DemandMonth);
        Assert.Equal(1000m, dto.CurrentPaidAmount);
        Assert.Equal(0m, dto.BalanceAmount);
        Assert.Equal("Paid", dto.PaymentStatus);
    }

    [Fact]
    public void BillReceiptLineDto_Defaults_PaymentStatusIsEmptyString()
    {
        var dto = new BillReceiptLineDto();

        Assert.Equal(string.Empty, dto.PaymentStatus);
    }

    #endregion

    #region BillReceiptDto

    [Fact]
    public void BillReceiptDto_PropertiesGetAndSetCorrectly()
    {
        var paymentDate = DateTime.Now;
        var uuid = Guid.NewGuid();
        var lines = new List<BillReceiptLineDto> { new() { MonthWiseDemandId = 1 } };
        var dto = new BillReceiptDto
        {
            TransactionId = 1,
            Uuid = uuid,
            TransactionNo = "TXN-001",
            ReceiptNo = "RCPT-001",
            PaymentType = "Full",
            PaymentDate = paymentDate,
            TotalDemandAmount = 1000m,
            DiscountAmount = 50m,
            AdjustmentAmount = 10m,
            NetPayableAmount = 960m,
            PaidAmount = 960m,
            TenantName = "John Doe",
            Lines = lines
        };

        Assert.Equal(1, dto.TransactionId);
        Assert.Equal(uuid, dto.Uuid);
        Assert.Equal("TXN-001", dto.TransactionNo);
        Assert.Equal("RCPT-001", dto.ReceiptNo);
        Assert.Equal("Full", dto.PaymentType);
        Assert.Equal(paymentDate, dto.PaymentDate);
        Assert.Equal(1000m, dto.TotalDemandAmount);
        Assert.Equal(50m, dto.DiscountAmount);
        Assert.Equal(10m, dto.AdjustmentAmount);
        Assert.Equal(960m, dto.NetPayableAmount);
        Assert.Equal(960m, dto.PaidAmount);
        Assert.Equal("John Doe", dto.TenantName);
        Assert.Same(lines, dto.Lines);
    }

    [Fact]
    public void BillReceiptDto_Defaults_LinesIsEmptyList_OptionalFieldsAreNull()
    {
        var dto = new BillReceiptDto();

        Assert.NotNull(dto.Lines);
        Assert.Empty(dto.Lines);
        Assert.Null(dto.ReceiptNo);
        Assert.Null(dto.TenantName);
        Assert.Equal(Guid.Empty, dto.Uuid);
        Assert.Equal(string.Empty, dto.TransactionNo);
        Assert.Equal(string.Empty, dto.PaymentType);
    }

    #endregion

    #region ChequeAcknowledgementDto

    [Fact]
    public void ChequeAcknowledgementDto_Defaults_StringsAreEmpty()
    {
        var dto = new ChequeAcknowledgementDto();

        Assert.Equal(string.Empty, dto.AcknowledgementNo);
        Assert.Equal(string.Empty, dto.PaymentType);
        Assert.Equal(string.Empty, dto.BankName);
        Assert.Equal(string.Empty, dto.ChequeOrTransactionNo);
        Assert.Equal(string.Empty, dto.Status);
    }

    #endregion

    #region BillTransactionDto

    [Fact]
    public void BillTransactionDto_PropertiesGetAndSetCorrectly()
    {
        var paymentDate = DateTime.Now;
        var dto = new BillTransactionDto
        {
            Id = 1,
            TransactionNo = "TXN-001",
            ReceiptNo = "RCPT-001",
            FinanceYear = 2025,
            TotalDemandAmount = 1000m,
            DiscountAmount = 50m,
            AdjustmentAmount = 10m,
            NetPayableAmount = 960m,
            PaidAmount = 960m,
            PaymentMode = "Cash",
            PaymentDate = paymentDate,
            PaymentStatus = "Success"
        };

        Assert.Equal(1, dto.Id);
        Assert.Equal("TXN-001", dto.TransactionNo);
        Assert.Equal("RCPT-001", dto.ReceiptNo);
        Assert.Equal(2025, dto.FinanceYear);
        Assert.Equal(1000m, dto.TotalDemandAmount);
        Assert.Equal(50m, dto.DiscountAmount);
        Assert.Equal(10m, dto.AdjustmentAmount);
        Assert.Equal(960m, dto.NetPayableAmount);
        Assert.Equal(960m, dto.PaidAmount);
        Assert.Equal("Cash", dto.PaymentMode);
        Assert.Equal(paymentDate, dto.PaymentDate);
        Assert.Equal("Success", dto.PaymentStatus);
    }

    [Fact]
    public void BillTransactionDto_Defaults_StringsAreEmpty_ReceiptNoIsNull()
    {
        var dto = new BillTransactionDto();

        Assert.Equal(string.Empty, dto.TransactionNo);
        Assert.Null(dto.ReceiptNo);
        Assert.Equal(string.Empty, dto.PaymentMode);
        Assert.Equal(string.Empty, dto.PaymentStatus);
    }

    #endregion

    private static void AssertHasError(object model, string member, string expectedKey)
    {
        var results = ValidateModel(model);
        Assert.Contains(results, r => r.MemberNames.Contains(member) && r.ErrorMessage == expectedKey);
    }

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
