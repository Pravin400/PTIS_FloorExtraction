using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Tests.Application.DTOs;

/// <summary>
/// Validation tests for SubFloor DTOs verifying database column length limits:
/// - SubFloorCode: max length 10
/// - Description: max length 200
/// - DescriptionEnglish: max length 100
/// </summary>
public class SubFloorDtoValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    #region CreateSubFloorDto Tests

    [Fact]
    public void CreateSubFloorDto_WithValidData_IsValid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "पहिला पोट मजला",
            DescriptionEnglish = "1st Sub Floor",
            SubFloorPercentage = 10.5m,
            SequenceNo = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void CreateSubFloorDto_SubFloorCode_MaxLength10_IsValid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = new string('S', 10),
            Description = "पोट मजला",
            DescriptionEnglish = "Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateSubFloorDto.SubFloorCode)));
    }

    [Fact]
    public void CreateSubFloorDto_SubFloorCode_Exceeding10Characters_IsInvalid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = new string('S', 11),
            Description = "पोट मजला",
            DescriptionEnglish = "Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateSubFloorDto.SubFloorCode)) &&
            r.ErrorMessage == "SubFloor_SubFloorCode_MaxLen_10");
    }

    [Fact]
    public void CreateSubFloorDto_Description_MaxLength200_IsValid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = new string('D', 200),
            DescriptionEnglish = "Sub Floor Description",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateSubFloorDto.Description)));
    }

    [Fact]
    public void CreateSubFloorDto_Description_Exceeding200Characters_IsInvalid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = new string('D', 201),
            DescriptionEnglish = "Sub Floor Description",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateSubFloorDto.Description)) &&
            r.ErrorMessage == "SubFloor_Description_MaxLen_200");
    }

    [Fact]
    public void CreateSubFloorDto_DescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "पोट मजला",
            DescriptionEnglish = new string('E', 100),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateSubFloorDto.DescriptionEnglish)));
    }

    [Fact]
    public void CreateSubFloorDto_DescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new CreateSubFloorDto
        {
            SubFloorCode = "SF01",
            Description = "पोट मजला",
            DescriptionEnglish = new string('E', 101),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateSubFloorDto.DescriptionEnglish)) &&
            r.ErrorMessage == "SubFloor_DescriptionEnglish_MaxLen_100");
    }

    #endregion

    #region UpdateSubFloorDto Tests

    [Fact]
    public void UpdateSubFloorDto_WithValidData_IsValid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF02",
            Description = "दुसरा पोट मजला",
            DescriptionEnglish = "2nd Sub Floor",
            SubFloorPercentage = 15.0m,
            SequenceNo = 2,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void UpdateSubFloorDto_SubFloorCode_MaxLength10_IsValid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = new string('S', 10),
            Description = "पोट मजला",
            DescriptionEnglish = "Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateSubFloorDto.SubFloorCode)));
    }

    [Fact]
    public void UpdateSubFloorDto_SubFloorCode_Exceeding10Characters_IsInvalid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = new string('S', 11),
            Description = "पोट मजला",
            DescriptionEnglish = "Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateSubFloorDto.SubFloorCode)) &&
            r.ErrorMessage == "SubFloor_SubFloorCode_MaxLen_10");
    }

    [Fact]
    public void UpdateSubFloorDto_Description_MaxLength200_IsValid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF02",
            Description = new string('D', 200),
            DescriptionEnglish = "Updated Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateSubFloorDto.Description)));
    }

    [Fact]
    public void UpdateSubFloorDto_Description_Exceeding200Characters_IsInvalid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF02",
            Description = new string('D', 201),
            DescriptionEnglish = "Updated Sub Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateSubFloorDto.Description)) &&
            r.ErrorMessage == "SubFloor_Description_MaxLen_200");
    }

    [Fact]
    public void UpdateSubFloorDto_DescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF02",
            Description = "दुसरा पोट मजला",
            DescriptionEnglish = new string('E', 100),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateSubFloorDto.DescriptionEnglish)));
    }

    [Fact]
    public void UpdateSubFloorDto_DescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new UpdateSubFloorDto
        {
            SubFloorCode = "SF02",
            Description = "दुसरा पोट मजला",
            DescriptionEnglish = new string('E', 101),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateSubFloorDto.DescriptionEnglish)) &&
            r.ErrorMessage == "SubFloor_DescriptionEnglish_MaxLen_100");
    }

    #endregion
}
