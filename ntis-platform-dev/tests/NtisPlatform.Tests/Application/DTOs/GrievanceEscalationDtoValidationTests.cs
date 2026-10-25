using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class GrievanceEscalationDtoValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    #region CreateGrievanceEscalationDto Tests

    [Fact]
    public void CreateGrievanceEscalationDto_ValidModel_PassesValidation()
    {
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 1,
            Reason = "Pothole unresolved for 2 weeks",
            Priority = "URGENT",
            WardId = 5,
            ZoneId = 2
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void CreateGrievanceEscalationDto_MissingReason_FailsValidation()
    {
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 1,
            Reason = string.Empty
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGrievanceEscalationDto.Reason)));
    }

    [Fact]
    public void CreateGrievanceEscalationDto_ReasonExceedsMaxLength_FailsValidation()
    {
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 1,
            Reason = new string('A', 1001)
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGrievanceEscalationDto.Reason)));
    }

    [Fact]
    public void CreateGrievanceEscalationDto_PriorityExceedsMaxLength_FailsValidation()
    {
        var dto = new CreateGrievanceEscalationDto
        {
            GrievanceApplicationId = 1,
            Reason = "Valid reason",
            Priority = new string('P', 21)
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateGrievanceEscalationDto.Priority)));
    }

    #endregion

    #region RespondGrievanceEscalationDto Tests

    [Fact]
    public void RespondGrievanceEscalationDto_ValidModel_PassesValidation()
    {
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Inspection conducted and work order created.",
            EscalationStatus = "ACKNOWLEDGED"
        };

        var results = ValidateModel(dto);

        Assert.Empty(results);
    }

    [Fact]
    public void RespondGrievanceEscalationDto_MissingStaffResponse_FailsValidation()
    {
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = string.Empty,
            EscalationStatus = "ACKNOWLEDGED"
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RespondGrievanceEscalationDto.StaffResponse)));
    }

    [Fact]
    public void RespondGrievanceEscalationDto_StaffResponseExceedsMaxLength_FailsValidation()
    {
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = new string('B', 2001),
            EscalationStatus = "ACKNOWLEDGED"
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RespondGrievanceEscalationDto.StaffResponse)));
    }

    [Fact]
    public void RespondGrievanceEscalationDto_MissingEscalationStatus_FailsValidation()
    {
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Valid response",
            EscalationStatus = string.Empty
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RespondGrievanceEscalationDto.EscalationStatus)));
    }

    [Fact]
    public void RespondGrievanceEscalationDto_EscalationStatusExceedsMaxLength_FailsValidation()
    {
        var dto = new RespondGrievanceEscalationDto
        {
            StaffResponse = "Valid response",
            EscalationStatus = new string('S', 31)
        };

        var results = ValidateModel(dto);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RespondGrievanceEscalationDto.EscalationStatus)));
    }

    #endregion
}
