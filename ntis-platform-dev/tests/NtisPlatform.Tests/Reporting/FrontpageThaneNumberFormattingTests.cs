using System.Text.Json;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Services.HtmlReport;

namespace NtisPlatform.Tests.Reporting;

public class FrontpageThaneNumberFormattingTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public void TrimsZerosWithoutChangingNumericValuesOrMobileNumbers(int count)
    {
        using var source = JsonDocument.Parse("""
            {"RRate":10.0000,"CRate":999.0000,"cTotalRateableValue":2825466.7000,
             "totalCarpetArea":243.2900,"rTotalRateableValue":0.0000,"mobileNo":"0123456789",
             "preciseRate":1.23456789}
            """);
        var rows = Enumerable.Repeat(source.RootElement.Clone(), count).ToArray();
        using var adapted = JsonSerializer.SerializeToDocument(new FrontpageThaneHtmlDataAdapter().Adapt(
            new HtmlReportDataEnvelope(rows, new Dictionary<string, IReadOnlyList<JsonElement>>(), Guid.NewGuid())));
        var record = count == 1 ? adapted.RootElement : adapted.RootElement.GetProperty("records")[0];
        Assert.Equal("10", record.GetProperty("RRate").GetRawText());
        Assert.Equal("999", record.GetProperty("CRate").GetRawText());
        Assert.Equal("2825466.7", record.GetProperty("cTotalRateableValue").GetRawText());
        Assert.Equal("243.29", record.GetProperty("totalCarpetArea").GetRawText());
        Assert.Equal("0", record.GetProperty("rTotalRateableValue").GetRawText());
        Assert.Equal(JsonValueKind.Number, record.GetProperty("RRate").ValueKind);
        Assert.Equal(1.23456789m, record.GetProperty("preciseRate").GetDecimal());
        Assert.Equal("0123456789", record.GetProperty("mobileNo").GetString());
        Assert.Equal("10.0000", source.RootElement.GetProperty("RRate").GetRawText());
    }
}
