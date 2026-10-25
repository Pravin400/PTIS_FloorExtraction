using MockQueryable;
using Moq;
using Ntis.Reporting.Rendering.Html;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using System.Text.Json;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneRenderingTests
{
    private const string Template = """
        {"page":{"widthMm":210,"heightMm":297},"bands":[
          {"type":"subreport","dataPath":"taxRows","heightMm":5,"elements":[
            {"type":"field","path":"taxName","x":0,"y":0,"width":90,"height":5}
          ]}
        ]}
        """;

    [Fact]
    public void SinglePropertyEnvelopeRendersItsNestedTaxHeads()
    {
        var html = Render("""[{"taxRows":[{"taxName":"General Tax"},{"taxName":"Education Tax"}]}]""");
        Assert.Contains("General Tax", html);
        Assert.Contains("Education Tax", html);
    }

    [Fact]
    public void MultiplePropertiesKeepTheirTaxHeadsOnSeparatePages()
    {
        var html = Render("""[{"taxRows":[{"taxName":"First property tax"}]},{"taxRows":[{"taxName":"Second property tax"}]}]""");
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None);
        Assert.Equal(3, pages.Length);
        Assert.Contains("First property tax", pages[1]);
        Assert.DoesNotContain("Second property tax", pages[1]);
        Assert.Contains("Second property tax", pages[2]);
        Assert.DoesNotContain("First property tax", pages[2]);
    }

    [Fact]
    public void OfficeHeaderRendersOldWardOfficeValues()
    {
        var html = Render("""[{"wardOffice":"WAGLE ESTATE","collectionOffice":"OFFICE 126"}]""",
            """
            {"page":{"widthMm":210,"heightMm":297},"bands":[{"type":"detail","heightMm":5,"elements":[
              {"type":"text","text":"Ward Office :-  {wardOffice}","x":0,"y":0,"w":60,"h":5},
              {"type":"field","path":"collectionOffice","x":60,"y":0,"w":60,"h":5}
            ]}]}
            """);
        Assert.Contains("Ward Office :-  WAGLE ESTATE", html);
        Assert.Contains("OFFICE 126", html);
        Assert.DoesNotContain("{wardOffice}", html);
    }

    private const string OverflowTemplate = """
        {"reportCode":"SpecialNoticeThane","page":{"widthMm":210,"heightMm":100,"borderInsetMm":{"top":5,"bottom":5}},"bands":[
          {"type":"pageHeader","heightMm":10,"elements":[
            {"type":"text","text":"Municipal header","x":5,"y":5,"w":100,"h":5}]},
          {"type":"reportHeader","heightMm":25,"elements":[
            {"type":"field","path":"propertyNo","x":5,"y":0,"w":100,"h":5}]},
          {"id":"tax_header","type":"groupHeader","heightMm":10,"elements":[
            {"type":"text","text":"Property Tax Head","x":5,"y":0,"w":100,"h":10}]},
          {"type":"subreport","dataPath":"taxRows","heightMm":5,"elements":[
            {"type":"field","path":"taxName","x":5,"y":0,"w":100,"h":5}]},
          {"type":"reportFooter","heightMm":20,"elements":[
            {"type":"text","text":"Information below taxes","x":5,"y":0,"w":100,"h":20}]},
          {"type":"pageFooter","heightMm":5,"elements":[
            {"type":"text","text":"Page footer","x":5,"y":0,"w":100,"h":5}]}
        ]}
        """;

    [Theory]
    [InlineData(24)]
    [InlineData(100)]
    public void OverflowContinuesTaxRowsInsidePageBorderAndKeepsFollowingInformationAfterTable(int count)
    {
        var taxes = Enumerable.Range(1, count).Select(i => new { taxName = $"Head-{i:D3}", rowType = "tax" }).ToList();
        taxes.AddRange(new[] { "subtotal", "penalty", "grandTotal" }.Select(type => new { taxName = type, rowType = type }));
        var html = Render(JsonSerializer.Serialize(new[] { new { propertyNo = "NK7-5", taxRows = taxes } }), OverflowTemplate);
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();

        Assert.True(pages.Length > 1);
        Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, "NK7-5").Count);
        Assert.Contains("Municipal header", pages[0]);
        Assert.Contains("Property Tax Head", pages[0]);
        Assert.Contains("Page footer", pages[^1]);
        Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, "Page footer").Count);
        Assert.All(pages.Skip(1), page =>
        {
            Assert.DoesNotContain("Municipal header", page);
            Assert.DoesNotContain("Property Tax Head", page);
        });
        foreach (var tax in taxes)
            Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, $">{tax.taxName}<").Count);
        foreach (var page in pages)
        {
            foreach (System.Text.RegularExpressions.Match position in System.Text.RegularExpressions.Regex.Matches(page,
                "<div style=\"position:absolute;left:0;top:([0-9.]+)mm;width:100%;height:([0-9.]+)mm"))
            {
                var top = double.Parse(position.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
                var height = double.Parse(position.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);
                Assert.True(top + height <= 94.501, $"Band extends beyond bottom border: {top} + {height}");
            }
        }
        Assert.Contains("Information below taxes", pages[^1]);
        Assert.All(pages[..^1], page => Assert.DoesNotContain("Information below taxes", page));
        Assert.True(html.IndexOf($">Head-{count:D3}<", StringComparison.Ordinal) < html.IndexOf("Information below taxes", StringComparison.Ordinal));
    }

    [Fact]
    public void OnlyRowsBeyondLimitMoveAndContinuationDoesNotRepeatFlatHeader()
    {
        var template = OverflowTemplate.Replace("\"bands\":[", "\"elements\":[{\"type\":\"text\",\"text\":\"Assessment header\",\"x\":120,\"y\":5,\"w\":60,\"h\":5}],\"bands\":[");
        var taxes = Enumerable.Range(1, 9).Select(i => new { taxName = $"Head-{i:D3}", rowType = "tax" }).ToList();
        taxes.AddRange(new[] { "subtotal", "penalty", "grandTotal" }.Select(type => new { taxName = type, rowType = type }));
        var html = Render(JsonSerializer.Serialize(new[] { new { taxRows = taxes } }), template);
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();
        Assert.Equal(2, pages.Length);
        Assert.Contains(">Head-009<", pages[0]);
        Assert.DoesNotContain(">subtotal<", pages[0]);
        Assert.Contains(">subtotal<", pages[1]);
        Assert.DoesNotContain(">penalty<", pages[0]);
        Assert.Contains(">penalty<", pages[1]);
        Assert.Contains(">grandTotal<", pages[1]);
        Assert.Contains("Information below taxes", pages[1]);
        Assert.Contains("Assessment header", pages[0]);
        Assert.DoesNotContain("Assessment header", pages[1]);
        Assert.DoesNotContain("Property Tax Head", pages[1]);
    }

    [Fact]
    public void ShortTaxTableKeepsSinglePageAndOriginalFollowingInformationPosition()
    {
        var html = Render("""[{"propertyNo":"NK7-5","taxRows":[{"taxName":"Tree Cess"}]}]""", OverflowTemplate);
        Assert.Equal(2, html.Split("<section class=\"report-page\"", StringSplitOptions.None).Length);
        Assert.Contains("top:50mm;width:100%;height:20mm", html);
        Assert.Contains("Information below taxes", html);
    }

    [Theory]
    [InlineData(16, false, 1)]
    [InlineData(16, true, 1)]
    [InlineData(17, false, 2)]
    [InlineData(17, true, 2)]
    public void FooterReclaimsLeadingSpaceOnlyWhenItsEntireContentCanFit(int rowCount, bool bulk, int pageCount)
    {
        // Published A4 layout: sixteen rows leave 41.61mm for a 41.804mm footer,
        // whose first element starts 2.1mm below its top.
        var template = JsonSerializer.Serialize(new
        {
            reportCode = "SPECIAL_NOTICE_THANE",
            page = new { widthMm = 210, heightMm = 297, borderInsetMm = new { top = 8, bottom = 8 } },
            bands = new object[]
            {
                new { type = bulk ? "detail" : "pageHeader", dataPath = bulk ? "records" : "", heightMm = 162.98 },
                new { type = "groupHeader", heightMm = 11.91 },
                new { type = "subreport", dataPath = "taxRows", heightMm = 4.5,
                    elements = new[] { new { type = "field", path = "taxName", x = 12, y = 0, w = 90, h = 4.5 } } },
                new { type = "reportFooter", heightMm = 34.92, elements = new object[]
                {
                    new { type = "text", text = "Notice and signatures", x = 12, y = 2.1, w = 188, h = 13 },
                    new { type = "field", path = "printDate", x = 29, y = 37.835, w = 29, h = 3.969 }
                } }
            }
        });
        var record = new { printDate = "23-10-2026",
            taxRows = Enumerable.Range(1, rowCount).Select(i => new { taxName = $"Head-{i:D3}" }).ToArray() };
        var data = bulk ? JsonSerializer.SerializeToElement(new { records = new[] { record } })
            : JsonSerializer.SerializeToElement(record);
        var html = new HtmlTemplateRenderer().Render(template, data);
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();

        Assert.Equal(pageCount, pages.Length);
        Assert.Contains("Notice and signatures", pages[^1]);
        Assert.Contains("23-10-2026", pages[^1]);
        foreach (var row in record.taxRows)
            Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, $">{row.taxName}<").Count);
        foreach (var page in pages)
            foreach (System.Text.RegularExpressions.Match position in System.Text.RegularExpressions.Regex.Matches(page,
                "<div style=\"position:absolute;left:0;top:([0-9.]+)mm;width:100%;height:([0-9.]+)mm"))
            {
                var top = double.Parse(position.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
                var height = double.Parse(position.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);
                Assert.True(top + height <= 288.501);
            }
    }

    [Fact]
    public void OverflowForMultiplePropertiesDoesNotMixTheirRowsOrFollowingInformation()
    {
        var records = new[] { "FIRST", "SECOND" }.Select(property => new
        {
            propertyNo = property,
            taxRows = Enumerable.Range(1, 30).Select(i => new { taxName = $"{property}-{i:D3}", rowType = "tax" })
        });
        var html = Render(JsonSerializer.Serialize(records), OverflowTemplate);
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();
        Assert.True(pages.Length >= 4);
        Assert.All(pages, page => Assert.False(page.Contains("FIRST-") && page.Contains("SECOND-")));
        Assert.Equal(2, System.Text.RegularExpressions.Regex.Matches(html, "Information below taxes").Count);
    }

    [Fact]
    public void OtherReportsWithTaxRowsKeepTheirExistingRendering()
    {
        var template = OverflowTemplate.Replace("SpecialNoticeThane", "AnotherReport");
        var rows = Enumerable.Range(1, 30).Select(i => new { taxName = $"Tax {i}" });
        var html = Render(JsonSerializer.Serialize(new[] { new { taxRows = rows } }), template);
        Assert.Equal(2, html.Split("<section class=\"report-page\"", StringSplitOptions.None).Length);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(2, 1)]
    [InlineData(1, 30)]
    [InlineData(2, 30)]
    public void BulkRecordsDetailBandContinuesOnlyOverflowAndKeepsPropertyCollectionsSeparate(int recordsPerPage, int secondCount)
    {
        var template = OverflowTemplate
            .Replace("\"reportCode\":", $"\"recordsPerPage\":{recordsPerPage},\"reportCode\":")
            .Replace("\"type\":\"reportHeader\",\"heightMm\":25", "\"type\":\"detail\",\"dataPath\":\"records\",\"heightMm\":25")
            .Replace("\"type\":\"text\",\"text\":\"Information below taxes\"", "\"type\":\"field\",\"path\":\"followingInfo\"");
        var records = new[] { (Name: "FIRST", Count: 24), (Name: "SECOND", Count: secondCount) }
            .Select(property => new
            {
                propertyNo = property.Name + " property",
                followingInfo = property.Name + " following information",
                taxRows = Enumerable.Range(1, property.Count).Select(i => new { taxName = $"{property.Name}-{i:D3}" })
            }).ToArray();
        var html = new HtmlTemplateRenderer().Render(template, JsonSerializer.SerializeToElement(new { records }));
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();

        Assert.True(pages.Length >= 4);
        foreach (var property in records)
        {
            Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, $">{property.propertyNo}<").Count);
            Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, $">{property.followingInfo}<").Count);
            foreach (var tax in property.taxRows)
                Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(html, $">{tax.taxName}<").Count);
            Assert.True(html.IndexOf($">{property.taxRows.Last().taxName}<", StringComparison.Ordinal)
                < html.IndexOf($">{property.followingInfo}<", StringComparison.Ordinal));
        }
        Assert.All(pages, page =>
        {
            Assert.False(page.Contains("FIRST") && page.Contains("SECOND"));
            if (!page.Contains(" property<"))
            {
                Assert.DoesNotContain("Municipal header", page);
                Assert.DoesNotContain("Property Tax Head", page);
            }
            foreach (System.Text.RegularExpressions.Match position in System.Text.RegularExpressions.Regex.Matches(page,
                "<div style=\"position:absolute;left:0;top:([0-9.]+)mm;width:100%;height:([0-9.]+)mm"))
            {
                var top = double.Parse(position.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
                var height = double.Parse(position.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);
                Assert.True(top + height <= 94.501);
            }
        });
    }

    [Fact]
    public void ShortBulkRecordsDetailBatchKeepsItsConfiguredLayout()
    {
        var template = OverflowTemplate.Replace("\"heightMm\":100", "\"heightMm\":200")
            .Replace("\"reportCode\":", "\"recordsPerPage\":2,\"reportCode\":")
            .Replace("\"type\":\"reportHeader\",\"heightMm\":25", "\"type\":\"detail\",\"dataPath\":\"records\",\"heightMm\":25");
        var data = JsonSerializer.SerializeToElement(new
        {
            records = new[] { "FIRST", "SECOND" }.Select(name => new
                { propertyNo = name, taxRows = new[] { new { taxName = name + " tax" } } })
        });
        var renderer = new HtmlTemplateRenderer();
        var html = renderer.Render(template, data);
        Assert.Equal(renderer.Render(template.Replace("SpecialNoticeThane", "AnotherReport"), data), html);
        Assert.Equal(2, html.Split("<section class=\"report-page\"", StringSplitOptions.None).Length);
    }

    [Theory]
    [InlineData(0, 0, false)]
    [InlineData(0, 0, true)]
    [InlineData(5, 0, false)]
    [InlineData(5, 0, true)]
    [InlineData(0, 5, false)]
    [InlineData(0, 5, true)]
    [InlineData(5, 8, false)]
    [InlineData(5, 8, true)]
    public void PaginationUsesRenderedPageHeightBeforeSubtractingBottomInsetOrMargin(double inset, double margin, bool bulk)
    {
        var limit = 99.5 - Math.Max(inset, margin);
        var template = JsonSerializer.Serialize(new
        {
            reportCode = "SpecialNoticeThane",
            page = new { widthMm = 210, heightMm = 100, borderInsetMm = new { bottom = inset }, margin = new { bottomMm = margin } },
            bands = new object[]
            {
                new { type = bulk ? "detail" : "reportHeader", dataPath = bulk ? "records" : "",
                    heightMm = limit - .5, elements = Array.Empty<object>() },
                new { type = "subreport", dataPath = "taxRows", heightMm = .5,
                    elements = new[] { new { type = "field", path = "taxName", x = 0, y = 0, w = 100, h = .5 } } }
            }
        });
        var record = new { taxRows = new[] { new { taxName = "Fits at boundary" }, new { taxName = "Crosses boundary" } } };
        var data = bulk ? JsonSerializer.SerializeToElement(new { records = new[] { record } })
            : JsonSerializer.SerializeToElement(record);
        var html = new HtmlTemplateRenderer().Render(template, data);
        var pages = html.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();

        Assert.Equal(2, pages.Length);
        Assert.Contains("Fits at boundary", pages[0]);
        Assert.DoesNotContain("Crosses boundary", pages[0]);
        Assert.Contains("Crosses boundary", pages[1]);
        foreach (var page in pages)
            foreach (System.Text.RegularExpressions.Match position in System.Text.RegularExpressions.Regex.Matches(page,
                "<div style=\"position:absolute;left:0;top:([0-9.]+)mm;width:100%;height:([0-9.]+)mm"))
            {
                var top = double.Parse(position.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
                var height = double.Parse(position.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);
                Assert.True(top + height <= limit + .001);
            }
    }

    [Theory]
    [InlineData("TaxRows", "taxRows", false)]
    [InlineData("taxRows", "TAXROWS", false)]
    [InlineData("tAxRoWs", "TaxRows", false)]
    [InlineData("TaxRows", "taxRows", true)]
    [InlineData("taxRows", "TAXROWS", true)]
    [InlineData("tAxRoWs", "TaxRows", true)]
    [InlineData("TaxRows", "TAXROWS", false, true)]
    [InlineData("tAxRoWs", "TaxRows", false, true)]
    public void TaxRowBindingCasingDoesNotChangeOverflowPages(string binding, string collectionName, bool bulk,
        bool isolatedRecord = false)
    {
        var template = bulk || isolatedRecord
            ? OverflowTemplate.Replace("\"type\":\"reportHeader\",\"heightMm\":25", "\"type\":\"detail\",\"dataPath\":\"records\",\"heightMm\":25")
            : OverflowTemplate;
        var rows = Enumerable.Range(1, 30).Select(i => new { taxName = $"Tax-{i:D3}" }).ToArray();
        var canonicalRecord = new Dictionary<string, object> { ["propertyNo"] = "NK7-5", ["taxRows"] = rows };
        var mixedCaseRecord = new Dictionary<string, object> { ["propertyNo"] = "NK7-5", [collectionName] = rows };
        var canonicalData = bulk ? JsonSerializer.SerializeToElement(new { records = new[] { canonicalRecord } })
            : JsonSerializer.SerializeToElement(canonicalRecord);
        var mixedCaseData = bulk ? JsonSerializer.SerializeToElement(new { records = new[] { mixedCaseRecord } })
            : JsonSerializer.SerializeToElement(mixedCaseRecord);
        var renderer = new HtmlTemplateRenderer();
        var expected = renderer.Render(template, canonicalData);
        var actual = renderer.Render(template.Replace("\"dataPath\":\"taxRows\"", $"\"dataPath\":\"{binding}\""), mixedCaseData);

        Assert.Equal(expected, actual);
        var pages = actual.Split("<section class=\"report-page\"", StringSplitOptions.None).Skip(1).ToArray();
        Assert.True(pages.Length > 1);
        Assert.Contains("NK7-5", pages[0]);
        foreach (var row in rows)
            Assert.Equal(1, System.Text.RegularExpressions.Regex.Matches(actual, $">{row.taxName}<").Count);
        Assert.Contains("Information below taxes", pages[^1]);
    }

    private static string Render(string rowsJson, string template = Template)
    {
        using var document = JsonDocument.Parse(rowsJson);
        var rows = document.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
        var envelope = new HtmlReportDataEnvelope(rows,
            new Dictionary<string, IReadOnlyList<JsonElement>> { ["main"] = rows }, Guid.NewGuid());
        var registry = new HtmlReportDataAdapterRegistry([
            new DefaultHtmlReportDataAdapter(), new SpecialNoticeThaneHtmlDataAdapter()]);
        var data = JsonSerializer.SerializeToElement(registry.Adapt("SpecialNoticeThaneDataProvider", envelope));
        return new HtmlTemplateRenderer().Render(template, data);
    }
}

public class SpecialNoticeThaneCollectionOfficeTests
{
    private static SpecialNoticeThaneDataProvider Provider()
    {
        var wards = Repository(
            new OldWardMasterEntity { Id = 1, OldWardNo = "126", OldZoneId = 7 },
            new OldWardMasterEntity { Id = 2, OldWardNo = "127", OldZoneId = 8 },
            new OldWardMasterEntity { Id = 3, OldWardNo = "128", OldZoneId = 999 },
            new OldWardMasterEntity { Id = 4, OldWardNo = "129", OldZoneId = 7 });
        var rates = Repository(
            new OldWardWiseRateEntity { OldWardId = 1, OldZoneId = 8, CollectionWard = " OFFICE 126 ", ConstructionType = new ConstructionTypeEntity { ConstructionCode = "RCC" } },
            new OldWardWiseRateEntity { OldWardId = 1, CollectionWard = "OFFICE 126", ConstructionType = new ConstructionTypeEntity { ConstructionCode = "A" } },
            new OldWardWiseRateEntity { OldWardId = 2, CollectionWard = "OFFICE 127" },
            new OldWardWiseRateEntity { OldWardId = 3, CollectionWard = "UNJOINED OFFICE" });
        var zones = Repository(
            new OldZoneMasterEntity { Id = 7, OldZoneNo = " WAGLE ESTATE " },
            new OldZoneMasterEntity { Id = 8, OldZoneNo = "UTHALSAR" });
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        return (SpecialNoticeThaneDataProvider)constructor.Invoke(constructor.GetParameters()
            .Select(p => p.Name switch
            {
                "oldWardMasterRepository" => (object)wards,
                "oldWardWiseRateRepository" => rates,
                "oldZoneMasterRepository" => zones,
                _ => null
            }).ToArray());
    }

    private static IReportDataRepository<T> Repository<T>(params T[] rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(r => r.GetQueryable()).Returns(rows.BuildMock());
        return repository.Object;
    }

    [Fact]
    public async Task OldWardJoinsUseCollectionWardAndTheWardsOldZone()
    {
        var result = await Provider().ResolveOldWardOfficesAsync([" 126 ", "126"], default);
        Assert.Equal("OFFICE 126", result.CollectionOffice);
        Assert.Equal("WAGLE ESTATE", result.WardOffice);
    }

    [Fact]
    public async Task MultipleOldWardsDisplayDistinctOffices()
    {
        var result = await Provider().ResolveOldWardOfficesAsync(["127", "126"], default);
        Assert.Equal("OFFICE 126, OFFICE 127", result.CollectionOffice);
        Assert.Equal("UTHALSAR, WAGLE ESTATE", result.WardOffice);
    }

    [Fact]
    public async Task NoOldWardLeavesBothOfficesEmpty()
    {
        var result = await Provider().ResolveOldWardOfficesAsync([null, " "], default);
        Assert.Null(result.CollectionOffice);
        Assert.Null(result.WardOffice);
    }

    [Theory]
    [InlineData("128")]
    [InlineData("129")]
    [InlineData("999")]
    public async Task MissingJoinDoesNotDisplayAnUnrelatedOffice(string ward)
    {
        var result = await Provider().ResolveOldWardOfficesAsync([ward], default);
        Assert.Equal(string.Empty, result.CollectionOffice);
        Assert.Equal(string.Empty, result.WardOffice);
    }
}
