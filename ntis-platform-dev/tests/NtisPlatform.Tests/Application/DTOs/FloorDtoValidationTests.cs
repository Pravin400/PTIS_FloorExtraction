using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Tests.Application.DTOs;

/// <summary>
/// Validation tests for Floor DTOs verifying database column length limits:
/// - FloorCode: max length 5
/// - Description: max length 100
/// - DescriptionEnglish: max length 100
/// </summary>
public class FloorDtoValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    #region CreateFloorDto Tests

    [Fact]
    public void CreateFloorDto_WithValidData_IsValid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = "तळमजला",
            DescriptionEnglish = "Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1,
            FLatGenerationGroupId = 1,
            FLatGenerationSeq = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void CreateFloorDto_FloorCode_MaxLength5_IsValid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = new string('F', 5),
            Description = "मजला",
            DescriptionEnglish = "Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateFloorDto.FloorCode)));
    }

    [Fact]
    public void CreateFloorDto_FloorCode_Exceeding5Characters_IsInvalid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = new string('F', 6),
            Description = "मजला",
            DescriptionEnglish = "Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateFloorDto.FloorCode)) &&
            r.ErrorMessage == "Floor_FloorCode_MaxLen_5");
    }

    [Fact]
    public void CreateFloorDto_Description_MaxLength100_IsValid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = new string('D', 100),
            DescriptionEnglish = "Ground Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateFloorDto.Description)));
    }

    [Fact]
    public void CreateFloorDto_Description_Exceeding100Characters_IsInvalid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = new string('D', 101),
            DescriptionEnglish = "Ground Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateFloorDto.Description)) &&
            r.ErrorMessage == "Floor_Description_MaxLen_100");
    }

    [Fact]
    public void CreateFloorDto_DescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = "तळमजला",
            DescriptionEnglish = new string('E', 100),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(CreateFloorDto.DescriptionEnglish)));
    }

    [Fact]
    public void CreateFloorDto_DescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = "तळमजला",
            DescriptionEnglish = new string('E', 101),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateFloorDto.DescriptionEnglish)) &&
            r.ErrorMessage == "Floor_DescriptionEnglish_MaxLen_100");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateFloorDto_FLatGenerationGroupId_LessThanOne_IsInvalid(int invalidGroupId)
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = "तळमजला",
            FLatGenerationGroupId = invalidGroupId,
            FLatGenerationSeq = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateFloorDto.FLatGenerationGroupId)) &&
            r.ErrorMessage == "Floor_FLatGenerationGroupId_Required");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateFloorDto_FLatGenerationSeq_LessThanOne_IsInvalid(int invalidSeq)
    {
        var dto = new CreateFloorDto
        {
            FloorCode = "GF",
            Description = "तळमजला",
            FLatGenerationGroupId = 1,
            FLatGenerationSeq = invalidSeq,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(CreateFloorDto.FLatGenerationSeq)) &&
            r.ErrorMessage == "Floor_FLatGenerationSeq_Required");
    }

    #endregion

    #region UpdateFloorDto Tests

    [Fact]
    public void UpdateFloorDto_WithValidData_IsValid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = "पहिला मजला",
            DescriptionEnglish = "1st Floor",
            SequenceNo = 2,
            MaxFloorNo = 2,
            FLatGenerationGroupId = 1,
            FLatGenerationSeq = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void UpdateFloorDto_FloorCode_MaxLength5_IsValid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = new string('F', 5),
            Description = "मजला",
            DescriptionEnglish = "Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateFloorDto.FloorCode)));
    }

    [Fact]
    public void UpdateFloorDto_FloorCode_Exceeding5Characters_IsInvalid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = new string('F', 6),
            Description = "मजला",
            DescriptionEnglish = "Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateFloorDto.FloorCode)) &&
            r.ErrorMessage == "Floor_FloorCode_MaxLen_5");
    }

    [Fact]
    public void UpdateFloorDto_Description_MaxLength100_IsValid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = new string('D', 100),
            DescriptionEnglish = "First Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateFloorDto.Description)));
    }

    [Fact]
    public void UpdateFloorDto_Description_Exceeding100Characters_IsInvalid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = new string('D', 101),
            DescriptionEnglish = "First Floor",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateFloorDto.Description)) &&
            r.ErrorMessage == "Floor_Description_MaxLen_100");
    }

    [Fact]
    public void UpdateFloorDto_DescriptionEnglish_MaxLength100_IsValid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = "पहिला मजला",
            DescriptionEnglish = new string('E', 100),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(UpdateFloorDto.DescriptionEnglish)));
    }

    [Fact]
    public void UpdateFloorDto_DescriptionEnglish_Exceeding100Characters_IsInvalid()
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = "पहिला मजला",
            DescriptionEnglish = new string('E', 101),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateFloorDto.DescriptionEnglish)) &&
            r.ErrorMessage == "Floor_DescriptionEnglish_MaxLen_100");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateFloorDto_FLatGenerationGroupId_LessThanOne_IsInvalid(int invalidGroupId)
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = "पहिला मजला",
            FLatGenerationGroupId = invalidGroupId,
            FLatGenerationSeq = 1,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateFloorDto.FLatGenerationGroupId)) &&
            r.ErrorMessage == "Floor_FLatGenerationGroupId_Required");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateFloorDto_FLatGenerationSeq_LessThanOne_IsInvalid(int invalidSeq)
    {
        var dto = new UpdateFloorDto
        {
            FloorCode = "1F",
            Description = "पहिला मजला",
            FLatGenerationGroupId = 1,
            FLatGenerationSeq = invalidSeq,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r =>
            r.MemberNames.Contains(nameof(UpdateFloorDto.FLatGenerationSeq)) &&
            r.ErrorMessage == "Floor_FLatGenerationSeq_Required");
    }

    #endregion
}
