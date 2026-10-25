using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.Master.PropertyTypeMaster;

namespace NtisPlatform.Tests.Application.DTOs;

/// <summary>
/// Validation tests for PropertyTypeMaster DTOs verifying database column length limits:
/// - PropertyDescription: max length 100
/// - PropertyDescriptionEnglish: max length 100
/// - Type: max length 5
/// </summary>
public class PropertyTypeMasterDtoValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    #region CreatePropertyTypeMasterDto Tests

    [Fact]
    public void CreatePropertyTypeMasterDto_WithValidData_IsValid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = "निवासी इमारत",
            PropertyDescriptionEnglish = "Residential Building",
            Type = "R",
            SearchSequence = 1,
            PropertyTypeCategoryId = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_PropertyDescription_MaxLength100_IsValid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = new string('D', 100),
            PropertyDescriptionEnglish = "Residential Building",
            Type = "R",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.PropertyDescription)));
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_PropertyDescription_Exceeding100Characters_IsInvalid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = new string('D', 101),
            PropertyDescriptionEnglish = "Residential Building",
            Type = "R",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.PropertyDescription)) &&
            r.ErrorMessage == "PropertyDescription_MaxLen_100");
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_PropertyDescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = "निवासी",
            PropertyDescriptionEnglish = new string('E', 100),
            Type = "R",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.PropertyDescriptionEnglish)));
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_PropertyDescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = "निवासी",
            PropertyDescriptionEnglish = new string('E', 101),
            Type = "R",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.PropertyDescriptionEnglish)) &&
            r.ErrorMessage == "PropertyDescriptionEnglish_MaxLen_100");
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_Type_MaxLength5_IsValid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = "निवासी",
            PropertyDescriptionEnglish = "Residential",
            Type = new string('T', 5),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.Type)));
    }

    [Fact]
    public void CreatePropertyTypeMasterDto_Type_Exceeding5Characters_IsInvalid()
    {
        var dto = new CreatePropertyTypeMasterDto
        {
            PropertyDescription = "निवासी",
            PropertyDescriptionEnglish = "Residential",
            Type = new string('T', 6),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreatePropertyTypeMasterDto.Type)) &&
            r.ErrorMessage == "Type_MaxLen_5");
    }

    #endregion

    #region UpdatePropertyTypeMasterDto Tests

    [Fact]
    public void UpdatePropertyTypeMasterDto_WithValidData_IsValid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = "व्यावसायिक संकुल",
            PropertyDescriptionEnglish = "Commercial Complex",
            Type = "C",
            SearchSequence = 2,
            PropertyTypeCategoryId = 2,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_PropertyDescription_MaxLength100_IsValid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = new string('D', 100),
            PropertyDescriptionEnglish = "Commercial",
            Type = "C",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.PropertyDescription)));
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_PropertyDescription_Exceeding100Characters_IsInvalid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = new string('D', 101),
            PropertyDescriptionEnglish = "Commercial",
            Type = "C",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.PropertyDescription)) &&
            r.ErrorMessage == "PropertyDescription_MaxLen_100");
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_PropertyDescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = "व्यावसायिक",
            PropertyDescriptionEnglish = new string('E', 100),
            Type = "C",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.PropertyDescriptionEnglish)));
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_PropertyDescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = "व्यावसायिक",
            PropertyDescriptionEnglish = new string('E', 101),
            Type = "C",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.PropertyDescriptionEnglish)) &&
            r.ErrorMessage == "PropertyDescriptionEnglish_MaxLen_100");
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_Type_MaxLength5_IsValid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = "व्यावसायिक",
            PropertyDescriptionEnglish = "Commercial",
            Type = new string('T', 5),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.Type)));
    }

    [Fact]
    public void UpdatePropertyTypeMasterDto_Type_Exceeding5Characters_IsInvalid()
    {
        var dto = new UpdatePropertyTypeMasterDto
        {
            PropertyDescription = "व्यावसायिक",
            PropertyDescriptionEnglish = "Commercial",
            Type = new string('T', 6),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdatePropertyTypeMasterDto.Type)) &&
            r.ErrorMessage == "Type_MaxLen_5");
    }

    #endregion
}
