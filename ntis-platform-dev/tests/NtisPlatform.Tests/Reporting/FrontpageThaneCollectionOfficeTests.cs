using System.Text.Json;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Tests.Reporting;

public class FrontpageThaneCollectionOfficeTests
{
    [Fact]
    public async Task OfficesComeFromTheOldWardEvenWhenADifferentZoneIsSelected()
    {
        var record = await FrontpageThaneFixture.FrontpageRecord(FrontpageThaneFixture.Data("A"));
        Assert.Equal("UTHALSAR", record.GetProperty("wardOffice").GetString());
        Assert.Equal("OFFICE 126", record.GetProperty("collectionOffice").GetString());
    }

    [Fact]
    public async Task MissingWardZoneUsesTheRateRowsOldZone()
    {
        var data = FrontpageThaneFixture.Data("A");
        ((OldWardMasterEntity)data[typeof(OldWardMasterEntity)][0]).OldZoneId = 0;
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal("UTHALSAR", record.GetProperty("wardOffice").GetString());
    }

    [Fact]
    public async Task BlankZoneDescriptionUsesItsOldZoneNumber()
    {
        var data = FrontpageThaneFixture.Data("A");
        var zone = (OldZoneMasterEntity)data[typeof(OldZoneMasterEntity)][0];
        zone.Description = " ";
        zone.OldZoneNo = " KALWA ";
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal("KALWA", record.GetProperty("wardOffice").GetString());
    }

    [Fact]
    public async Task MissingOldPropertyDoesNotUseTheSelectedNewZone()
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(PropertyMastOldEntity)] = [];
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        foreach (var field in new[] { "wardOffice", "collectionOffice", "RRate", "CRate" })
            Assert.Equal(JsonValueKind.Null, record.GetProperty(field).ValueKind);
    }

    [Fact]
    public async Task MissingOldZoneJoinLeavesBothOfficeValuesEmpty()
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(OldZoneMasterEntity)] = [];
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal("", record.GetProperty("wardOffice").GetString());
        Assert.Equal("", record.GetProperty("collectionOffice").GetString());
    }
}
