using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class FLatGenerationGroupMasterDtoValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void CreateFLatGenerationGroupMasterDto_WithValidData_IsValid()
    {
        var dto = new CreateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "Residential Group",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void CreateFLatGenerationGroupMasterDto_MissingFLatGenerationGroup_IsInvalid()
    {
        var dto = new CreateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = null!,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateFLatGenerationGroupMasterDto.FLatGenerationGroup)));
    }

    [Fact]
    public void CreateFLatGenerationGroupMasterDto_FLatGenerationGroupExceeding100Chars_IsInvalid()
    {
        var dto = new CreateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = new string('A', 101),
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateFLatGenerationGroupMasterDto.FLatGenerationGroup)));
    }

    [Fact]
    public void UpdateFLatGenerationGroupMasterDto_WithValidData_IsValid()
    {
        var dto = new UpdateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = "Commercial Group",
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void UpdateFLatGenerationGroupMasterDto_MissingFLatGenerationGroup_IsInvalid()
    {
        var dto = new UpdateFLatGenerationGroupMasterDto
        {
            FLatGenerationGroup = string.Empty,
            IsActive = true
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(UpdateFLatGenerationGroupMasterDto.FLatGenerationGroup)));
    }
}