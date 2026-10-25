using System.Text.Json;
using System.Text.Json.Nodes;

namespace NtisPlatform.Application.Services.HtmlReport;

public static class SignpageThanePresentationRules
{
    public static JsonElement BindOffices(JsonElement template)
    {
        if (!template.TryGetProperty("reportCode", out var code)
            || code.ValueKind != JsonValueKind.String
            || !string.Equals(code.GetString(), "TSR_SIGNREPORT_AUTOMATION", StringComparison.OrdinalIgnoreCase)
            || !template.TryGetProperty("bands", out var bands) || bands.ValueKind != JsonValueKind.Array)
            return template;

        var design = JsonNode.Parse(template.GetRawText())!.AsObject();
        var changed = false;
        foreach (var band in design["bands"]!.AsArray())
        {
            if (band?["elements"] is not JsonArray elements) continue;
            foreach (var element in elements)
            {
                if (element?["type"]?.GetValue<string>() != "text") continue;
                var label = element["text"]?.GetValue<string>()?.Trim();
                var path = label switch
                {
                    "Ward Office :-" => "wardOffice",
                    "Collection Office :-" => "collectionOffice",
                    _ => null
                };
                if (path is null) continue;
                element["text"] = label + " {" + path + "}";
                changed = true;
            }
        }
        return changed ? JsonSerializer.SerializeToElement(design) : template;
    }
}
