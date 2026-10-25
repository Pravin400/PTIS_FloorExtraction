using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master;

public class TariffChargeDetailDtosTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model);
        Validator.TryValidateObject(model, validationContext, validationResults, validateAllProperties: true);
        return validationResults;
    }

    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<WaterBillMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    #region CreateTariffChargeDetailDto Validation Tests

    [Fact]
    public void CreateTariffChargeDetailDto_ValidData_PassesValidation()
    {
        var dto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            IsDynamic = false,
            IsMandatory = true,
            SequenceNo = 1,
            IsActive = true,
            CreatedBy = 1
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTariffChargeDetailDto_AmountIsNegative_FailsValidation()
    {
        var dto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = -10.0m,
            SequenceNo = 1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTariffChargeDetailDto.Amount)));
    }

    [Fact]
    public void CreateTariffChargeDetailDto_SequenceNoIsNegative_FailsValidation()
    {
        var dto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = -1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTariffChargeDetailDto.SequenceNo)));
    }

    [Fact]
    public void CreateTariffChargeDetailDto_OmittedSequenceNo_DefaultsToNull()
    {
        var dto = new CreateTariffChargeDetailDto();
        dto.SequenceNo.Should().BeNull();
    }

    [Fact]
    public void CreateTariffChargeDetailDto_OmittedSequenceNo_PassesValidation()
    {
        var dto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m
            // SequenceNo omitted
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTariffChargeDetailDto_ExplicitZeroSequenceNo_PassesValidation()
    {
        var dto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 0
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    #endregion

    #region UpdateTariffChargeDetailDto Validation Tests

    [Fact]
    public void UpdateTariffChargeDetailDto_ValidData_PassesValidation()
    {
        var dto = new UpdateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            IsDynamic = false,
            IsMandatory = true,
            SequenceNo = 1,
            IsActive = true,
            UpdatedBy = 2
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateTariffChargeDetailDto_AmountIsNegative_FailsValidation()
    {
        var dto = new UpdateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = -10.0m,
            SequenceNo = 1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTariffChargeDetailDto.Amount)));
    }

    #endregion

    #region AutoMapper Tests

    [Fact]
    public void AutoMapper_Entity_To_Dto_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var entity = new TariffChargeDetailEntity
        {
            Id = 1,
            TariffId = 1,
            Tariff = new TariffMasterEntity { Id = 1, TariffName = "Test Tariff" },
            ChargeHeadId = 2,
            ChargeHead = new ChargeHeadMasterEntity { Id = 2, Name = "Test Charge Head" },
            GeographyUnitId = 3,
            GeographyUnit = new GeographyUnitEntity { Id = 3, GeographyUnitName = "Test Geo" },
            Amount = 500.0m,
            IsDynamic = false,
            IsMandatory = true,
            SequenceNo = 1,
            IsActive = true
        };

        var dto = mapper.Map<TariffChargeDetailDto>(entity);

        dto.Id.Should().Be(entity.Id);
        dto.TariffName.Should().Be("Test Tariff");
        dto.ChargeHeadName.Should().Be("Test Charge Head");
        dto.GeographyUnitName.Should().Be("Test Geo");
        dto.Amount.Should().Be(500.0m);
    }

    [Fact]
    public void AutoMapper_CreateDto_To_Entity_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            IsDynamic = false,
            IsMandatory = true,
            SequenceNo = 1,
            IsActive = true,
            CreatedBy = 5
        };

        var entity = mapper.Map<TariffChargeDetailEntity>(createDto);

        entity.Id.Should().Be(0);
        entity.TariffId.Should().Be(1);
        entity.ChargeHeadId.Should().Be(2);
        entity.GeographyUnitId.Should().Be(3);
        entity.Amount.Should().Be(500.0m);
    }

    [Fact]
    public void AutoMapper_UpdateDto_To_Entity_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var updateDto = new UpdateTariffChargeDetailDto
        {
            TariffId = 1,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 600.0m,
            IsDynamic = true,
            IsMandatory = false,
            SequenceNo = 2,
            IsActive = false,
            UpdatedBy = 99
        };
        var entity = new TariffChargeDetailEntity
        {
            Id = 10,
            TariffId = 2,
            ChargeHeadId = 3,
            GeographyUnitId = 4,
            Amount = 100.0m
        };

        mapper.Map(updateDto, entity);

        entity.Id.Should().Be(10);
        entity.TariffId.Should().Be(1);
        entity.ChargeHeadId.Should().Be(2);
        entity.GeographyUnitId.Should().Be(3);
        entity.Amount.Should().Be(600.0m);
        entity.IsActive.Should().BeFalse();
        entity.UpdatedBy.Should().Be(99);
    }

    #endregion
}
