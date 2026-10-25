using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master;

public class TariffSlabDetailDtosTests
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

    #region CreateTariffSlabDetailDto Validation Tests

    [Fact]
    public void CreateTariffSlabDetailDto_ValidData_PassesValidation()
    {
        var dto = new CreateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 100.0m,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true,
            CreatedBy = 1
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTariffSlabDetailDto_FormulaCode_Exceeds50Chars_FailsValidation()
    {
        var dto = new CreateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FormulaCode = new string('A', 51)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTariffSlabDetailDto.FormulaCode)));
    }

    #endregion

    #region UpdateTariffSlabDetailDto Validation Tests

    [Fact]
    public void UpdateTariffSlabDetailDto_ValidData_PassesValidation()
    {
        var dto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0.0m,
            ToUnit = 100.0m,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true,
            UpdatedBy = 2
        };

        var results = ValidateModel(dto);
        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateTariffSlabDetailDto_FormulaCode_Exceeds50Chars_FailsValidation()
    {
        var dto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FormulaCode = new string('A', 51)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTariffSlabDetailDto.FormulaCode)));
    }

    #endregion

    #region AutoMapper Tests

    [Fact]
    public void AutoMapper_Entity_To_Dto_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var entity = new TariffSlabDetailEntity
        {
            Id = 1,
            TariffId = 1,
            Tariff = new TariffMasterEntity { Id = 1, TariffName = "Test Tariff" },
            GeographyUnitId = 2,
            GeographyUnit = new GeographyUnitEntity { Id = 2, GeographyUnitName = "Test Geo" },
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true
        };

        var dto = mapper.Map<TariffSlabDetailDto>(entity);

        dto.Id.Should().Be(entity.Id);
        dto.TariffName.Should().Be("Test Tariff");
        dto.GeographyUnitName.Should().Be("Test Geo");
        dto.UnitRate.Should().Be(15.5m);
        dto.FixedCharge.Should().Be(50.0m);
    }

    [Fact]
    public void AutoMapper_CreateDto_To_Entity_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            FixedCharge = 50.0m,
            MinimumCharge = 20.0m,
            FormulaCode = "FORMULA_1",
            SortOrder = 1,
            IsActive = true,
            CreatedBy = 5
        };

        var entity = mapper.Map<TariffSlabDetailEntity>(createDto);

        entity.Id.Should().Be(0);
        entity.TariffId.Should().Be(1);
        entity.GeographyUnitId.Should().Be(2);
        entity.UnitRate.Should().Be(15.5m);
        entity.FixedCharge.Should().Be(50.0m);
    }

    [Fact]
    public void AutoMapper_UpdateDto_To_Entity_MapsCorrectly()
    {
        var mapper = CreateMapper();
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 150,
            UnitRate = 20.5m,
            FixedCharge = 60.0m,
            MinimumCharge = 25.0m,
            FormulaCode = "FORMULA_2",
            SortOrder = 2,
            IsActive = false,
            UpdatedBy = 99
        };
        var entity = new TariffSlabDetailEntity
        {
            Id = 10,
            TariffId = 2,
            GeographyUnitId = 3,
            UnitRate = 10.0m
        };

        mapper.Map(updateDto, entity);

        entity.Id.Should().Be(10);
        entity.TariffId.Should().Be(1);
        entity.GeographyUnitId.Should().Be(2);
        entity.UnitRate.Should().Be(20.5m);
        entity.FixedCharge.Should().Be(60.0m);
        entity.IsActive.Should().BeFalse();
        entity.UpdatedBy.Should().Be(99);
    }

    #endregion
}
