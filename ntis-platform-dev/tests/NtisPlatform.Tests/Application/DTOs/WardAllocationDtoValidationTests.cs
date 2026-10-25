using FluentAssertions;
using NtisPlatform.Application.DTOs.wardallocation;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class WardAllocationDtoValidationTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, validationResults, validateAllProperties: true);
        return validationResults;
    }

    #region CreateWardAllocationDto Tests

    [Fact]
    public void CreateWardAllocationDto_ValidData_PassesValidation()
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5,
            OldWardId = 6,
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidUserId_FailsValidation(int userId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = userId,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_UserId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidDepartmentId_FailsValidation(int departmentId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = departmentId,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_DepartmentId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidModuleId_FailsValidation(int moduleId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = moduleId,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ModuleId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidZoneId_FailsValidation(int zoneId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = zoneId,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ZoneId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidWardId_FailsValidation(int wardId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = wardId
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_WardId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateWardAllocationDto_InvalidOldWardId_FailsValidation(int oldWardId)
    {
        var dto = new CreateWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5,
            OldWardId = oldWardId
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_OldWardId_Invalid");
    }

    #endregion

    #region UpdateWardAllocationDto Tests

    [Fact]
    public void UpdateWardAllocationDto_ValidData_PassesValidation()
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5,
            OldWardId = 6
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidId_FailsValidation(int id)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = id,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_Id_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidDepartmentId_FailsValidation(int departmentId)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = departmentId,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_DepartmentId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidModuleId_FailsValidation(int moduleId)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 2,
            ModuleId = moduleId,
            ZoneId = 4,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ModuleId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidZoneId_FailsValidation(int zoneId)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = zoneId,
            WardId = 5
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ZoneId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidWardId_FailsValidation(int wardId)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = wardId
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_WardId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateWardAllocationDto_InvalidOldWardId_FailsValidation(int oldWardId)
    {
        var dto = new UpdateWardAllocationDto
        {
            Id = 1,
            DepartmentId = 2,
            ModuleId = 3,
            ZoneId = 4,
            WardId = 5,
            OldWardId = oldWardId
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_OldWardId_Invalid");
    }

    #endregion

    #region ZoneWardAllocationDto Tests

    [Fact]
    public void ZoneWardAllocationDto_ValidData_PassesValidation()
    {
        var dto = new ZoneWardAllocationDto
        {
            ZoneId = 1,
            WardIds = new List<int> { 10, 20 },
            OldWardId = 30
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ZoneWardAllocationDto_InvalidZoneId_FailsValidation(int zoneId)
    {
        var dto = new ZoneWardAllocationDto
        {
            ZoneId = zoneId,
            WardIds = new List<int> { 10 }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ZoneId_Invalid");
    }

    [Fact]
    public void ZoneWardAllocationDto_EmptyWardIds_FailsValidation()
    {
        var dto = new ZoneWardAllocationDto
        {
            ZoneId = 1,
            WardIds = new List<int>()
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_WardIds_MinLength_1");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ZoneWardAllocationDto_InvalidOldWardId_FailsValidation(int oldWardId)
    {
        var dto = new ZoneWardAllocationDto
        {
            ZoneId = 1,
            WardIds = new List<int> { 10 },
            OldWardId = oldWardId
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_OldWardId_Invalid");
    }

    #endregion

    #region CreateFlexibleWardAllocationDto Tests

    [Fact]
    public void CreateFlexibleWardAllocationDto_ValidData_PassesValidation()
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            },
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateFlexibleWardAllocationDto_InvalidUserId_FailsValidation(int userId)
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = userId,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_UserId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateFlexibleWardAllocationDto_InvalidDepartmentId_FailsValidation(int departmentId)
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = departmentId,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_DepartmentId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateFlexibleWardAllocationDto_InvalidModuleId_FailsValidation(int moduleId)
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = moduleId,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ModuleId_Invalid");
    }

    [Fact]
    public void CreateFlexibleWardAllocationDto_EmptyAllocations_FailsValidation()
    {
        var dto = new CreateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>()
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_Allocations_MinLength_1");
    }

    #endregion

    #region UpdateFlexibleWardAllocationDto Tests

    [Fact]
    public void UpdateFlexibleWardAllocationDto_ValidData_PassesValidation()
    {
        var dto = new UpdateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            },
            IsActive = true
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateFlexibleWardAllocationDto_InvalidUserId_FailsValidation(int userId)
    {
        var dto = new UpdateFlexibleWardAllocationDto
        {
            UserId = userId,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_UserId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateFlexibleWardAllocationDto_InvalidDepartmentId_FailsValidation(int departmentId)
    {
        var dto = new UpdateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = departmentId,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_DepartmentId_Invalid");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void UpdateFlexibleWardAllocationDto_InvalidModuleId_FailsValidation(int moduleId)
    {
        var dto = new UpdateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = moduleId,
            Allocations = new List<ZoneWardAllocationDto>
            {
                new() { ZoneId = 1, WardIds = new List<int> { 10 } }
            }
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_ModuleId_Invalid");
    }

    [Fact]
    public void UpdateFlexibleWardAllocationDto_EmptyAllocations_FailsValidation()
    {
        var dto = new UpdateFlexibleWardAllocationDto
        {
            UserId = 1,
            DepartmentId = 2,
            ModuleId = 3,
            Allocations = new List<ZoneWardAllocationDto>()
        };

        var results = ValidateModel(dto);

        results.Should().Contain(r => r.ErrorMessage == "WardAllocation_Allocations_MinLength_1");
    }

    #endregion
}
