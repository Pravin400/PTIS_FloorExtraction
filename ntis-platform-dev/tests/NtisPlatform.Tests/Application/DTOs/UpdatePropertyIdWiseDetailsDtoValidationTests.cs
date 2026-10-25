using FluentAssertions;
using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class UpdatePropertyIdWiseDetailsDtoValidationTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, validationResults, validateAllProperties: true);
        return validationResults;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PropertyIds validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validation_EmptyPropertyIds_ReturnsError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int>(),
            OwnerName = "Test"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "PropertyIds_MinLength_1");
    }

    [Fact]
    public void Validation_ValidPropertyIds_NoError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1, 2 },
            OwnerName = "Test"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().NotContain(r => r.ErrorMessage!.Contains("PropertyIds"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // String field max-length validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validation_OwnerTitleExceedsMaxLength_ReturnsError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTitle = new string('X', 101) // Max is 100
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "OwnerTitle_MaxLen_100");
    }

    [Fact]
    public void Validation_OwnerNameExceedsMaxLength_ReturnsError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = new string('X', 1001) // Max is 1000
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "OwnerName_MaxLen_1000");
    }

    [Fact]
    public void Validation_OccupierTitleExceedsMaxLength_ReturnsError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OccupierTitle = new string('X', 101)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "OccupierTitle_MaxLen_100");
    }

    [Fact]
    public void Validation_OccupierNameExceedsMaxLength_ReturnsError()
    {
        // Arrange
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OccupierName = new string('X', 1001)
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "OccupierName_MaxLen_1000");
    }

    [Fact]
    public void Validation_OwnerTitleEnglishExceedsMaxLength_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTitleEnglish = new string('X', 101)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OwnerTitleEnglish_MaxLen_100");
    }

    [Fact]
    public void Validation_OwnerNameEnglishExceedsMaxLength_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerNameEnglish = new string('X', 1001)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OwnerNameEnglish_MaxLen_1000");
    }

    [Fact]
    public void Validation_OccupierTitleEnglishExceedsMaxLength_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OccupierTitleEnglish = new string('X', 101)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OccupierTitleEnglish_MaxLen_100");
    }

    [Fact]
    public void Validation_OccupierNameEnglishExceedsMaxLength_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OccupierNameEnglish = new string('X', 1001)
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OccupierNameEnglish_MaxLen_1000");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // MobileNo validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validation_MobileNoExceedsMaxLength_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            MobileNo = "12345678901234" // 14 chars, max is 13
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "MobileNo_MaxLen_13");
    }

    [Fact]
    public void Validation_MobileNoInvalidFormat_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            MobileNo = "abc123" // letters not allowed
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "MobileNo_InvalidFormat");
    }

    [Theory]
    [InlineData("9876543210")]
    [InlineData("+91-9876543")]
    [InlineData("(020) 12345")]
    public void Validation_MobileNoValidFormats_NoError(string mobileNo)
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            MobileNo = mobileNo
        };

        var results = ValidateModel(dto);
        results.Should().NotContain(r => r.ErrorMessage == "MobileNo_InvalidFormat");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Numeric field range validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validation_OwnerTypeIdZero_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTypeId = 0
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OwnerTypeId_Positive");
    }

    [Fact]
    public void Validation_OwnerTypeIdNegative_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTypeId = -1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "OwnerTypeId_Positive");
    }

    [Fact]
    public void Validation_NoOfResidentialToiletsNegative_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            NoOfResidentialToilets = -1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "NoOfResidentialToilets_NonNegative");
    }

    [Fact]
    public void Validation_NoOfCommercialToiletsNegative_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            NoOfCommercialToilets = -1
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "NoOfCommercialToilets_NonNegative");
    }

    [Fact]
    public void Validation_PhotoTypeIdZero_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 0
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "PhotoTypeId_Positive");
    }

    [Fact]
    public void Validation_DocumentBindingIdZero_ReturnsError()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            DocumentBindingId = 0
        };

        var results = ValidateModel(dto);
        results.Should().Contain(r => r.ErrorMessage == "DocumentBindingId_Positive");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HasOwnerFields() method tests
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void HasOwnerFields_AllNull_ReturnsFalse()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 } };
        dto.HasOwnerFields().Should().BeFalse();
    }

    [Theory]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OwnerTitle))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OwnerName))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OwnerTitleEnglish))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OwnerNameEnglish))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OccupierTitle))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OccupierName))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OccupierTitleEnglish))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.OccupierNameEnglish))]
    [InlineData(nameof(UpdatePropertyIdWiseDetailsDto.MobileNo))]
    public void HasOwnerFields_SingleFieldProvided_ReturnsTrue(string fieldName)
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 } };
        typeof(UpdatePropertyIdWiseDetailsDto).GetProperty(fieldName)!.SetValue(dto, "test");
        dto.HasOwnerFields().Should().BeTrue();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HasAssessmentFields() method tests
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void HasAssessmentFields_AllNull_ReturnsFalse()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 } };
        dto.HasAssessmentFields().Should().BeFalse();
    }

    [Fact]
    public void HasAssessmentFields_OwnerTypeIdProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 }, OwnerTypeId = 1 };
        dto.HasAssessmentFields().Should().BeTrue();
    }

    [Fact]
    public void HasAssessmentFields_ResidentialToiletsProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 }, NoOfResidentialToilets = 0 };
        dto.HasAssessmentFields().Should().BeTrue();
    }

    [Fact]
    public void HasAssessmentFields_CommercialToiletsProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 }, NoOfCommercialToilets = 0 };
        dto.HasAssessmentFields().Should().BeTrue();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HasPhotoFields() method tests
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void HasPhotoFields_BothProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 1,
            DocumentBindingId = 1
        };

        dto.HasPhotoFields().Should().BeTrue();
    }

    [Fact]
    public void HasPhotoFields_OnlyPhotoTypeId_ReturnsFalse()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 1
        };

        dto.HasPhotoFields().Should().BeFalse();
    }

    [Fact]
    public void HasPhotoFields_OnlyDocumentBindingId_ReturnsFalse()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            DocumentBindingId = 1
        };

        dto.HasPhotoFields().Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HasAnyField() method tests
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void HasAnyField_NoFieldsProvided_ReturnsFalse()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto { PropertyIds = new List<int> { 1 } };
        dto.HasAnyField().Should().BeFalse();
    }

    [Fact]
    public void HasAnyField_OwnerFieldProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerName = "Test"
        };

        dto.HasAnyField().Should().BeTrue();
    }

    [Fact]
    public void HasAnyField_AssessmentFieldProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            OwnerTypeId = 1
        };

        dto.HasAnyField().Should().BeTrue();
    }

    [Fact]
    public void HasAnyField_OnlyPhotoTypeIdProvided_ReturnsTrue()
    {
        // Even when only PhotoTypeId is provided (without DocumentBindingId), HasAnyField returns true
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            PhotoTypeId = 1
        };

        dto.HasAnyField().Should().BeTrue();
    }

    [Fact]
    public void HasAnyField_OnlyDocumentBindingIdProvided_ReturnsTrue()
    {
        var dto = new UpdatePropertyIdWiseDetailsDto
        {
            PropertyIds = new List<int> { 1 },
            DocumentBindingId = 1
        };

        dto.HasAnyField().Should().BeTrue();
    }
}
