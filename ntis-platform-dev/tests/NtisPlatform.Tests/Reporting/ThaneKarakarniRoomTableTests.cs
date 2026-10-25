using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Ntis.Reporting.Rendering.Html;

namespace NtisPlatform.Tests.Reporting;

public class ThaneKarakarniRoomTableTests
{
    private static JsonElement Template()
    {
        using var document = JsonDocument.Parse(ThaneKarakarniTestTemplate.Json);
        return document.RootElement.Clone();
    }

    [Fact]
    public void BothTablesUseSavedFloorSubmissionCarpetAreasWithoutApplyingAnotherDeduction()
    {
        var template = Template();
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            totalCarpetAreaSqMeter = 100m, totalBuiltupAreaSqMeter = 120m,
            propertyDetails = new[] { Floor("C", 100m, 120m,
                [Room(1, "Office", 5m, 4m, 14m, 2), Room(2, "Bath", 3m, 2m, 6m)]) }
        }));
        var originalData = document.RootElement.GetRawText();
        var originalTemplate = template.GetRawText();

        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(template, document.RootElement, 297));
        var rooms = page.Data.GetProperty("roomDetails");

        Assert.Equal(2, rooms.GetArrayLength());
        Assert.Equal("5 x 4", rooms[0].GetProperty("roomDimensions").GetString());
        Assert.Equal("Office", rooms[0].GetProperty("roomType").GetString());
        Assert.Equal(14m, rooms[0].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(16.8m, rooms[0].GetProperty("builtupAreaSqMeter").GetDecimal());
        Assert.Equal("3 x 2", rooms[1].GetProperty("roomDimensions").GetString());
        Assert.Equal("Bath", rooms[1].GetProperty("roomType").GetString());
        Assert.Equal(6m, rooms[1].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(7.2m, rooms[1].GetProperty("builtupAreaSqMeter").GetDecimal());
        Assert.Equal(20m, page.Data.GetProperty("roomTotalCarpetAreaSqMeter").GetDecimal());
        Assert.Equal(24m, page.Data.GetProperty("roomTotalBuiltupAreaSqMeter").GetDecimal());
        Assert.Equal(100m, page.Data.GetProperty("totalCarpetAreaSqMeter").GetDecimal());
        Assert.Equal(100m, page.Data.GetProperty("propertyDetails")[0].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(120m, page.Data.GetProperty("propertyDetails")[0].GetProperty("builtupAreaSqMeter").GetDecimal());
        Assert.Single(page.Data.GetProperty("propertyDetails").EnumerateArray());
        Assert.Equal(originalData, document.RootElement.GetRawText());
        Assert.Equal(originalTemplate, template.GetRawText());

        var html = new HtmlTemplateRenderer().Render(originalTemplate, document.RootElement);
        foreach (var expected in new[] { "5 x 4", "3 x 2", "Office", "Bath", ">14<", ">16.8<", ">6<", ">7.2<", ">20<", ">24<", "100.00", "120.00" })
            Assert.Contains(expected, html);
    }

    [Fact]
    public void RoomAreaFormattingTrimsZerosWithoutChangingValuesOrOtherBandsAndReports()
    {
        var template = Template();
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            propertyDetails = new[] { Floor("C", 57.77m, 69.324m, []), Floor("R", 9m, 10.8m, []) }
        }));
        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(template, data.RootElement, 297));
        foreach (var band in page.Template.GetProperty("bands").EnumerateArray())
        {
            var bandId = band.GetProperty("id").GetString();
            foreach (var element in band.GetProperty("elements").EnumerateArray())
            {
                if (!element.TryGetProperty("path", out var path)
                    || !(path.GetString()?.Contains("AreaSqMeter") ?? false)) continue;
                Assert.Equal(bandId is "thane_floor_rows" or "thane_floor_totals" ? "0.##" : "0.00",
                    element.GetProperty("format").GetString());
            }
        }
        Assert.Equal(69.324m, page.Data.GetProperty("roomDetails")[0].GetProperty("builtupAreaSqMeter").GetDecimal());
        var html = new HtmlTemplateRenderer().Render(template.GetRawText(), data.RootElement);
        Assert.Contains(">57.77<", html);
        Assert.Contains(">69.32<", html);
        Assert.Contains(">9<", html);
        Assert.Contains(">10.8<", html);

        var otherReport = template.GetRawText().Replace("THANE_KARAKARNI", "KARAKARNI");
        var otherHtml = new HtmlTemplateRenderer().Render(otherReport, data.RootElement);
        Assert.Contains(">69.32<", otherHtml);
        Assert.Contains(">9.00<", otherHtml);
        Assert.Contains(">10.80<", otherHtml);
    }

    [Fact]
    public void OtherUsesAndCommercialFloorsWithoutRoomEntriesKeepTheirExistingRow()
    {
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            propertyDetails = new[] { Floor("R", 10m, 12m, [Room(1, "Bedroom", 5m, 2m, 10m)]),
                Floor("C", 20m, 24m, []) }
        }));

        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(Template(), document.RootElement, 297));
        var rooms = page.Data.GetProperty("roomDetails");

        Assert.Equal(2, rooms.GetArrayLength());
        Assert.Equal("existing dimensions", rooms[0].GetProperty("roomDimensions").GetString());
        Assert.Equal("existing dimensions", rooms[1].GetProperty("roomDimensions").GetString());
        Assert.Equal(30m, page.Data.GetProperty("roomTotalCarpetAreaSqMeter").GetDecimal());
    }

    [Fact]
    public void OpenPlotRoomsStayHiddenAndRepeatedAssessmentResultsDoNotDuplicateRooms()
    {
        var room = Room(1, "Office", 5m, 2m, 10m);
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            propertyDetails = new[] { Floor("C", 10m, 12m, [room]), Floor("C", 10m, 12m, [room]),
                Floor("OPC", 50m, 60m, [Room(2, "Open plot", 5m, 10m, 50m)]) }
        }));

        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(Template(), document.RootElement, 297));
        var displayed = Assert.Single(page.Data.GetProperty("roomDetails").EnumerateArray());

        Assert.Equal("Office", displayed.GetProperty("roomType").GetString());
        Assert.Equal(10m, page.Data.GetProperty("roomTotalCarpetAreaSqMeter").GetDecimal());
    }

    [Fact]
    public void AllRoomsContinueOntoExtraPagesWithGrandTotalsOnlyOnTheLastPage()
    {
        var template = JsonNode.Parse(Template().GetRawText())!;
        template["watermark"] = JsonSerializer.SerializeToNode(new { type = "text", text = "THANE DRAFT" });
        var templateJson = template.ToJsonString();
        var entries = Enumerable.Range(1, 60).Select(id => Room(id, $"Room {id}", 1m, 1m, 1m)).ToArray();
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            propertyDetails = new[] { Floor("C", 60m, 72m, entries) }
        }));

        var pages = ThaneKarakarniRoomTable.Pages(JsonSerializer.SerializeToElement(template), document.RootElement, 297).ToList();

        Assert.Equal(3, pages.Count);
        Assert.Equal(60, pages.Sum(page => page.Data.GetProperty("roomDetails").GetArrayLength()));
        var roomTypes = pages.SelectMany(page => page.Data.GetProperty("roomDetails").EnumerateArray())
            .Select(row => row.GetProperty("roomType").GetString()).ToList();
        Assert.Equal(60, roomTypes.Distinct().Count());
        Assert.Contains("Room 60", roomTypes);
        foreach (var page in pages.Take(pages.Count - 1))
            Assert.DoesNotContain(page.Template.GetProperty("bands").EnumerateArray(),
                band => band.GetProperty("id").GetString() == "thane_floor_totals");
        Assert.Contains(pages[^1].Template.GetProperty("bands").EnumerateArray(),
            band => band.GetProperty("id").GetString() == "thane_floor_totals");
        Assert.Equal(60m, pages[^1].Data.GetProperty("roomTotalCarpetAreaSqMeter").GetDecimal());
        Assert.Equal(72m, pages[^1].Data.GetProperty("roomTotalBuiltupAreaSqMeter").GetDecimal());
        Assert.All(pages, page => Assert.Equal("THANE DRAFT", page.Template.GetProperty("watermark").GetProperty("text").GetString()));
        var html = new HtmlTemplateRenderer().Render(templateJson, document.RootElement);
        Assert.Equal(3, Regex.Matches(html, "class=\"report-page\"").Count);
        Assert.DoesNotContain("THANE DRAFT", html);
    }

    [Fact]
    public void MatchingBandNamesInOtherReportsDoNotExpandRooms()
    {
        var template = Template().GetRawText().Replace("THANE_KARAKARNI", "KARAKARNI");
        using var design = JsonDocument.Parse(template);
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            propertyDetails = new[] { Floor("C", 10m, 12m, [Room(1, "Office", 5m, 2m, 10m)]) }
        }));

        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(design.RootElement, data.RootElement, 297));

        Assert.False(page.Data.TryGetProperty("roomDetails", out _));
        Assert.Equal(template, page.Template.GetRawText());
    }

    [Fact]
    public void SavedSeventeenRoomFloorShows243Point29InsteadOf233Point56()
    {
        var entries = Enumerable.Range(1, 14).Select(id => Room(id, "Office", 3m, 3m, 9m))
            .Concat([Room(15, "Office", 8.74m, 6.61m, 57.77m),
                Room(16, "Hall", 8m, 6m, 47.52m), Room(17, "Hall", 4m, 3m, 12m)]).ToArray();
        using var data = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            totalCarpetAreaSqMeter = 243.29m, totalBuiltupAreaSqMeter = 291.95m,
            propertyDetails = new[] { Floor("C", 243.29m, 291.95m, entries) }
        }));

        var page = Assert.Single(ThaneKarakarniRoomTable.Pages(Template(), data.RootElement, 297));
        var rooms = page.Data.GetProperty("roomDetails");

        Assert.Equal(17, rooms.GetArrayLength());
        Assert.Equal(9m, rooms[0].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(57.77m, rooms[14].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(47.52m, rooms[15].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(12m, rooms[16].GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(243.29m, page.Data.GetProperty("roomTotalCarpetAreaSqMeter").GetDecimal());
        Assert.Equal(243.29m, page.Data.GetProperty("totalCarpetAreaSqMeter").GetDecimal());
        var html = new HtmlTemplateRenderer().Render(Template().GetRawText(), data.RootElement);
        Assert.Contains("243.29", html);
        Assert.DoesNotContain("233.56", html);
    }

    private static object Floor(string use, decimal carpet, decimal builtup, object[] rooms) => new
    {
        floorCode = "8", typeOfUseCode = use, carpetAreaSqMeter = carpet, builtupAreaSqMeter = builtup,
        roomDimensions = "existing dimensions", roomType = "existing room type", rooms
    };

    private static object Room(int id, string type, decimal length, decimal width, decimal net, int count = 1) => new
    {
        roomId = id, roomType = type, lengthMtr = length, widthMtr = width,
        areaSqMtr = length * width, totalAreaSqMtr = net, noOfRooms = count
    };
}

// A minimal design for rendering behavior tests; production templates are stored in the database.
internal static class ThaneKarakarniTestTemplate
{
    internal static string Json => JsonSerializer.Serialize(new
    {
        schemaVersion = 3,
        reportCode = "THANE_KARAKARNI",
        page = new { size = "A4", orientation = "portrait", widthMm = 210, heightMm = 297 },
        bands = new object[]
        {
            new { id = "header", type = "reportHeader", heightMm = 30,
                elements = Fields("ownerNameEnglish", "addressEnglish", "wardNo", "flatOrShopNo", "propertyCategory") },
            new { id = "assessment", type = "detail", dataPath = "propertyDetails", heightMm = 6,
                elements = Fields("carpetAreaSqMeter", "builtupAreaSqMeter") },
            new { id = "thane_floor_rows", type = "detail", dataPath = "propertyDetails", heightMm = 6,
                elements = Fields("roomDimensions", "roomType", "carpetAreaSqMeter", "builtupAreaSqMeter") },
            new { id = "thane_floor_totals", type = "reportFooter", heightMm = 6,
                elements = Fields("totalCarpetAreaSqMeter", "totalBuiltupAreaSqMeter") },
            new { id = "thane_media", type = "reportFooter", heightMm = 110,
                elements = new object[] {
                    new { id = "thane_86", type = "text", text = "", x = 10, y = 80, w = 100, h = 20 },
                    new { id = "thane_printed_date", type = "field", path = "printDate", label = "Printed Date", x = 10, y = 102, w = 100, h = 5 }
                } }
        }
    });

    private static object[] Fields(params string[] paths) => paths.Select((path, index) => (object)new
    {
        id = path, type = "field", path, format = "0.00", x = index * 35, y = 0, w = 35, h = 5
    }).ToArray();
}
