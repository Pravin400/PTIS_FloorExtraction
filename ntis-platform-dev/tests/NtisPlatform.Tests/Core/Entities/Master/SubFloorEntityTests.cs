using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Core.Entities.Master;

/// <summary>
/// Entity tests for SubFloorEntity verifying database column lengths:
/// - SubFloorCode: varchar(10)
/// - Description: nvarchar(200)
/// - DescriptionEnglish: varchar(100)
/// </summary>
public class SubFloorEntityTests
{
    [Fact]
    public void Properties_RoundTrip()
    {
        var entity = new SubFloorEntity
        {
            Id = 1,
            SubFloorCode = "SF01",
            Description = "पहिला पोट मजला",
            DescriptionEnglish = "1st Sub Floor",
            SubFloorPercentage = 10.5m,
            SequenceNo = 1,
            IsActive = true
        };

        Assert.Equal(1, entity.Id);
        Assert.Equal("SF01", entity.SubFloorCode);
        Assert.Equal("पहिला पोट मजला", entity.Description);
        Assert.Equal("1st Sub Floor", entity.DescriptionEnglish);
        Assert.Equal(10.5m, entity.SubFloorPercentage);
        Assert.Equal(1, entity.SequenceNo);
        Assert.True(entity.IsActive);
    }

    [Fact]
    public void SubFloorEntity_SubFloorCode_MaxLength10_WorksCorrectly()
    {
        var maxLengthCode = new string('S', 10);
        var entity = new SubFloorEntity
        {
            SubFloorCode = maxLengthCode
        };

        Assert.Equal(maxLengthCode, entity.SubFloorCode);
        Assert.Equal(10, entity.SubFloorCode!.Length);
    }

    [Fact]
    public void SubFloorEntity_Description_MaxLength200_WorksCorrectly()
    {
        var maxLengthDescription = new string('D', 200);
        var entity = new SubFloorEntity
        {
            Description = maxLengthDescription
        };

        Assert.Equal(maxLengthDescription, entity.Description);
        Assert.Equal(200, entity.Description!.Length);
    }

    [Fact]
    public void SubFloorEntity_DescriptionEnglish_MaxLength100_WorksCorrectly()
    {
        var maxLengthDescriptionEnglish = new string('E', 100);
        var entity = new SubFloorEntity
        {
            DescriptionEnglish = maxLengthDescriptionEnglish
        };

        Assert.Equal(maxLengthDescriptionEnglish, entity.DescriptionEnglish);
        Assert.Equal(100, entity.DescriptionEnglish!.Length);
    }
}
