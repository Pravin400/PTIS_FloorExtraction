using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using NtisPlatform.Application.DTOs.DeleteFlat;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class DeleteFlatRequestDtoValidationTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void Validate_ValidDto_ReturnsNoErrors()
    {
        var dto = new DeleteFlatRequestDto
        {
            FilterType = "PropertyWise",
            FilterValue = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_EmptyFilterType_ReturnsValidationError()
    {
        var dto = new DeleteFlatRequestDto
        {
            FilterType = "",
            FilterValue = 1
        };

        var errors = ValidateModel(dto);

        errors.Should().ContainSingle(e => e.ErrorMessage == "DeleteFlatRequest_FilterType_Required");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_InvalidFilterValue_ReturnsValidationError(int invalidFilterValue)
    {
        var dto = new DeleteFlatRequestDto
        {
            FilterType = "PropertyWise",
            FilterValue = invalidFilterValue
        };

        var errors = ValidateModel(dto);

        errors.Should().ContainSingle(e => e.ErrorMessage == "DeleteFlatRequest_FilterValue");
    }
}
