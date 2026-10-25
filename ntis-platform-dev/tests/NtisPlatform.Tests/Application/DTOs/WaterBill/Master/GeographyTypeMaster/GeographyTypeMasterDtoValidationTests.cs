using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.GeographyTypeMaster;

/// <summary>
/// DataAnnotations validation tests for GeographyTypeMaster Create/Update DTOs. These prove the
/// same [Required]/[MaxLength]/[Range] rules the real API relies on for its automatic 400 response
/// (via [ApiController] model validation) actually reject missing/oversized/invalid values --
/// controller unit tests invoke the action directly and bypass that pipeline, so they can't prove this.
/// </summary>
public class GeographyTypeMasterDtoValidationTests
{
    #region CreateGeographyTypeMasterDto

    [Fact]
    public void Create_WithValidData_IsValid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1 };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithMissingGeographyTypeCode_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "", GeographyType = "Zone", LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.GeographyTypeCode)));
    }

    [Fact]
    public void Create_WithMissingGeographyType_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "", LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.GeographyType)));
    }

    [Fact]
    public void Create_WithGeographyTypeCodeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = new string('A', 31), GeographyType = "Zone", LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.GeographyTypeCode)));
    }

    [Fact]
    public void Create_WithGeographyTypeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = new string('A', 101), LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.GeographyType)));
    }

    [Fact]
    public void Create_WithZeroLevelNo_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 0 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.LevelNo)));
    }

    [Fact]
    public void Create_WithNegativeLevelNo_IsInvalid()
    {
        var dto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = -1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyTypeMasterDto.LevelNo)));
    }

    #endregion

    #region UpdateGeographyTypeMasterDto

    [Fact]
    public void Update_WithValidData_IsValid()
    {
        var dto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1 };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Update_WithMissingGeographyTypeCode_IsInvalid()
    {
        var dto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "", GeographyType = "Zone", LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyTypeMasterDto.GeographyTypeCode)));
    }

    [Fact]
    public void Update_WithMissingGeographyType_IsInvalid()
    {
        var dto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "", LevelNo = 1 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyTypeMasterDto.GeographyType)));
    }

    [Fact]
    public void Update_WithZeroLevelNo_IsInvalid()
    {
        var dto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 0 };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyTypeMasterDto.LevelNo)));
    }

    #endregion

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
