using System.Collections.Generic;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Services;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertyWiseAllocationBuilderTests
{
    private readonly PropertyWiseAllocationBuilder _builder = new();

    [Fact]
    public void BuildPairs_NullAllocations_ReturnsEmptyList()
    {
        var result = _builder.BuildPairs(null!);
        Assert.Empty(result);
    }

    [Fact]
    public void BuildPairs_EmptyAllocations_ReturnsEmptyList()
    {
        var result = _builder.BuildPairs(new List<PropertyWiseZoneWardDto>());
        Assert.Empty(result);
    }

    [Fact]
    public void BuildPairs_WithoutOldWardIds_ReturnsPairsWithNullOldWardId()
    {
        var allocations = new List<PropertyWiseZoneWardDto>
        {
            new()
            {
                ZoneId = 1,
                WardIds = new List<int> { 101, 102 },
                OldZoneId = new List<int> { 1 },
                OldWardIds = new List<int>()
            }
        };

        var result = _builder.BuildPairs(allocations);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.ZoneId == 1 && p.WardId == 101 && p.OldWardId == null);
        Assert.Contains(result, p => p.ZoneId == 1 && p.WardId == 102 && p.OldWardId == null);
    }

    [Fact]
    public void BuildPairs_SingleOldWardId_AppliesToAllWards()
    {
        var allocations = new List<PropertyWiseZoneWardDto>
        {
            new()
            {
                ZoneId = 2,
                WardIds = new List<int> { 201, 202 },
                OldZoneId = new List<int> { 2 },
                OldWardIds = new List<int> { 999 }
            }
        };

        var result = _builder.BuildPairs(allocations);

        Assert.Equal(2, result.Count);
        Assert.All(result, p => Assert.Equal(999, p.OldWardId));
        Assert.Contains(result, p => p.ZoneId == 2 && p.WardId == 201 && p.OldWardId == 999);
        Assert.Contains(result, p => p.ZoneId == 2 && p.WardId == 202 && p.OldWardId == 999);
    }

    [Fact]
    public void BuildPairs_SingleWardId_AppliesToAllOldWards()
    {
        var allocations = new List<PropertyWiseZoneWardDto>
        {
            new()
            {
                ZoneId = 3,
                WardIds = new List<int> { 301 },
                OldZoneId = new List<int> { 3 },
                OldWardIds = new List<int> { 701, 702 }
            }
        };

        var result = _builder.BuildPairs(allocations);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.ZoneId == 3 && p.WardId == 301 && p.OldWardId == 701);
        Assert.Contains(result, p => p.ZoneId == 3 && p.WardId == 301 && p.OldWardId == 702);
    }

    [Fact]
    public void BuildPairs_MultipleWardsAndMultipleOldWards_MapsByIndex()
    {
        var allocations = new List<PropertyWiseZoneWardDto>
        {
            new()
            {
                ZoneId = 4,
                WardIds = new List<int> { 401, 402 },
                OldZoneId = new List<int> { 4 },
                OldWardIds = new List<int> { 801, 802 }
            }
        };

        var result = _builder.BuildPairs(allocations);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.ZoneId == 4 && p.WardId == 401 && p.OldWardId == 801);
        Assert.Contains(result, p => p.ZoneId == 4 && p.WardId == 402 && p.OldWardId == 802);
    }

    [Fact]
    public void BuildPairs_MultipleWardsAndMismatchedOldWards_ThrowsArgumentException()
    {
        var allocations = new List<PropertyWiseZoneWardDto>
        {
            new()
            {
                ZoneId = 5,
                WardIds = new List<int> { 501, 502 },
                OldZoneId = new List<int> { 5 },
                OldWardIds = new List<int> { 901, 902, 903 }
            }
        };

        Assert.Throws<ArgumentException>(() => _builder.BuildPairs(allocations));
    }
}
