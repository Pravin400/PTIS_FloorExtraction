using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;

namespace NtisPlatform.Tests.Application.DTOs.WaterBill.Master.GeographyUnit;

/// <summary>
/// DataAnnotations validation tests for GeographyUnit Create/Update DTOs. These prove the
/// same [Required]/[MaxLength] rules the real API relies on for its automatic 400 response
/// (via [ApiController] model validation) actually reject missing/oversized values -- controller
/// unit tests invoke the action directly and bypass that pipeline, so they can't prove this.
/// </summary>
public class GeographyUnitDtoValidationTests
{
    #region CreateGeographyUnitDto

    [Fact]
    public void Create_WithValidData_IsValid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Create_WithMissingGeographyTypeId_IsInvalid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 0, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyUnitDto.GeographyTypeId)));
    }

    [Fact]
    public void Create_WithMissingGeographyUnitCode_IsInvalid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "", GeographyUnitName = "Zone 1" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyUnitDto.GeographyUnitCode)));
    }

    [Fact]
    public void Create_WithMissingGeographyUnitName_IsInvalid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyUnitDto.GeographyUnitName)));
    }

    [Fact]
    public void Create_WithGeographyUnitCodeExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = new string('A', 51), GeographyUnitName = "Zone 1" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyUnitDto.GeographyUnitCode)));
    }

    [Fact]
    public void Create_WithGeographyUnitNameExceedingMaxLength_IsInvalid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = new string('A', 201) };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGeographyUnitDto.GeographyUnitName)));
    }

    [Fact]
    public void Create_WithoutParentGeographyUnitId_IsValid()
    {
        var dto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", ParentGeographyUnitId = null };

        Assert.Empty(ValidateModel(dto));
    }

    #endregion

    #region UpdateGeographyUnitDto

    [Fact]
    public void Update_WithValidData_IsValid()
    {
        var dto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        Assert.Empty(ValidateModel(dto));
    }

    [Fact]
    public void Update_WithMissingGeographyTypeId_IsInvalid()
    {
        var dto = new UpdateGeographyUnitDto { GeographyTypeId = 0, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyUnitDto.GeographyTypeId)));
    }

    [Fact]
    public void Update_WithMissingGeographyUnitCode_IsInvalid()
    {
        var dto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "", GeographyUnitName = "Zone 1" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyUnitDto.GeographyUnitCode)));
    }

    [Fact]
    public void Update_WithMissingGeographyUnitName_IsInvalid()
    {
        var dto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "" };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateGeographyUnitDto.GeographyUnitName)));
    }

    #endregion

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }
}
