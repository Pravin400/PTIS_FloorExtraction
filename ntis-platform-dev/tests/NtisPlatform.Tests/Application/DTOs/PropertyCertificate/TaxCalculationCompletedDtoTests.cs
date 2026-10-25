using NtisPlatform.Application.DTOs.PropertyCertificate;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.PropertyCertificate;

public class TaxCalculationCompletedDtoTests
{
    [Fact]
    public void Status_Completed_WhenZeroFailures_ReturnsSuccessTrueAndConsistentMessage()
    {
        var dto = new TaxCalculationCompletedDto
        {
            TotalUnits = 10,
            SucceededCount = 10,
            FailedCount = 0
        };

        Assert.Equal("Completed", dto.Status);
        Assert.True(dto.Success);
        Assert.True(dto.IsSuccess);
        Assert.Equal("Tax recalculation completed successfully for 10 unit(s).", dto.Message);
    }

    [Fact]
    public void Status_ExplicitlySetToCompleted_WhenZeroFailures_ReturnsSuccessTrue()
    {
        var dto = new TaxCalculationCompletedDto
        {
            Status = "Completed",
            TotalUnits = 5,
            SucceededCount = 5,
            FailedCount = 0
        };

        Assert.Equal("Completed", dto.Status);
        Assert.True(dto.Success);
        Assert.True(dto.IsSuccess);
        Assert.Equal("Tax recalculation completed successfully for 5 unit(s).", dto.Message);
    }

    [Fact]
    public void Status_PartiallyCompleted_WhenFailuresAndSuccessesExist_ReturnsSuccessFalseAndConsistentMessage()
    {
        var dto = new TaxCalculationCompletedDto
        {
            TotalUnits = 10,
            SucceededCount = 7,
            FailedCount = 3
        };

        Assert.Equal("PartiallyCompleted", dto.Status);
        Assert.False(dto.Success);
        Assert.False(dto.IsSuccess);
        Assert.Equal("Tax recalculation partially completed: 7 succeeded, 3 failed.", dto.Message);
    }

    [Fact]
    public void Status_PartiallyCompleted_EvenIfStatusSetToCompleted_WhenFailuresExist()
    {
        var dto = new TaxCalculationCompletedDto
        {
            Status = "Completed",
            TotalUnits = 10,
            SucceededCount = 8,
            FailedCount = 2
        };

        Assert.Equal("PartiallyCompleted", dto.Status);
        Assert.False(dto.Success);
        Assert.False(dto.IsSuccess);
        Assert.Equal("Tax recalculation partially completed: 8 succeeded, 2 failed.", dto.Message);
    }

    [Fact]
    public void Status_Failed_WhenAllFailed_ReturnsSuccessFalseAndConsistentMessage()
    {
        var dto = new TaxCalculationCompletedDto
        {
            TotalUnits = 5,
            SucceededCount = 0,
            FailedCount = 5
        };

        Assert.Equal("Failed", dto.Status);
        Assert.False(dto.Success);
        Assert.False(dto.IsSuccess);
        Assert.Equal("Tax recalculation failed for 5 unit(s).", dto.Message);
    }

    [Fact]
    public void Status_Cancelled_EvenWithZeroFailures_ReturnsSuccessFalseAndConsistentMessage()
    {
        var dto = new TaxCalculationCompletedDto
        {
            Status = "Cancelled",
            TotalUnits = 10,
            SucceededCount = 4,
            FailedCount = 0
        };

        Assert.Equal("Cancelled", dto.Status);
        Assert.False(dto.Success);
        Assert.False(dto.IsSuccess);
        Assert.Equal("Tax recalculation was cancelled after processing 4 of 10 unit(s).", dto.Message);
    }

    [Fact]
    public void Status_Cancelled_WithFailures_ReturnsSuccessFalseAndConsistentMessage()
    {
        var dto = new TaxCalculationCompletedDto
        {
            Status = "Cancelled",
            TotalUnits = 10,
            SucceededCount = 4,
            FailedCount = 6
        };

        Assert.Equal("Cancelled", dto.Status);
        Assert.False(dto.Success);
        Assert.False(dto.IsSuccess);
        Assert.Equal("Tax recalculation was cancelled after processing 4 of 10 unit(s).", dto.Message);
    }

    [Fact]
    public void SummaryMessage_OverridesDefaultMessage_ForAnyStatus()
    {
        var cancelledDto = new TaxCalculationCompletedDto
        {
            Status = "Cancelled",
            SummaryMessage = "Custom termination message",
            TotalUnits = 10,
            SucceededCount = 5,
            FailedCount = 0
        };

        Assert.Equal("Custom termination message", cancelledDto.Message);
        Assert.False(cancelledDto.Success);

        var completedDto = new TaxCalculationCompletedDto
        {
            Status = "Completed",
            SummaryMessage = "Custom success message",
            TotalUnits = 10,
            SucceededCount = 10,
            FailedCount = 0
        };

        Assert.Equal("Custom success message", completedDto.Message);
        Assert.True(completedDto.Success);
    }
}
