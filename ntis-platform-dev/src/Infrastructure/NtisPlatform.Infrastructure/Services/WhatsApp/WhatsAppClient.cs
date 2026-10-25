using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Services.WhatsApp.Common;
using NtisPlatform.Infrastructure.Services.WhatsApp.Formatting;

namespace NtisPlatform.Infrastructure.Services.WhatsApp;

/// <summary>
/// Universal HTTP transport client for dispatching WhatsApp messages via the WABA wrapper endpoint.
/// Completely dynamic: no hardcoded country codes, languages, or template fallbacks.
/// </summary>
public class WhatsAppClient : IWhatsAppClient
{
    private readonly HttpClient _httpClient;
    private readonly WhatsAppSettings _settings;
    private readonly IWhatsAppPayloadFormatter _formatter;
    private readonly ILogger<WhatsAppClient> _logger;

    public WhatsAppClient(
        HttpClient httpClient,
        IOptions<WhatsAppSettings> options,
        IWhatsAppPayloadFormatter formatter,
        ILogger<WhatsAppClient> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _formatter = formatter;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<WhatsAppSendResult> SendTemplateMessageAsync(
        WhatsAppMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (!_settings.IsEnabled)
        {
            _logger.LogInformation("[WhatsAppClient] WhatsApp is disabled in settings. Skipping message to {MobileNo} for template '{TemplateName}'",
                request.MobileNo, request.TemplateName);
            return WhatsAppSendResult.Failure(200, "WhatsApp is disabled in configuration.");
        }

        if (string.IsNullOrWhiteSpace(_settings.ApiUrl) || string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            _logger.LogWarning("[WhatsAppClient] ApiUrl or ApiKey is missing in WhatsApp settings.");
            return WhatsAppSendResult.Failure(400, "WhatsApp credentials or ApiUrl are not configured.");
        }

        var countryCode = request.CountryCode > 0 ? request.CountryCode : _settings.DefaultCountryCode;
        var normalizedNumber = WhatsAppPhoneNormalizer.NormalizePhoneNumber(request.MobileNo, countryCode);
        if (string.IsNullOrWhiteSpace(normalizedNumber))
        {
            _logger.LogWarning("[WhatsAppClient] Recipient mobile number '{MobileNo}' is invalid.", request.MobileNo);
            return WhatsAppSendResult.Failure(400, "Invalid recipient mobile number.");
        }

        try
        {
            _logger.LogInformation(
                "[WhatsAppClient] Sending template '{TemplateName}' ({Language}) to {Recipient}",
                request.TemplateName, request.Language, normalizedNumber);

            using var httpRequest = _formatter.CreateHttpRequest(request, normalizedNumber, _settings);

            var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            var statusCode = (int)response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                string? messageId = null;
                string? whatsAppMessageId = null;

                try
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("data", out var dataElem) && dataElem.ValueKind == JsonValueKind.Object)
                    {
                        if (dataElem.TryGetProperty("message_id", out var mid))
                            messageId = mid.GetString();
                        if (dataElem.TryGetProperty("whatsapp_message_id", out var wmid))
                            whatsAppMessageId = wmid.GetString();
                    }
                }
                catch
                {
                    // Best effort parsing of response body identifiers
                }

                _logger.LogInformation(
                    "[WhatsAppClient] Successfully sent template '{TemplateName}' to {Recipient}. MessageId: {MessageId}",
                    request.TemplateName, normalizedNumber, messageId ?? "N/A");

                return WhatsAppSendResult.Success(messageId, whatsAppMessageId, responseBody);
            }

            _logger.LogWarning(
                "[WhatsAppClient] Gateway responded with status {StatusCode} for {Recipient}. Response: {Response}",
                statusCode, normalizedNumber, responseBody);

            return WhatsAppSendResult.Failure(statusCode, $"Gateway responded with HTTP {statusCode}", responseBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[WhatsAppClient] Exception occurred while dispatching WhatsApp message to {Recipient}", normalizedNumber);
            return WhatsAppSendResult.Failure(500, ex.Message);
        }
    }

    /// <summary>
    /// Helper delegating to WhatsAppPhoneNormalizer.
    /// </summary>
    public static string NormalizePhoneNumber(string? rawMobile, int countryCode)
    {
        return WhatsAppPhoneNormalizer.NormalizePhoneNumber(rawMobile, countryCode);
    }
}
