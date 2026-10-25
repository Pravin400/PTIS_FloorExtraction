using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Queries;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs;

public class FLatGenerationGroupMasterQueryParametersTests
{
    [Fact]
    public void Properties_RoundTrip()
    {
        var query = new FLatGenerationGroupMasterQueryParameters
        {
            FLatGenerationGroup = "Residential",
            IsActive = true
        };

        Assert.Equal("Residential", query.FLatGenerationGroup);
        Assert.True(query.IsActive);
    }

    [Fact]
    public void InheritsFromBaseQueryParameters()
    {
        var query = new FLatGenerationGroupMasterQueryParameters();

        Assert.IsAssignableFrom<BaseQueryParameters>(query);
        Assert.Null(query.FLatGenerationGroup);
        Assert.Null(query.IsActive);
    }
}