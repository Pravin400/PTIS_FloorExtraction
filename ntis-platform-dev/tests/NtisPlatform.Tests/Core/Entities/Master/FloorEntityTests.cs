using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Core.Entities.Master;

/// <summary>
/// Entity tests for FloorEntity verifying database column lengths:
/// - FloorCode: varchar(5)
/// - Description: nvarchar(100)
/// - DescriptionEnglish: varchar(100)
/// </summary>
public class FloorEntityTests
{
    [Fact]
    public void Properties_RoundTrip()
    {
        var entity = new FloorEntity
        {
            Id = 1,
            FloorCode = "GF",
            Description = "तळमजला",
            DescriptionEnglish = "Ground Floor",
            SequenceNo = 1,
            MaxFloorNo = 1,
            FloorGroupId = 1,
            IsActive = true
        };

        Assert.Equal(1, entity.Id);
        Assert.Equal("GF", entity.FloorCode);
        Assert.Equal("तळमजला", entity.Description);
        Assert.Equal("Ground Floor", entity.DescriptionEnglish);
        Assert.Equal(1, entity.SequenceNo);
        Assert.Equal(1, entity.MaxFloorNo);
        Assert.Equal(1, entity.FloorGroupId);
        Assert.True(entity.IsActive);
    }

    [Fact]
    public void FloorEntity_FloorCode_MaxLength5_WorksCorrectly()
    {
        var maxLengthCode = new string('F', 5);
        var entity = new FloorEntity
        {
            FloorCode = maxLengthCode
        };

        Assert.Equal(maxLengthCode, entity.FloorCode);
        Assert.Equal(5, entity.FloorCode!.Length);
    }

    [Fact]
    public void FloorEntity_Description_MaxLength100_WorksCorrectly()
    {
        var maxLengthDescription = new string('D', 100);
        var entity = new FloorEntity
        {
            Description = maxLengthDescription
        };

        Assert.Equal(maxLengthDescription, entity.Description);
        Assert.Equal(100, entity.Description!.Length);
    }

    [Fact]
    public void FloorEntity_DescriptionEnglish_MaxLength100_WorksCorrectly()
    {
        var maxLengthDescriptionEnglish = new string('E', 100);
        var entity = new FloorEntity
        {
            DescriptionEnglish = maxLengthDescriptionEnglish
        };

        Assert.Equal(maxLengthDescriptionEnglish, entity.DescriptionEnglish);
        Assert.Equal(100, entity.DescriptionEnglish!.Length);
    }
}
