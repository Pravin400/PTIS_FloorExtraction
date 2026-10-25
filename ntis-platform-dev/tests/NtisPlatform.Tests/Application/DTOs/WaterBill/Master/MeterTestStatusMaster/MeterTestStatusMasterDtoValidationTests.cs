using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;

/// <summary>
/// DataAnnotations validation tests for MeterTestStatusMaster Create/Update DTOs. These prove the
/// same [Required]/[MaxLength] rules the real API relies on for its automatic 400 response
/// (via [ApiController] model validation) actually reject missing/oversized values -- controller
/// unit tests invoke the action directly and bypass that pipeline, so they can't prove this.
/// </summary>
public class MeterTestStatusMasterDtoValidationTests
{
    #region CreateMeterTestStatusMasterDto

    [Fact]
    public void Create_WithValidData_IsValid()
    {
        var dto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithMissingMeterTestStatusCode_IsInvalid()
    {
        var dto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = "", MeterTestStatus = "Passed" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTestStatusMasterDto.MeterTestStatusCode)));
    }

    [Fact]
    public void Create_WithMissingMeterTestStatus_IsInvalid()
    {
        var dto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTestStatusMasterDto.MeterTestStatus)));
    }

    [Fact]
    public void Create_WithMeterTestStatusCodeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = new string('A', 31), MeterTestStatus = "Passed" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateMeterTestStatusMasterDto.MeterTestStatusCode)));
    }

    #endregion

    #region UpdateMeterTestStatusMasterDto

    [Fact]
    public void Update_WithValidData_IsValid()
    {
        var dto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Update_WithMissingMeterTestStatusCode_IsInvalid()
    {
        var dto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "", MeterTestStatus = "Passed" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateMeterTestStatusMasterDto.MeterTestStatusCode)));
    }

    [Fact]
    public void Update_WithMissingMeterTestStatus_IsInvalid()
    {
        var dto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateMeterTestStatusMasterDto.MeterTestStatus)));
    }

    #endregion

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
