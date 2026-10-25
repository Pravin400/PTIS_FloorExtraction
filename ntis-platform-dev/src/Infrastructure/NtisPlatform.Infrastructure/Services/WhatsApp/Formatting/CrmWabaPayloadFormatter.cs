using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.Formatting;

/// <summary>
/// Payload and header formatter for the CRM WABA gateway endpoint.
/// Fully dynamic: values are sourced strictly from request and settings without hardcoded static defaults.
/// </summary>
public class CrmWabaPayloadFormatter : IWhatsAppPayloadFormatter
{
    public HttpRequestMessage CreateHttpRequest(
        WhatsAppMessageRequest request,
        string normalizedRecipient,
        WhatsAppSettings settings)
    {
        var targetLanguage = !string.IsNullOrWhiteSpace(request.Language)
            ? request.Language
            : settings.DefaultLanguage;

        var bodyParams = request.BodyParameters != null && request.BodyParameters.Count > 0
            ? request.BodyParameters.ToArray()
            : Array.Empty<string>();

        var countryCode = request.CountryCode > 0 ? request.CountryCode : settings.DefaultCountryCode;

        // Construct dynamic payload compatible with CRM WABA wrapper and standard Meta schemas
        var payload = new Dictionary<string, object?>
        {
            ["to"] = normalizedRecipient,
            ["number"] = normalizedRecipient,
            ["country_code"] = countryCode,
            ["mobile_no"] = normalizedRecipient,
            ["type"] = "template",
            ["template_name"] = request.TemplateName,
            ["language"] = targetLanguage,
            ["params"] = bodyParams
        };

        if (request.ButtonParameters != null && request.ButtonParameters.Count > 0)
        {
            payload["button_params"] = request.ButtonParameters.ToArray();
            payload["buttons"] = request.ButtonParameters.Select((btn, idx) => new
            {
                type = "url",
                index = idx,
                value = btn,
                url = btn,
                text = btn
            }).ToArray();
        }

        // Standard components structure
        var componentsList = new List<object>
        {
            new
            {
                type = "body",
                parameters = bodyParams.Select(p => new { type = "text", text = p }).ToArray()
            }
        };

        if (request.ButtonParameters != null && request.ButtonParameters.Count > 0)
        {
            for (var i = 0; i < request.ButtonParameters.Count; i++)
            {
                componentsList.Add(new
                {
                    type = "button",
                    sub_type = "url",
                    index = i.ToString(),
                    parameters = new object[]
                    {
                        new { type = "text", text = request.ButtonParameters[i] }
                    }
                });
            }
        }

        payload["components"] = componentsList.ToArray();

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, settings.ApiUrl)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json")
        };

        if (!string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
            httpRequest.Headers.TryAddWithoutValidation("apikey", settings.ApiKey);
            httpRequest.Headers.TryAddWithoutValidation("key", settings.ApiKey);
        }

        if (!string.IsNullOrWhiteSpace(settings.WabaNumber))
        {
            httpRequest.Headers.TryAddWithoutValidation("wabaNumber", settings.WabaNumber);
        }

        return httpRequest;
    }
}
