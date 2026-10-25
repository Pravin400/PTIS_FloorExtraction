using System.Text.Json;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Tests.Reporting;

public class SignpageThaneOfficeTests
{
    [Theory]
    [InlineData(" OWNER ", "Regional", "OWNER")]
    [InlineData(null, " Regional ", "Regional")]
    [InlineData("-", "Regional", "Regional")]
    [InlineData("", "", "-")]
    public async Task OfficesAndStructureOwnerMatchFrontpageWithoutUsingSocietyBuilder(
        string? english, string? regional, string expected)
    {
        var data = FrontpageThaneFixture.Data("A");
        var property = (PropertyEntity)data[typeof(PropertyEntity)][0];
        property.OwnerNameEnglish = english;
        property.OwnerName = regional;
        var record = await AssertParity(data);
        Assert.Equal(expected, record.GetProperty("builderName").GetString());
        Assert.Equal(expected, record.GetProperty("structureOwnerName").GetString());
        Assert.Equal("UTHALSAR", record.GetProperty("wardOffice").GetString());
        Assert.Equal("OFFICE 126", record.GetProperty("collectionOffice").GetString());
        Assert.Equal("UNCHANGED ADDRESS", record.GetProperty("propertyAddress").GetString());
    }

    [Fact]
    public async Task OfficeFallbacksMatchFrontpage()
    {
        var data = FrontpageThaneFixture.Data("A");
        ((OldWardMasterEntity)data[typeof(OldWardMasterEntity)][0]).OldZoneId = 0;
        var zone = (OldZoneMasterEntity)data[typeof(OldZoneMasterEntity)][0];
        zone.Description = " ";
        zone.OldZoneNo = " KALWA ";
        var record = await AssertParity(data);
        Assert.Equal("KALWA", record.GetProperty("wardOffice").GetString());
    }

    [Fact]
    public async Task MissingOldPropertyDoesNotBorrowTheSelectedZone()
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(PropertyMastOldEntity)] = [];
        var record = await AssertParity(data);
        Assert.Equal(JsonValueKind.Null, record.GetProperty("wardOffice").ValueKind);
        Assert.Equal(JsonValueKind.Null, record.GetProperty("collectionOffice").ValueKind);
    }

    [Fact]
    public async Task CurrentMappingOverridesTheUnrelatedDirectLink()
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(PropertyMastOldEntity)] = [new PropertyMastOldEntity { Id = 10, IsActive = true, OldWardNo = "OTHER" },
            new PropertyMastOldEntity { Id = 11, IsActive = true, OldWardNo = "126" }];
        data[typeof(PropertyMapDetailEntity)] = [new PropertyMapDetailEntity
            { PropertyIdNew = 1, PropertyIdOld = 11, IsActive = true, IsCurrent = true, Status = "ACTIVE" }];
        var record = await AssertParity(data);
        Assert.Equal("UTHALSAR", record.GetProperty("wardOffice").GetString());
    }

    private const string Template = """
        {"reportCode":"TSR_SIGNREPORT_AUTOMATION","page":{"widthMm":210,"heightMm":297},
         "bands":[{"type":"detail","heightMm":25,"elements":[
          {"type":"text","text":"Ward Office :-","x":0,"y":0,"w":90,"h":5},
          {"type":"text","text":"Collection Office :-","x":0,"y":6,"w":90,"h":5},
          {"type":"field","path":"builderName","x":0,"y":12,"w":90,"h":5}]}]}
        """;

    [Fact]
    public async Task MultipleMappedWardsDisplayDistinctOfficeNamesInOrder()
    {
        var data = FrontpageThaneFixture.Data("A");
        var secondWard = new OldWardMasterEntity { Id = 2, IsActive = true, OldWardNo = "127", OldZoneId = 8 };
        data[typeof(OldWardMasterEntity)] = [.. data[typeof(OldWardMasterEntity)], secondWard];
        data[typeof(OldZoneMasterEntity)] = [.. data[typeof(OldZoneMasterEntity)],
            new OldZoneMasterEntity { Id = 8, OldZoneNo = "8", Description = "WAGLE ESTATE" }];
        data[typeof(OldWardWiseRateEntity)] = [.. data[typeof(OldWardWiseRateEntity)],
            new OldWardWiseRateEntity { OldWardId = 2, OldWard = secondWard, ConstructionType = new ConstructionTypeEntity { ConstructionCode = "A" },
                Residential = "3.25", NonResidential = "9.25", CollectionWard = "OFFICE 127" }];
        data[typeof(PropertyMastOldEntity)] = [.. data[typeof(PropertyMastOldEntity)],
            new PropertyMastOldEntity { Id = 11, IsActive = true, OldWardNo = "127" }];
        data[typeof(PropertyMapDetailEntity)] = [
            new PropertyMapDetailEntity { PropertyIdNew = 1, PropertyIdOld = 11, IsActive = true, IsCurrent = true, Status = "ACTIVE" },
            new PropertyMapDetailEntity { PropertyIdNew = 1, PropertyIdOld = 10, IsActive = true, IsCurrent = true, Status = "ACTIVE" }];
        var record = await AssertParity(data);
        Assert.Equal("OFFICE 126, OFFICE 127", record.GetProperty("collectionOffice").GetString());
        Assert.Equal("UTHALSAR, WAGLE ESTATE", record.GetProperty("wardOffice").GetString());
    }

    [Fact]
    public async Task ExistingOfficeLabelsRenderTheNewValuesWithoutChangingSourceDataOrDesign()
    {
        var record = await AssertParity(FrontpageThaneFixture.Data("A"));
        var original = record.GetRawText();
        using var design = JsonDocument.Parse(Template);
        var html = new HtmlTemplateRenderer().Render(Template, record);
        Assert.Contains("Ward Office :- UTHALSAR", html);
        Assert.Contains("Collection Office :- OFFICE 126", html);
        Assert.Contains("PROPERTY OWNER", html);
        Assert.Equal(Template, design.RootElement.GetRawText());
        Assert.Equal(original, record.GetRawText());
        var bound = SignpageThanePresentationRules.BindOffices(design.RootElement);
        Assert.Equal(bound.GetRawText(), SignpageThanePresentationRules.BindOffices(bound).GetRawText());
    }

    [Fact]
    public void OfficeLabelBindingsDoNotChangeOtherReports()
    {
        using var design = JsonDocument.Parse(Template.Replace("TSR_SIGNREPORT_AUTOMATION", "SPECIAL_NOTICE_THANE"));
        Assert.Equal(design.RootElement.GetRawText(), SignpageThanePresentationRules.BindOffices(design.RootElement).GetRawText());
    }

    private static async Task<JsonElement> AssertParity(Dictionary<Type, object[]> data)
    {
        var signpage = await FrontpageThaneFixture.Record(FrontpageThaneFixture.Provider<SignpageThaneDataProvider>(data));
        var frontpage = await FrontpageThaneFixture.Record(FrontpageThaneFixture.Provider<FrontpageThaneDataProvider>(data));
        foreach (var field in new[] { "wardOffice", "collectionOffice", "builderName", "structureOwnerName" })
            Assert.Equal(frontpage.GetProperty(field).GetRawText(), signpage.GetProperty(field).GetRawText());
        return signpage;
    }
}
