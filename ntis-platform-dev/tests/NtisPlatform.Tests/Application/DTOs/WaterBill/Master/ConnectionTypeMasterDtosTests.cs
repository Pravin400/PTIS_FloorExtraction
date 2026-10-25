using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Master;

public class ConnectionTypeMasterDtosTests
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

    #region CreateConnectionTypeMasterDto Validation Tests

    [Fact]
    public void CreateConnectionTypeMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Domestic connection",
            IsActive = true,
            CreatedBy = 1
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateConnectionTypeMasterDto_MissingConnectionTypeCode_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = string.Empty,
            ConnectionType = "Residential"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionTypeMasterDto.ConnectionTypeCode)));
    }

    [Fact]
    public void CreateConnectionTypeMasterDto_ConnectionTypeCode_Exceeds30Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = new string('A', 31),
            ConnectionType = "Residential"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionTypeMasterDto.ConnectionTypeCode)));
    }

    [Fact]
    public void CreateConnectionTypeMasterDto_MissingConnectionType_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "RES",
            ConnectionType = string.Empty
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionTypeMasterDto.ConnectionType)));
    }

    [Fact]
    public void CreateConnectionTypeMasterDto_ConnectionType_Exceeds100Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "RES",
            ConnectionType = new string('A', 101)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionTypeMasterDto.ConnectionType)));
    }

    [Fact]
    public void CreateConnectionTypeMasterDto_Description_Exceeds300Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = new string('A', 301)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionTypeMasterDto.Description)));
    }

    #endregion

    #region UpdateConnectionTypeMasterDto Validation Tests

    [Fact]
    public void UpdateConnectionTypeMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial",
            Description = "Commercial connection",
            IsActive = true,
            UpdatedBy = 2
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateConnectionTypeMasterDto_MissingConnectionTypeCode_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = string.Empty,
            ConnectionType = "Commercial"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionTypeMasterDto.ConnectionTypeCode)));
    }

    [Fact]
    public void UpdateConnectionTypeMasterDto_ConnectionTypeCode_Exceeds30Chars_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = new string('B', 31),
            ConnectionType = "Commercial"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionTypeMasterDto.ConnectionTypeCode)));
    }

    [Fact]
    public void UpdateConnectionTypeMasterDto_MissingConnectionType_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "COM",
            ConnectionType = string.Empty
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionTypeMasterDto.ConnectionType)));
    }

    [Fact]
    public void UpdateConnectionTypeMasterDto_Description_Exceeds300Chars_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "COM",
            ConnectionType = "Commercial",
            Description = new string('D', 301)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionTypeMasterDto.Description)));
    }

    #endregion

    #region QueryParameters Tests

    [Fact]
    public void ConnectionTypeMasterQueryParameters_GetSet_WorksCorrectly()
    {
        // Arrange & Act
        var queryParams = new ConnectionTypeMasterQueryParameters
        {
            Id = 5,
            ConnectionTypeCode = "IND",
            ConnectionType = "Industrial",
            IsActive = true,
            PageNumber = 2,
            PageSize = 25
        };

        // Assert
        queryParams.Id.Should().Be(5);
        queryParams.ConnectionTypeCode.Should().Be("IND");
        queryParams.ConnectionType.Should().Be("Industrial");
        queryParams.IsActive.Should().BeTrue();
        queryParams.PageNumber.Should().Be(2);
        queryParams.PageSize.Should().Be(25);
    }

    #endregion

    #region AutoMapper Tests

    [Fact]
    public void AutoMapper_Entity_To_Dto_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var entity = new ConnectionTypeMasterEntity
        {
            Id = 1,
            ConnectionTypeCode = "RES",
            ConnectionType = "Residential",
            Description = "Domestic water connection",
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = DateTime.UtcNow,
            UpdatedBy = 20,
            UpdatedDate = DateTime.UtcNow
        };

        // Act
        var dto = mapper.Map<ConnectionTypeMasterDto>(entity);

        // Assert
        dto.Should().NotBeNull();
        dto.Id.Should().Be(entity.Id);
        dto.ConnectionTypeCode.Should().Be(entity.ConnectionTypeCode);
        dto.ConnectionType.Should().Be(entity.ConnectionType);
        dto.Description.Should().Be(entity.Description);
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
        var createDto = new CreateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "GOV",
            ConnectionType = "Government",
            Description = "Government and public office",
            IsActive = true,
            CreatedBy = 5
        };

        // Act
        var entity = mapper.Map<ConnectionTypeMasterEntity>(createDto);

        // Assert
        entity.Should().NotBeNull();
        entity.Id.Should().Be(0); // Ignored by mapping
        entity.ConnectionTypeCode.Should().Be("GOV");
        entity.ConnectionType.Should().Be("Government");
        entity.Description.Should().Be("Government and public office");
        entity.IsActive.Should().BeTrue();
        entity.CreatedBy.Should().Be(5);
    }

    [Fact]
    public void AutoMapper_UpdateDto_To_Entity_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var updateDto = new UpdateConnectionTypeMasterDto
        {
            ConnectionTypeCode = "INST",
            ConnectionType = "Institutional",
            Description = "Educational/health water connection",
            IsActive = false,
            UpdatedBy = 99
        };
        var entity = new ConnectionTypeMasterEntity
        {
            Id = 10,
            ConnectionTypeCode = "OLD",
            ConnectionType = "Old",
            Description = "Old desc",
            IsActive = true,
            CreatedBy = 1
        };

        // Act
        mapper.Map(updateDto, entity);

        // Assert
        entity.Id.Should().Be(10); // Untouched
        entity.CreatedBy.Should().Be(1); // Untouched
        entity.ConnectionTypeCode.Should().Be("INST");
        entity.ConnectionType.Should().Be("Institutional");
        entity.Description.Should().Be("Educational/health water connection");
        entity.IsActive.Should().BeFalse();
        entity.UpdatedBy.Should().Be(99);
    }

    #endregion
}
