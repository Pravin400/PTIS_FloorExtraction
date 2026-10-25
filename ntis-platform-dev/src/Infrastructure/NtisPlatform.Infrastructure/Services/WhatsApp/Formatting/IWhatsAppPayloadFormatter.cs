using System.Net.Http;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.Formatting;

/// <summary>
/// Abstraction for building HTTP request messages for WhatsApp gateway delivery.
/// Keeps HTTP headers, authentication schemas, and JSON payload contracts isolated from transport execution.
/// </summary>
public interface IWhatsAppPayloadFormatter
{
    /// <summary>
    /// Builds a prepared HttpRequestMessage for the specified message request and settings.
    /// </summary>
    HttpRequestMessage CreateHttpRequest(
        WhatsAppMessageRequest request,
        string normalizedRecipient,
        WhatsAppSettings settings);
}
