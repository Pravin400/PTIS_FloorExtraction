using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.MeterTypeMaster;

/// <summary>
/// DataAnnotations validation tests for MeterTypeMaster Create/Update DTOs. These prove the
/// same [Required]/[MaxLength] rules the real API relies on for its automatic 400 response
/// (via [ApiController] model validation) actually reject missing/oversized values -- controller
/// unit tests invoke the action directly and bypass that pipeline, so they can't prove this.
/// </summary>
public class MeterTypeMasterDtoValidationTests
{
    #region CreateMeterTypeMasterDto

    [Fact]
    public void Create_WithValidData_IsValid()
    {
        var dto = new CreateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithMissingMeterTypeCode_IsInvalid()
    {
        var dto = new CreateMeterTypeMasterDto { MeterTypeCode = "", MeterType = "Digital AMR" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTypeMasterDto.MeterTypeCode)));
    }

    [Fact]
    public void Create_WithMissingMeterType_IsInvalid()
    {
        var dto = new CreateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTypeMasterDto.MeterType)));
    }

    [Fact]
    public void Create_WithMeterTypeCodeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateMeterTypeMasterDto { MeterTypeCode = new string('A', 31), MeterType = "Digital AMR" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTypeMasterDto.MeterTypeCode)));
    }

    [Fact]
    public void Create_WithDescriptionExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR", Description = new string('A', 301) };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTypeMasterDto.Description)));
    }

    #endregion

    #region UpdateMeterTypeMasterDto

    [Fact]
    public void Update_WithValidData_IsValid()
    {
        var dto = new UpdateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Update_WithMissingMeterTypeCode_IsInvalid()
    {
        var dto = new UpdateMeterTypeMasterDto { MeterTypeCode = "", MeterType = "Digital AMR" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateMeterTypeMasterDto.MeterTypeCode)));
    }

    [Fact]
    public void Update_WithMissingMeterType_IsInvalid()
    {
        var dto = new UpdateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateMeterTypeMasterDto.MeterType)));
    }

    #endregion

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
