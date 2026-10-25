namespace NtisPlatform.Application.DTOs.WhatsApp;

/// <summary>
/// Structured result of a WhatsApp message dispatch attempt.
/// </summary>
/// <param name="IsSuccess">Indicates whether the gateway successfully queued/sent the message.</param>
/// <param name="MessageId">Internal gateway message identifier if available.</param>
/// <param name="WhatsAppMessageId">Meta/WABA message identifier (wamid) if available.</param>
/// <param name="StatusCode">HTTP response status code returned by the gateway.</param>
/// <param name="ResponseBody">Raw response body for diagnostics or auditing.</param>
/// <param name="ErrorMessage">Human-readable error explanation in case of failure.</param>
public record WhatsAppSendResult(
    bool IsSuccess,
    string? MessageId,
    string? WhatsAppMessageId,
    int StatusCode,
    string? ResponseBody,
    string? ErrorMessage)
{
    public static WhatsAppSendResult Success(string? messageId, string? whatsAppMessageId, string? responseBody)
        => new(true, messageId, whatsAppMessageId, 200, responseBody, null);

    public static WhatsAppSendResult Failure(int statusCode, string? errorMessage, string? responseBody = null)
        => new(false, null, null, statusCode, responseBody, errorMessage);
}
