using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.Templates;

/// <summary>
/// Universal contract for WhatsApp template message builders.
/// Any future template approved in Meta WABA is added by implementing this interface in a single file.
/// </summary>
/// <typeparam name="TContext">The domain context or entity used to generate message parameters.</typeparam>
public interface IWhatsAppTemplateBuilder<in TContext>
{
    /// <summary>
    /// Event key mapped under WhatsApp:Templates in configuration (e.g. "Submission").
    /// </summary>
    string EventKey { get; }

    /// <summary>
    /// Constructs a WhatsAppMessageRequest dynamically from the domain context and configuration settings.
    /// Returns null if the template or recipient is invalid/unconfigured.
    /// </summary>
    WhatsAppMessageRequest? Build(TContext context, WhatsAppSettings settings);
}
