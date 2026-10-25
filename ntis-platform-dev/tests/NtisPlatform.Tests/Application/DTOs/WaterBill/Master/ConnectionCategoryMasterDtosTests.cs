using System.ComponentModel.DataAnnotations;
using AutoMapper;
using FluentAssertions;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Master;

public class ConnectionCategoryMasterDtosTests
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

    #region CreateConnectionCategoryMasterDto Validation Tests

    [Fact]
    public void CreateConnectionCategoryMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 1,
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Standard quarterly metered billing",
            IsActive = true,
            CreatedBy = 1
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_MissingConnectionCategoryCode_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = string.Empty,
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.ConnectionCategoryCode)));
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_ConnectionCategoryCode_Exceeds30Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = new string('A', 31),
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.ConnectionCategoryCode)));
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_MissingConnectionCategory_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = string.Empty,
            BillingMethod = "Metered"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.ConnectionCategory)));
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_ConnectionCategory_Exceeds150Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = new string('A', 151),
            BillingMethod = "Metered"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.ConnectionCategory)));
    }

    [Theory]
    [InlineData("Metered", true)]
    [InlineData("Flat", false)]
    [InlineData("Slab", true)]
    [InlineData("Annual", false)]
    [InlineData("Fixed", false)]
    [InlineData("Hybrid", true)]
    [InlineData("Telescopic", true)]
    public void CreateConnectionCategoryMasterDto_ValidBillingMethod_PassesValidation(string method, bool isMetered)
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "TEST",
            ConnectionCategory = "Test Category",
            IsMetered = isMetered,
            BillingMethod = method
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData("Metered", false)]
    [InlineData("Slab", false)]
    [InlineData("Telescopic", false)]
    [InlineData("Hybrid", false)]
    [InlineData("Flat", true)]
    [InlineData("Fixed", true)]
    [InlineData("Annual", true)]
    public void CreateConnectionCategoryMasterDto_InconsistentIsMeteredAndBillingMethod_FailsValidation(string method, bool isMetered)
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "TEST",
            ConnectionCategory = "Test Category",
            IsMetered = isMetered,
            BillingMethod = method
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.BillingMethod)));
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_InvalidBillingMethod_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "TEST",
            ConnectionCategory = "Test Category",
            BillingMethod = "UnknownMethod"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.BillingMethod)));
    }

    [Fact]
    public void CreateConnectionCategoryMasterDto_Description_Exceeds300Chars_FailsValidation()
    {
        // Arrange
        var dto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered",
            Description = new string('A', 301)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(CreateConnectionCategoryMasterDto.Description)));
    }

    #endregion

    #region UpdateConnectionCategoryMasterDto Validation Tests

    [Fact]
    public void UpdateConnectionCategoryMasterDto_ValidData_PassesValidation()
    {
        // Arrange
        var dto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered Updated",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Updated description",
            IsActive = true,
            UpdatedBy = 2
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateConnectionCategoryMasterDto_MissingConnectionCategoryCode_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = string.Empty,
            ConnectionCategory = "Regular Metered",
            BillingMethod = "Metered"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionCategoryMasterDto.ConnectionCategoryCode)));
    }

    [Fact]
    public void UpdateConnectionCategoryMasterDto_InvalidBillingMethod_FailsValidation()
    {
        // Arrange
        var dto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingMethod = "InvalidMethod"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionCategoryMasterDto.BillingMethod)));
    }

    [Theory]
    [InlineData("Metered", false)]
    [InlineData("Slab", false)]
    [InlineData("Telescopic", false)]
    [InlineData("Hybrid", false)]
    [InlineData("Flat", true)]
    [InlineData("Fixed", true)]
    [InlineData("Annual", true)]
    public void UpdateConnectionCategoryMasterDto_InconsistentIsMeteredAndBillingMethod_FailsValidation(string method, bool isMetered)
    {
        // Arrange
        var dto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            IsMetered = isMetered,
            BillingMethod = method
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.MemberNames.Contains(nameof(UpdateConnectionCategoryMasterDto.BillingMethod)));
    }

    #endregion

    #region QueryParameters Tests

    [Fact]
    public void ConnectionCategoryMasterQueryParameters_GetSet_WorksCorrectly()
    {
        // Arrange & Act
        var queryParams = new ConnectionCategoryMasterQueryParameters
        {
            Id = 1,
            ConnectionCategoryCode = "REG",
            ConnectionCategory = "Regular",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Metered",
            IsActive = true,
            PageNumber = 1,
            PageSize = 10
        };

        // Assert
        queryParams.Id.Should().Be(1);
        queryParams.ConnectionCategoryCode.Should().Be("REG");
        queryParams.ConnectionCategory.Should().Be("Regular");
        queryParams.BillingFrequencyId.Should().Be(2);
        queryParams.IsMetered.Should().BeTrue();
        queryParams.BillingMethod.Should().Be("Metered");
        queryParams.IsActive.Should().BeTrue();
        queryParams.PageNumber.Should().Be(1);
        queryParams.PageSize.Should().Be(10);
    }

    #endregion

    #region AutoMapper Tests

    [Fact]
    public void AutoMapper_Entity_To_Dto_MapsCorrectly_WithBillingFrequency()
    {
        // Arrange
        var mapper = CreateMapper();
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 1,
            ConnectionCategoryCode = "REGULAR",
            ConnectionCategory = "Regular Metered",
            BillingFrequencyId = 2,
            BillingFrequency = new BillingFrequencyMasterEntity
            {
                Id = 2,
                BillingFrequencyCode = "QUARTERLY",
                BillingFrequency = "Quarterly"
            },
            IsMetered = true,
            BillingMethod = "Metered",
            Description = "Quarterly regular metered",
            IsActive = true,
            CreatedBy = 10,
            CreatedDate = DateTime.UtcNow,
            UpdatedBy = 20,
            UpdatedDate = DateTime.UtcNow
        };

        // Act
        var dto = mapper.Map<ConnectionCategoryMasterDto>(entity);

        // Assert
        dto.Should().NotBeNull();
        dto.Id.Should().Be(entity.Id);
        dto.ConnectionCategoryCode.Should().Be(entity.ConnectionCategoryCode);
        dto.ConnectionCategory.Should().Be(entity.ConnectionCategory);
        dto.BillingFrequencyId.Should().Be(2);
        dto.BillingFrequencyCode.Should().Be("QUARTERLY");
        dto.BillingFrequency.Should().Be("Quarterly");
        dto.IsMetered.Should().BeTrue();
        dto.BillingMethod.Should().Be("Metered");
        dto.Description.Should().Be(entity.Description);
        dto.IsActive.Should().BeTrue();
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
        var createDto = new CreateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "FLAT",
            ConnectionCategory = "Flat Rate",
            BillingFrequencyId = 4,
            IsMetered = false,
            BillingMethod = "Flat",
            Description = "Flat non-metered rate",
            IsActive = true,
            CreatedBy = 5
        };

        // Act
        var entity = mapper.Map<ConnectionCategoryMasterEntity>(createDto);

        // Assert
        entity.Should().NotBeNull();
        entity.Id.Should().Be(0); // Ignored by mapping
        entity.ConnectionCategoryCode.Should().Be("FLAT");
        entity.ConnectionCategory.Should().Be("Flat Rate");
        entity.BillingFrequencyId.Should().Be(4);
        entity.IsMetered.Should().BeFalse();
        entity.BillingMethod.Should().Be("Flat");
        entity.Description.Should().Be("Flat non-metered rate");
        entity.IsActive.Should().BeTrue();
        entity.CreatedBy.Should().Be(5);
    }

    [Fact]
    public void AutoMapper_UpdateDto_To_Entity_MapsCorrectly()
    {
        // Arrange
        var mapper = CreateMapper();
        var updateDto = new UpdateConnectionCategoryMasterDto
        {
            ConnectionCategoryCode = "SLAB",
            ConnectionCategory = "Slab Metered Updated",
            BillingFrequencyId = 2,
            IsMetered = true,
            BillingMethod = "Slab",
            Description = "Updated slab description",
            IsActive = false,
            UpdatedBy = 99
        };
        var entity = new ConnectionCategoryMasterEntity
        {
            Id = 10,
            ConnectionCategoryCode = "OLD",
            ConnectionCategory = "Old Category",
            BillingFrequencyId = 1,
            IsMetered = false,
            BillingMethod = "Flat",
            Description = "Old desc",
            IsActive = true,
            CreatedBy = 1
        };

        // Act
        mapper.Map(updateDto, entity);

        // Assert
        entity.Id.Should().Be(10); // Untouched
        entity.CreatedBy.Should().Be(1); // Untouched
        entity.ConnectionCategoryCode.Should().Be("SLAB");
        entity.ConnectionCategory.Should().Be("Slab Metered Updated");
        entity.BillingFrequencyId.Should().Be(2);
        entity.IsMetered.Should().BeTrue();
        entity.BillingMethod.Should().Be("Slab");
        entity.Description.Should().Be("Updated slab description");
        entity.IsActive.Should().BeFalse();
        entity.UpdatedBy.Should().Be(99);
    }

    #endregion
}
