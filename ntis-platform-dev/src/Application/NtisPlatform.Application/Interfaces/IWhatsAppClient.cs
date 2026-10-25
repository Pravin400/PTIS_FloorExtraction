using NtisPlatform.Application.DTOs.WhatsApp;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Universal transport contract for dispatching WhatsApp messages across the platform.
/// Handles phone number normalization, authentication headers, JSON payload formatting, and resilient HTTP execution.
/// </summary>
public interface IWhatsAppClient
{
    /// <summary>
    /// Dispatches a template WhatsApp message asynchronously.
    /// </summary>
    /// <param name="request">Universal message request containing recipient, template, and parameters.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Structured result with delivery status and diagnostic identifiers.</returns>
    Task<WhatsAppSendResult> SendTemplateMessageAsync(
        WhatsAppMessageRequest request,
        CancellationToken cancellationToken = default);
}
