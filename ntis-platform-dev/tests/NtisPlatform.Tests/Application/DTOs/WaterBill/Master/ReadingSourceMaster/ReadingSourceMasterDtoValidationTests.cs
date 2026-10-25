using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.ReadingSourceMaster;

/// <summary>
/// DataAnnotations validation tests for ReadingSourceMaster Create/Update DTOs. These prove the
/// same [Required]/[MaxLength] rules the real API relies on for its automatic 400 response
/// (via [ApiController] model validation) actually reject missing/oversized values -- controller
/// unit tests invoke the action directly and bypass that pipeline, so they can't prove this.
/// </summary>
public class ReadingSourceMasterDtoValidationTests
{
    #region CreateReadingSourceMasterDto

    [Fact]
    public void Create_WithValidData_IsValid()
    {
        var dto = new CreateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Mobile App" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithMissingReadingSourceCode_IsInvalid()
    {
        var dto = new CreateReadingSourceMasterDto { ReadingSourceCode = "", ReadingSource = "Mobile App" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateReadingSourceMasterDto.ReadingSourceCode)));
    }

    [Fact]
    public void Create_WithMissingReadingSource_IsInvalid()
    {
        var dto = new CreateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateReadingSourceMasterDto.ReadingSource)));
    }

    [Fact]
    public void Create_WithReadingSourceCodeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateReadingSourceMasterDto { ReadingSourceCode = new string('A', 31), ReadingSource = "Mobile App" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateReadingSourceMasterDto.ReadingSourceCode)));
    }

    #endregion

    #region UpdateReadingSourceMasterDto

    [Fact]
    public void Update_WithValidData_IsValid()
    {
        var dto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Mobile App" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Update_WithMissingReadingSourceCode_IsInvalid()
    {
        var dto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "", ReadingSource = "Mobile App" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateReadingSourceMasterDto.ReadingSourceCode)));
    }

    [Fact]
    public void Update_WithMissingReadingSource_IsInvalid()
    {
        var dto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateReadingSourceMasterDto.ReadingSource)));
    }

    #endregion

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
