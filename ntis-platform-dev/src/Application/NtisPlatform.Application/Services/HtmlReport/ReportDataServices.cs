using System.Globalization;
using System.Text.Json;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services.HtmlReport;

public sealed class ReportDataProviderResolver(IEnumerable<IReportDataProvider> providers) : IReportDataProviderResolver
{
    private readonly IReadOnlyDictionary<string, IReportDataProvider> _providers = providers
        .GroupBy(x => x.ProviderCode, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(x => x.Key, x => x.Single(), StringComparer.OrdinalIgnoreCase);

    public IReportDataProvider Resolve(string providerCode) =>
        _providers.TryGetValue(providerCode, out var provider) ? provider :
        throw new KeyNotFoundException($"Report data provider '{providerCode}' is not registered.");
}

public sealed class ReportDataExecutor(IReportDataProviderResolver resolver) : IReportDataExecutor
{
    public async Task<HtmlReportDataEnvelope> ExecuteAsync(Guid requestId, string providerCode,
        Dictionary<string, string> parameters, int pageSize, CancellationToken ct = default)
    {
        var provider = resolver.Resolve(providerCode);
        var sections = new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.OrdinalIgnoreCase);
        if (provider is IPagedReportDataProvider paged)
        {
            var descriptors = paged.GetSections();
            foreach (var descriptor in descriptors)
            {
                var rows = new List<JsonElement>();
                for (var page = 1; ; page++)
                {
                    var result = await paged.GetDataPageAsync(requestId, parameters, descriptor.Section, page, pageSize, ct);
                    var elements = ToElements(result.Rows);
                    rows.AddRange(elements);
                    if (!result.HasMore || elements.Count == 0 || !descriptor.Paginated) break;
                }
                sections[descriptor.Section] = rows;
            }
        }
        else
        {
            using var document = JsonSerializer.SerializeToDocument(await provider.GetDataAsync(parameters, ct));
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                sections["main"] = document.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
            }
            else if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.Array)
                        sections[property.Name] = property.Value.EnumerateArray().Select(x => x.Clone()).ToList();
                    else if (property.Value.ValueKind == JsonValueKind.Object)
                        sections[property.Name] = [property.Value.Clone()];
                }

                if (sections.Count == 0)
                    sections["main"] = [document.RootElement.Clone()];
            }
        }

        if (!sections.TryGetValue("main", out var main))
        {
            if (provider is IPagedReportDataProvider pagedProvider)
            {
                var descriptors = pagedProvider.GetSections();
                var driver = descriptors.FirstOrDefault(x => x.Paginated && x.Section.Equals("main", StringComparison.OrdinalIgnoreCase))
                    ?? descriptors.FirstOrDefault(x => x.Paginated)
                    ?? descriptors.FirstOrDefault();
                if (driver is not null && sections.TryGetValue(driver.Section, out var driverRows))
                    main = driverRows;
            }
            main ??= sections.Values.FirstOrDefault();
        }

        return new HtmlReportDataEnvelope(main ?? [], sections, requestId);
    }

    public async Task<HtmlReportDataPageEnvelope> ExecutePageAsync(Guid requestId, string providerCode,
        Dictionary<string, string> parameters, int page, int pageSize, bool requirePaging,
        CancellationToken ct = default)
    {
        var provider = resolver.Resolve(providerCode);
        if (provider is not IPagedReportDataProvider paged)
        {
            if (requirePaging)
                throw new NotSupportedException(
                    $"Bulk HTML report provider '{providerCode}' must implement IPagedReportDataProvider.");

            using var document = JsonSerializer.SerializeToDocument(await provider.GetDataAsync(parameters, ct));
            var sections = new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.OrdinalIgnoreCase);
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                sections["main"] = document.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
            }
            else if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.Array)
                        sections[property.Name] = property.Value.EnumerateArray().Select(x => x.Clone()).ToList();
                    else if (property.Value.ValueKind == JsonValueKind.Object)
                        sections[property.Name] = [property.Value.Clone()];
                }

                if (sections.Count == 0)
                    sections["main"] = [document.RootElement.Clone()];
            }

            sections.TryGetValue("main", out var main);
            main ??= sections.Values.FirstOrDefault();
            var rows = main ?? [];
            return new HtmlReportDataPageEnvelope(
                new HtmlReportDataEnvelope(rows, sections, requestId), rows, rows.Count, false, false);
        }

        var descriptors = paged.GetSections();
        if (requirePaging && !descriptors.Any(x => x.Paginated))
            throw new NotSupportedException(
                $"Bulk HTML report provider '{providerCode}' must declare at least one paginated section.");
        var driver = descriptors.FirstOrDefault(x => x.Paginated && x.Section.Equals("main", StringComparison.OrdinalIgnoreCase))
            ?? descriptors.FirstOrDefault(x => x.Paginated)
            ?? descriptors.FirstOrDefault(x => x.Section.Equals("main", StringComparison.OrdinalIgnoreCase))
            ?? descriptors.FirstOrDefault()
            ?? throw new InvalidOperationException($"Report provider '{providerCode}' declares no data sections.");

        var pageNumber = Math.Max(1, page);
        var boundedPageSize = Math.Max(1, pageSize);
        var pageSections = new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.OrdinalIgnoreCase);
        ReportDataPage? driverPage = null;
        foreach (var descriptor in descriptors)
        {
            var requestedPage = descriptor.Section.Equals(driver.Section, StringComparison.OrdinalIgnoreCase)
                || descriptor.Paginated
                ? pageNumber
                : 1;
            var result = await paged.GetDataPageAsync(
                requestId, parameters, descriptor.Section, requestedPage, boundedPageSize, ct);
            var rows = ToElements(result.Rows);
            pageSections[descriptor.Section] = rows;
            if (descriptor.Section.Equals(driver.Section, StringComparison.OrdinalIgnoreCase))
                driverPage = result;
        }

        var resolvedDriver = driverPage
            ?? throw new InvalidOperationException($"Report provider '{providerCode}' did not return its driver section.");
        var driverRows = pageSections[driver.Section];
        pageSections.TryGetValue("main", out var mainRows);
        int? totalCount = resolvedDriver.TotalCount >= 0 ? resolvedDriver.TotalCount : (int?)null;
        return new HtmlReportDataPageEnvelope(
            new HtmlReportDataEnvelope(mainRows ?? driverRows, pageSections, requestId),
            driverRows, totalCount, resolvedDriver.HasMore, true);
    }

    private static IReadOnlyList<JsonElement> ToElements(IEnumerable<object> values)
    {
        using var document = JsonSerializer.SerializeToDocument(values);
        return document.RootElement.EnumerateArray().Select(x => x.Clone()).ToList();
    }
}

public sealed class DefaultHtmlReportDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "*";
    public object Adapt(HtmlReportDataEnvelope envelope) => new { main = envelope.Main, sections = envelope.Sections };
}

public sealed class FrontpageThaneHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "FrontpageThaneDataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope)
    {
        var records = envelope.Main.Select(TrimNumericZeros).ToArray();
        return records.Length == 1 ? records[0] : new { records };
    }

    private static JsonElement TrimNumericZeros(JsonElement record)
    {
        if (record.ValueKind != JsonValueKind.Object) return record.Clone();
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            foreach (var property in record.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.Number && property.Value.TryGetDecimal(out var number))
                {
                    writer.WritePropertyName(property.Name);
                    writer.WriteRawValue(number.ToString("G29", CultureInfo.InvariantCulture));
                }
                else property.WriteTo(writer);
            }
            writer.WriteEndObject();
        }
        using var document = JsonDocument.Parse(stream.ToArray());
        return document.RootElement.Clone();
    }
}

public sealed class SpecialNoticeThaneHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "SpecialNoticeThaneDataProvider";

    // Each provider row owns its summary and tax collections. Keep that row
    // intact so inline subreports can resolve taxRows on the current property.
    public object Adapt(HtmlReportDataEnvelope envelope) => envelope.Main.Count == 1
        ? envelope.Main[0].Clone()
        : new { records = envelope.Main };
}


public sealed class SignpageThaneHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "SignpageThaneDataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope) => envelope.Main.Count == 1
        ? envelope.Main[0].Clone()
        : new { records = envelope.Main };
}

public sealed class PermissionNoticeHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "PermissionNoticeDataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope) =>
        envelope.Main.Count == 0 ? new { } : envelope.Main[0].Clone();
}

public sealed class KarakarniHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "KarakarniDataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope)
    {
        envelope.Sections.TryGetValue("propertyDetails", out var detailRows);
        var detailsByProperty = (detailRows ?? [])
            .Select(row => new { Row = row, PropertyId = PropertyKey(row) })
            .Where(x => x.PropertyId.Length > 0)
            .GroupBy(x => x.PropertyId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Select(x => JsonSerializer.Deserialize<Dictionary<string, object?>>(x.Row.GetRawText()) ?? []).ToList(),
                StringComparer.OrdinalIgnoreCase);

        var records = new List<Dictionary<string, object?>>(envelope.Main.Count);
        foreach (var mainRow in envelope.Main)
        {
            var record = JsonSerializer.Deserialize<Dictionary<string, object?>>(mainRow.GetRawText()) ?? [];
            var propertyId = PropertyKey(mainRow);
            record["propertyDetails"] = detailsByProperty.TryGetValue(propertyId, out var matchingDetails)
                ? matchingDetails
                : [];
            records.Add(record);
        }

        // HtmlReportService wraps per-main-row adaptations for Separate/Batch mode. Returning the
        // record directly for a single property avoids a nested { records: [{ records: [...] }] }
        // shape, while merged ward-wise data still exposes one top-level record per PDF page.
        if (records.Count == 1) return records[0];
        if (records.Count == 0) return new Dictionary<string, object?>();

        var first = records[0];
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["records"] = records
        };
        foreach (var (name, value) in first)
        {
            if (!result.ContainsKey(name)) result[name] = value;
        }
        return result;
    }

    private static string PropertyKey(JsonElement row)
    {
        if (row.ValueKind != JsonValueKind.Object) return string.Empty;
        foreach (var property in row.EnumerateObject())
        {
            if (!property.Name.Equals("propertyId", StringComparison.OrdinalIgnoreCase)) continue;
            return property.Value.ValueKind == JsonValueKind.String
                ? property.Value.GetString() ?? string.Empty
                : property.Value.ToString();
        }
        return string.Empty;
    }
}

public sealed class PrarupYadiHtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "PrarupYadiDataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope)
    {
        envelope.Sections.TryGetValue("PrarupYadi", out var mainRows);
        envelope.Sections.TryGetValue("PrarupYadiTaxInfo", out var taxRows);

        static Dictionary<string, object?> ToDictionary(JsonElement row)
        {
            var parsed = JsonSerializer.Deserialize<Dictionary<string, object?>>(row.GetRawText()) ?? [];
            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in parsed)
            {
                dict[kvp.Key] = kvp.Value;
            }
            return dict;
        }

        static string RowKey(IReadOnlyDictionary<string, object?> row)
        {
            if (row.TryGetValue("ownerId", out var ownerId) && !string.IsNullOrWhiteSpace(ownerId?.ToString()))
                return $"id:{ownerId}";
            var propertyNo = row.TryGetValue("propertyNo", out var property) ? property?.ToString() : string.Empty;
            var partitionNo = row.TryGetValue("partitionNo", out var partition) ? partition?.ToString() : string.Empty;
            return $"property:{propertyNo}:{partitionNo}";
        }

        static bool IsBlank(object? value) => value is null || string.IsNullOrWhiteSpace(value.ToString());

        var mainRecords = (mainRows ?? []).Select(ToDictionary).ToList();
        var floorRows = (taxRows ?? []).Select(ToDictionary).ToList();
        var floorsByProperty = floorRows
            .GroupBy(RowKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

        // Build one printable record per property. Each record owns its floor/construction
        // rows so the A3 detail band can repeat five complete properties on one page.
        var records = new List<Dictionary<string, object?>>();
        var sourceProperties = mainRecords.Count > 0
            ? mainRecords
            : floorRows.GroupBy(RowKey, StringComparer.OrdinalIgnoreCase).Select(group => group.First()).ToList();
        var serial = 1;
        foreach (var main in sourceProperties)
        {
            var record = new Dictionary<string, object?>(main, StringComparer.OrdinalIgnoreCase);
            floorsByProperty.TryGetValue(RowKey(main), out var floors);
            floors ??= [];

            foreach (var floor in floors)
            {
                foreach (var (name, value) in main)
                {
                    if (!floor.ContainsKey(name) || IsBlank(floor[name])) floor[name] = value;
                }
            }
            if (floors.Count > 0)
            {
                foreach (var (name, value) in floors[0])
                {
                    if (!record.ContainsKey(name) || IsBlank(record[name])) record[name] = value;
                }
            }

            record["srNo"] = serial.ToString();
            record["floors"] = floors;
            record["PrarupYadi"] = floors;
            record["TaxTotal"] = record.TryGetValue("TotalTax", out var totalTax) ? totalTax : "0";
            records.Add(record);
            serial++;
        }

        var first = records.FirstOrDefault() ?? new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        object? Get(params string[] names)
        {
            foreach (var name in names)
            {
                if (first.TryGetValue(name, out var value) && !IsBlank(value)) return value;
            }
            return string.Empty;
        }

        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["CouncilName"] = Get("CouncilName", "ulbNameLocal", "ulbName"),
            ["CouncilAddress"] = Get("CouncilAddress", "ulbAddress"),
            ["CouncilLogo"] = Get("CouncilLogo", "ulbLogo"),
            ["WardNo"] = Get("WardNo"),
            ["NodeSectorNo"] = Get("NodeSectorNo"),
            ["NodeNo"] = Get("NodeNo", "nodeNo"),
            ["plotNo"] = Get("plotNo"),
            ["propertyNo"] = Get("propertyNo"),
            ["MarathiSocietyName"] = Get("MarathiSocietyName"),
            ["Address"] = Get("OwnerAddress", "Address"),
            ["records"] = records,
            ["PrarupYadi"] = floorRows
        };

        foreach (var (name, value) in first)
        {
            if (!result.ContainsKey(name)) result[name] = value;
        }
        return result;
    }
}

public sealed class Notice119HtmlDataAdapter : IHtmlReportDataAdapter
{
    public string ProviderCode => "Notice119DataProvider";

    public object Adapt(HtmlReportDataEnvelope envelope)
    {
        var rows = envelope.Main.Count > 0
            ? envelope.Main
            : (envelope.Sections.TryGetValue("main", out var s) ? s : []);

        var records = new List<Dictionary<string, object?>>(rows.Count);
        foreach (var r in rows)
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, object?>>(r.GetRawText()) ?? [];
            records.Add(dict);
        }

        if (records.Count == 1) return records[0];
        if (records.Count == 0) return new Dictionary<string, object?>();
        return new Dictionary<string, object?> { ["records"] = records };
    }
}

public sealed class HtmlReportDataAdapterRegistry(IEnumerable<IHtmlReportDataAdapter> adapters) : IHtmlReportDataAdapterRegistry
{
    public object Adapt(string providerCode, HtmlReportDataEnvelope envelope) =>
        (adapters.FirstOrDefault(x => x.ProviderCode.Equals(providerCode, StringComparison.OrdinalIgnoreCase))
         ?? adapters.Single(x => x.ProviderCode == "*")).Adapt(envelope);
}
