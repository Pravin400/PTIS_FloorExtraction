using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Master;

public class TapSizeMasterDtosTests
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

    #region CreateTapSizeMasterDto Validation Tests

    [Fact]
    public void CreateTapSizeMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true,
            CreatedBy = 1
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTapSizeMasterDto_AllowsNull_NominalSizeValueAndSizeUnit()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "CUSTOM",
            TapSize = "Custom Pipe",
            NominalSizeValue = null,
            SizeUnit = null
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateTapSizeMasterDto_MissingTapSizeCode_FailsValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = string.Empty,
            TapSize = "1/2\""
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTapSizeMasterDto.TapSizeCode)));
    }

    [Fact]
    public void CreateTapSizeMasterDto_TapSizeCode_Exceeds30Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = new string('X', 31),
            TapSize = "1/2\""
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTapSizeMasterDto.TapSizeCode)));
    }

    [Fact]
    public void CreateTapSizeMasterDto_MissingTapSize_FailsValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.5IN",
            TapSize = string.Empty
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTapSizeMasterDto.TapSize)));
    }

    [Fact]
    public void CreateTapSizeMasterDto_TapSize_Exceeds100Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.5IN",
            TapSize = new string('T', 101)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTapSizeMasterDto.TapSize)));
    }

    [Fact]
    public void CreateTapSizeMasterDto_SizeUnit_Exceeds20Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            SizeUnit = new string('U', 21)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateTapSizeMasterDto.SizeUnit)));
    }

    #endregion

    #region UpdateTapSizeMasterDto Validation Tests

    [Fact]
    public void UpdateTapSizeMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "0.75IN",
            TapSize = "3/4\"",
            NominalSizeValue = 0.750m,
            SizeUnit = "inch",
            IsActive = true,
            UpdatedBy = 2
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateTapSizeMasterDto_MissingTapSizeCode_FailsValidation()
    {
        // Arrange
        var dto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = string.Empty,
            TapSize = "3/4\""
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTapSizeMasterDto.TapSizeCode)));
    }

    [Fact]
    public void UpdateTapSizeMasterDto_TapSizeCode_Exceeds30Chars_FailsValidation()
    {
        // Arrange
        var dto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = new string('Z', 31),
            TapSize = "3/4\""
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTapSizeMasterDto.TapSizeCode)));
    }

    [Fact]
    public void UpdateTapSizeMasterDto_MissingTapSize_FailsValidation()
    {
        // Arrange
        var dto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "0.75IN",
            TapSize = string.Empty
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTapSizeMasterDto.TapSize)));
    }

    [Fact]
    public void UpdateTapSizeMasterDto_SizeUnit_Exceeds20Chars_FailsValidation()
    {
        // Arrange
        var dto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "0.75IN",
            TapSize = "3/4\"",
            SizeUnit = new string('U', 21)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateTapSizeMasterDto.SizeUnit)));
    }

    #endregion

    #region QueryParameters Tests

    [Fact]
    public void TapSizeMasterQueryParameters_GetSet_WorksCorrectly()
    {
        // Arrange & Act
        var queryParams = new TapSizeMasterQueryParameters
        {
            Id = 3,
            TapSizeCode = "1IN",
            TapSize = "1\"",
            IsActive = true,
            PageNumber = 1,
            PageSize = 10
        };

        // Assert
        queryParams.Id.Should().Be(3);
        queryParams.TapSizeCode.Should().Be("1IN");
        queryParams.TapSize.Should().Be("1\"");
        queryParams.IsActive.Should().BeTrue();
        queryParams.PageNumber.Should().Be(1);
        queryParams.PageSize.Should().Be(10);
    }

    #endregion

    #region AutoMapper Tests

    [Fact]
    public void AutoMapper_Entity_To_Dto_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var entity = new TapSizeMasterEntity
        {
            Id = 1,
            TapSizeCode = "0.5IN",
            TapSize = "1/2\"",
            NominalSizeValue = 0.500m,
            SizeUnit = "inch",
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = DateTime.UtcNow,
            UpdatedBy = 20,
            UpdatedDate = DateTime.UtcNow
        };

        // Act
        var dto = mapper.Map<TapSizeMasterDto>(entity);

        // Assert
        dto.Should().NotBeNull();
        dto.Id.Should().Be(entity.Id);
        dto.TapSizeCode.Should().Be(entity.TapSizeCode);
        dto.TapSize.Should().Be(entity.TapSize);
        dto.NominalSizeValue.Should().Be(entity.NominalSizeValue);
        dto.SizeUnit.Should().Be(entity.SizeUnit);
        dto.IsActive.Should().Be(entity.IsActive);
        dto.CreatedBy.Should().Be(entity.CreatedBy);
        dto.CreatedDate.Should().Be(entity.CreatedDate);
        dto.UpdatedBy.Should().Be(entity.UpdatedBy);
        dto.UpdatedDate.Should().Be(entity.UpdatedDate);
    }

    [Fact]
    public void AutoMapper_CreateDto_To_Entity_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var createDto = new CreateTapSizeMasterDto
        {
            TapSizeCode = "1.5IN",
            TapSize = "1 1/2\"",
            NominalSizeValue = 1.500m,
            SizeUnit = "inch",
            IsActive = true,
            CreatedBy = 7
        };

        // Act
        var entity = mapper.Map<TapSizeMasterEntity>(createDto);

        // Assert
        entity.Should().NotBeNull();
        entity.Id.Should().Be(0); // Ignored by mapping
        entity.TapSizeCode.Should().Be("1.5IN");
        entity.TapSize.Should().Be("1 1/2\"");
        entity.NominalSizeValue.Should().Be(1.500m);
        entity.SizeUnit.Should().Be("inch");
        entity.IsActive.Should().BeTrue();
        entity.CreatedBy.Should().Be(7);
    }

    [Fact]
    public void AutoMapper_UpdateDto_To_Entity_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var updateDto = new UpdateTapSizeMasterDto
        {
            TapSizeCode = "2IN",
            TapSize = "2\"",
            NominalSizeValue = 2.000m,
            SizeUnit = "inch",
            IsActive = false,
            UpdatedBy = 88
        };
        var entity = new TapSizeMasterEntity
        {
            Id = 5,
            TapSizeCode = "OLD",
            TapSize = "Old size",
            NominalSizeValue = 1.000m,
            SizeUnit = "mm",
            IsActive = true,
            CreatedBy = 2
        };

        // Act
        mapper.Map(updateDto, entity);

        // Assert
        entity.Id.Should().Be(5); // Untouched
        entity.CreatedBy.Should().Be(2); // Untouched
        entity.TapSizeCode.Should().Be("2IN");
        entity.TapSize.Should().Be("2\"");
        entity.NominalSizeValue.Should().Be(2.000m);
        entity.SizeUnit.Should().Be("inch");
        entity.IsActive.Should().BeFalse();
        entity.UpdatedBy.Should().Be(88);
    }

    #endregion
}
