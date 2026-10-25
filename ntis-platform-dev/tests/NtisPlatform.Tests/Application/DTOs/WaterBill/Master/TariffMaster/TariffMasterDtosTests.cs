using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.TariffMaster;

public class TariffMasterDtosTests
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

    public TariffMasterDtosTests()
    {
        _mapper = CreateMapper();
    }

    [Fact]
    public void CreateTariffMasterDto_ValidData_PassesValidation()
    {
        var dto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Tariff",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTariffMasterDto_MissingTariffCode_FailsValidation()
    {
        var dto = new CreateTariffMasterDto
        {
            TariffCode = "",
            TariffName = "Residential Tariff",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTariffMasterDto.TariffCode)));
    }

    [Fact]
    public void CreateTariffMasterDto_TariffCode_Exceeds60Chars_FailsValidation()
    {
        var dto = new CreateTariffMasterDto
        {
            TariffCode = new string('A', 61),
            TariffName = "Residential Tariff",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTariffMasterDto.TariffCode)));
    }

    [Fact]
    public void UpdateTariffMasterDto_ValidData_PassesValidation()
    {
        var dto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Updated Tariff",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Fact]
    public void TariffMasterMapping_EntityToDto_MapsCorrectly()
    {
        var entity = new TariffMasterEntity
        {
            Id = 10,
            TariffCode = "TRF01",
            TariffName = "Standard",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true,
            Year = new YearMasterEntity { YearCode = "FY2025" }
        };

        var dto = _mapper.Map<TariffMasterDto>(entity);

        dto.Id.Should().Be(10);
        dto.TariffCode.Should().Be("TRF01");
        dto.FinancialYearId.Should().Be(1);
        dto.FinancialYear.Should().Be("FY2025");
    }

    private static List<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, context, results, true);
        return results;
    }
}

