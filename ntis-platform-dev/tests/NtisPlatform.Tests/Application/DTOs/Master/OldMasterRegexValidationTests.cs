using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.propertywise;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Master;

public class OldMasterRegexValidationTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, validationResults, validateAllProperties: true);
        return validationResults;
    }

    #region OldZoneMaster Regex Tests

    [Theory]
    [InlineData("Zone-1", "Zone North")]
    [InlineData("Zone 1", "Zone Main")]
    [InlineData("झोन-१", "मध्यवर्ती झोन")]
    [InlineData("Z-1", "Zone East-West")]
    [InlineData("OZ-101", "Old Zone 101")]
    [InlineData("Zone-1", "Zone.North, Sec.1/A-East")]
    public void CreateOldZoneMasterDto_ValidRegex_PassesValidation(string zoneNo, string zoneName)
    {
        var dto = new CreateOldZoneMasterDto
        {
            OldZoneNo = zoneNo,
            OldZoneName = zoneName
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("<Zone1>")]
    [InlineData("Zone=1")]
    [InlineData("Zone#1")]
    [InlineData("Zone@1")]
    [InlineData("Zone%1")]
    [InlineData("Zone!1")]
    [InlineData("Zone&1")]
    [InlineData("Zone*1")]
    [InlineData("Zone_1")]
    [InlineData("Zone.1")]
    [InlineData("Zone,1")]
    [InlineData("Zone/1")]
    public void CreateOldZoneMasterDto_InvalidOldZoneNo_FailsValidation(string invalidZoneNo)
    {
        var dto = new CreateOldZoneMasterDto
        {
            OldZoneNo = invalidZoneNo,
            OldZoneName = "Valid Zone Name"
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldZoneMasterDto.OldZoneNo)) &&
            e.ErrorMessage == "Special characters are not allowed in Old Zone No.");
    }

    [Theory]
    [InlineData("<ZoneName>")]
    [InlineData("Zone=Name")]
    [InlineData("Zone#Name")]
    [InlineData("Zone@Name")]
    [InlineData("Zone%Name")]
    [InlineData("Zone!Name")]
    [InlineData("Zone&Name")]
    [InlineData("Zone*Name")]
    [InlineData("Zone_North")]
    public void CreateOldZoneMasterDto_InvalidOldZoneName_FailsValidation(string invalidZoneName)
    {
        var dto = new CreateOldZoneMasterDto
        {
            OldZoneNo = "ValidZoneNo",
            OldZoneName = invalidZoneName
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldZoneMasterDto.OldZoneName)) &&
            e.ErrorMessage == "Special characters are not allowed in Old Zone Name.");
    }

    [Fact]
    public void CreateOldZoneMasterDto_DescriptionAlias_MapsToOldZoneName_AndValidatesCorrectly()
    {
        var validDto = new CreateOldZoneMasterDto
        {
            OldZoneNo = "Z-1-A-B-2",
            Description = "Valid Zone Description - Phase 1"
        };

        validDto.OldZoneName.Should().Be("Valid Zone Description - Phase 1");
        var validErrors = ValidateModel(validDto);
        validErrors.Should().BeEmpty();

        var invalidDto = new CreateOldZoneMasterDto
        {
            OldZoneNo = "Z-1",
            Description = "Invalid@Zone#Name"
        };

        var invalidErrors = ValidateModel(invalidDto);
        invalidErrors.Should().HaveCount(1);
        invalidErrors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldZoneMasterDto.OldZoneName)));
    }

    [Fact]
    public void UpdateOldZoneMasterDto_ValidRegex_PassesValidation()
    {
        var dto = new UpdateOldZoneMasterDto
        {
            OldZoneNo = "Z-100-A",
            OldZoneName = "Zone-Updated-Phase-1"
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("OZ-1", "Zone.North, Sec.1/A", "Description - 1")]
    [InlineData("Zone 1", "Zone Main", "Main Zone")]
    [InlineData("झोन-१", "मध्यवर्ती झोन", "विवरण-१")]
    public void OldZoneMasterQueryParameters_ValidRegex_PassesValidation(string zoneNo, string zoneName, string description)
    {
        var query = new OldZoneMasterQueryParameters
        {
            OldZoneNo = zoneNo,
            OldZoneName = zoneName,
            Description = description
        };

        var errors = ValidateModel(query);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("Zone_1", "Zone North", "Description", nameof(OldZoneMasterQueryParameters.OldZoneNo))]
    [InlineData("Zone/1", "Zone North", "Description", nameof(OldZoneMasterQueryParameters.OldZoneNo))]
    [InlineData("Zone-1", "Zone_North", "Description", nameof(OldZoneMasterQueryParameters.OldZoneName))]
    [InlineData("Zone-1", "Zone#North", "Description", nameof(OldZoneMasterQueryParameters.OldZoneName))]
    [InlineData("Zone-1", "Zone North", "Description_1", nameof(OldZoneMasterQueryParameters.Description))]
    [InlineData("Zone-1", "Zone North", "Description#1", nameof(OldZoneMasterQueryParameters.Description))]
    public void OldZoneMasterQueryParameters_InvalidRegex_FailsValidation(string zoneNo, string zoneName, string description, string expectedErrorField)
    {
        var query = new OldZoneMasterQueryParameters
        {
            OldZoneNo = zoneNo,
            OldZoneName = zoneName,
            Description = description
        };

        var errors = ValidateModel(query);

        errors.Should().Contain(e => e.MemberNames.Contains(expectedErrorField));
    }

    #endregion

    #region OldWardMaster Regex Tests

    [Theory]
    [InlineData("Ward-1", "Ward North")]
    [InlineData("Ward 1", "Ward Main")]
    [InlineData("W-1", "Ward.North, Sec.1/A-East")]
    [InlineData("प्रभाग-१", "प्रभाग क्र. १")]
    public void CreateOldWardMasterDto_ValidRegex_PassesValidation(string wardNo, string wardName)
    {
        var dto = new CreateOldWardMasterDto
        {
            OldWardNo = wardNo,
            OldWardName = wardName,
            OldZoneId = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("<Ward1>")]
    [InlineData("Ward=1")]
    [InlineData("Ward#1")]
    [InlineData("Ward@1")]
    [InlineData("Ward%1")]
    [InlineData("Ward!1")]
    [InlineData("Ward&1")]
    [InlineData("Ward*1")]
    [InlineData("Ward_1")]
    [InlineData("Ward.1")]
    [InlineData("Ward,1")]
    [InlineData("Ward/1")]
    public void CreateOldWardMasterDto_InvalidOldWardNo_FailsValidation(string invalidWardNo)
    {
        var dto = new CreateOldWardMasterDto
        {
            OldWardNo = invalidWardNo,
            OldWardName = "Valid Ward Name",
            OldZoneId = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldWardMasterDto.OldWardNo)) &&
            e.ErrorMessage == "Special characters are not allowed in Old Ward No.");
    }

    [Theory]
    [InlineData("<WardName>")]
    [InlineData("Ward=Name")]
    [InlineData("Ward#Name")]
    [InlineData("Ward@Name")]
    [InlineData("Ward%Name")]
    [InlineData("Ward!Name")]
    [InlineData("Ward&Name")]
    [InlineData("Ward*Name")]
    [InlineData("Ward_Name")]
    public void CreateOldWardMasterDto_InvalidOldWardName_FailsValidation(string invalidWardName)
    {
        var dto = new CreateOldWardMasterDto
        {
            OldWardNo = "ValidWardNo",
            OldWardName = invalidWardName,
            OldZoneId = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldWardMasterDto.OldWardName)) &&
            e.ErrorMessage == "Special characters are not allowed in Old Ward Name.");
    }

    [Fact]
    public void CreateOldWardMasterDto_DescriptionAlias_MapsToOldWardName_AndValidatesCorrectly()
    {
        var validDto = new CreateOldWardMasterDto
        {
            OldWardNo = "W-1-A-B-1",
            Description = "Valid Ward Description, Sec.1/A-Phase-1",
            OldZoneId = 1
        };

        validDto.OldWardName.Should().Be("Valid Ward Description, Sec.1/A-Phase-1");
        var validErrors = ValidateModel(validDto);
        validErrors.Should().BeEmpty();

        var invalidDto = new CreateOldWardMasterDto
        {
            OldWardNo = "W-1",
            Description = "Invalid<Ward>Name",
            OldZoneId = 1
        };

        var invalidErrors = ValidateModel(invalidDto);
        invalidErrors.Should().HaveCount(1);
        invalidErrors.Should().Contain(e => e.MemberNames.Contains(nameof(CreateOldWardMasterDto.OldWardName)));
    }

    [Fact]
    public void UpdateOldWardMasterDto_ValidRegex_PassesValidation()
    {
        var dto = new UpdateOldWardMasterDto
        {
            OldWardNo = "W-100-A",
            OldWardName = "Ward-Updated.1,Phase/A",
            OldZoneId = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    #endregion

    #region PropertyWise Regex Tests

    [Theory]
    [InlineData("101", "200")]
    [InlineData("P-101", "P-200")]
    [InlineData("P_101", "P_200")]
    [InlineData("P.101", "P.200")]
    [InlineData("P,101", "P,200")]
    [InlineData("P/101", "P/200")]
    [InlineData("FLAT-101.A,1/B_1", "FLAT-102.B,2/C_2")]
    [InlineData("घर-१०१", "घर-२००")]
    public void CreatePropertyWiseDto_ValidPropertyNoRegex_PassesValidation(string fromProp, string toProp)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 1 } }
            },
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("<P101>", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P=101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P#101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P@101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P%101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P!101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P&101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P*101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P 101", "P-200", nameof(CreatePropertyWiseDto.FromPropertyNo))]
    [InlineData("P-101", "P>200", nameof(CreatePropertyWiseDto.ToPropertyNo))]
    [InlineData("P-101", "P=200", nameof(CreatePropertyWiseDto.ToPropertyNo))]
    [InlineData("P-101", "P@200", nameof(CreatePropertyWiseDto.ToPropertyNo))]
    public void CreatePropertyWiseDto_InvalidPropertyNoRegex_FailsValidation(string fromProp, string toProp, string expectedErrorField)
    {
        var dto = new CreatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 1 } }
            },
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(expectedErrorField));
    }

    [Theory]
    [InlineData("101", "200")]
    [InlineData("P-101", "P-200")]
    [InlineData("P.101", "P.200")]
    [InlineData("P,101", "P,200")]
    [InlineData("P_101", "P_200")]
    [InlineData("P/101", "P/200")]
    public void UpdatePropertyWiseDto_ValidPropertyNoRegex_PassesValidation(string fromProp, string toProp)
    {
        var dto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 1 } }
            },
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("P<101>", "P-200")]
    [InlineData("P=101", "P-200")]
    [InlineData("P@101", "P-200")]
    [InlineData("P#101", "P-200")]
    public void UpdatePropertyWiseDto_InvalidPropertyNoRegex_FailsValidation(string fromProp, string toProp)
    {
        var dto = new UpdatePropertyWiseDto
        {
            UserId = 1,
            DepartmentId = 1,
            ModuleId = 1,
            Allocations = new List<PropertyWiseZoneWardDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 1 }, OldZoneId = new List<int> { 1 }, OldWardIds = new List<int> { 1 } }
            },
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(dto);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(UpdatePropertyWiseDto.FromPropertyNo)));
    }

    [Theory]
    [InlineData("101", "200")]
    [InlineData("P-01", "P-02")]
    [InlineData("P.01", "P.02")]
    [InlineData("P,01", "P,02")]
    [InlineData("P_01", "P_02")]
    [InlineData("P/01", "P/02")]
    public void PropertyWiseQueryParameters_ValidRegex_PassesValidation(string fromProp, string toProp)
    {
        var query = new PropertyWiseQueryParameters
        {
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(query);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("P<01>", "P-02")]
    [InlineData("P=01", "P-02")]
    [InlineData("P@01", "P-02")]
    [InlineData("P#01", "P-02")]
    public void PropertyWiseQueryParameters_InvalidRegex_FailsValidation(string fromProp, string toProp)
    {
        var query = new PropertyWiseQueryParameters
        {
            FromPropertyNo = fromProp,
            ToPropertyNo = toProp
        };

        var errors = ValidateModel(query);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(PropertyWiseQueryParameters.FromPropertyNo)));
    }

    #endregion
}