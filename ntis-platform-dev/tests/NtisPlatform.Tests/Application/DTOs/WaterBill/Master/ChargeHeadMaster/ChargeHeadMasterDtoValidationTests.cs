using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterDtoValidationTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<WaterBillMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    private readonly IMapper _mapper;

    public ChargeHeadMasterDtoValidationTests()
    {
        _mapper = CreateMapper();
    }

    [Fact]
    public void CreateChargeHeadMasterDto_ValidData_PassesValidation()
    {
        var dto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "DEPOSIT_AMOUNT",
            ChargeHeadName = "Deposit Amount",
            ChargeHeadNameLocal = "नळ कनेक्शन अनामत",
            ChargeType = "Deposit",
            IsRefundable = true,
            SequenceNo = 1,
            Description = "Deposit fee",
            IsRegularPay = false,
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateChargeHeadMasterDto_MissingCode_FailsValidation()
    {
        var dto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "",
            ChargeHeadName = "Deposit Amount",
            ChargeType = "Deposit"
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateChargeHeadMasterDto.ChargeHeadCode)));
    }

    [Fact]
    public void ChargeHeadMasterMapping_EntityToDto_MapsCorrectly()
    {
        var entity = new ChargeHeadMasterEntity
        {
            Id = 5,
            Code = "WATER_CHARGE",
            Name = "Water Charge",
            ChargeHeadNameLocal = "पाणी शुल्क",
            ChargeType = "Charge",
            IsRefundable = false,
            SequenceNo = 60,
            Description = "Regular water charge",
            IsRegularPay = true,
            IsActive = true
        };

        var dto = _mapper.Map<ChargeHeadMasterDto>(entity);

        dto.Id.Should().Be(5);
        dto.ChargeHeadCode.Should().Be("WATER_CHARGE");
        dto.ChargeHeadName.Should().Be("Water Charge");
        dto.ChargeHeadNameLocal.Should().Be("पाणी शुल्क");
        dto.ChargeType.Should().Be("Charge");
        dto.IsRefundable.Should().BeFalse();
        dto.SequenceNo.Should().Be(60);
        dto.IsRegularPay.Should().BeTrue();
    }

    [Fact]
    public void CreateChargeHeadMasterDto_MaxBoundaries_PassesValidation()
    {
        var dto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = new string('C', 40),
            ChargeHeadName = new string('N', 150),
            ChargeType = new string('T', 30)
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateChargeHeadMasterDto_ChargeTypeOver30_FailsValidation()
    {
        var dto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Valid Name",
            ChargeType = new string('T', 31)
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateChargeHeadMasterDto.ChargeType)));
    }

    private static List<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, context, results, true);
        return results;
    }
}
