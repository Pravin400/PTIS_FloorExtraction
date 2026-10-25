using System.Text.RegularExpressions;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services.ReportDataProviders;

internal sealed record EmbeddedReportImage(string? DataUrl, string? DocumentGuid, string Status)
{
    internal const long MaxBytes = 5 * 1024 * 1024;
    internal static EmbeddedReportImage NotUploaded { get; } = new(null, null, "Not uploaded");

    internal static async Task<string?> LoadConfiguredLogoAsync(IUlbConfigService configuration,
        IDocumentApplicationService documents, IHttpClientFactory httpClients, CancellationToken ct)
    {
        var config = await configuration.GetUlbConfigAsync(ct);
        var image = await LoadLogoAsync(config?.UlbLogo, documents, httpClients, ct);
        return image.DataUrl;
    }

    internal static async Task<IReadOnlyDictionary<int, EmbeddedReportImage>> LoadBindingsAsync(
        IEnumerable<int> bindingIds, IDocumentApplicationService documents, CancellationToken ct)
    {
        var ids = bindingIds.Where(id => id > 0).Distinct().ToArray();
        if (ids.Length == 0) return new Dictionary<int, EmbeddedReportImage>();
        var contents = await documents.GetDocumentContentsByBindingsAsync(ids, MaxBytes, ct);
        return ids.ToDictionary(id => id, id => contents.TryGetValue(id, out var document)
            ? From(document) : new EmbeddedReportImage(null, null, "Document binding is invalid"));
    }

    internal static EmbeddedReportImage From(BoundDocumentContentDto document)
    {
        var guid = document.DocumentGuid.ToString();
        var mime = document.ContentMimeType ?? document.MimeType;
        if (string.IsNullOrWhiteSpace(mime) || !mime.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return new(null, guid, "Document is not an image");
        if (document.ReadErrorCode == "TooLarge" || document.Content?.LongLength > MaxBytes)
            return new(null, guid, $"Image is larger than {MaxBytes / 1024} KB");
        if (document.Content is null || document.Content.Length == 0)
            return new(null, guid, document.ReadErrorCode == "Unavailable"
                ? "Image file is unavailable" : "Image could not be loaded");
        return new($"data:{mime};base64,{Convert.ToBase64String(document.Content)}", guid, "Available");
    }

    internal static async Task<EmbeddedReportImage> LoadLogoAsync(string? reference,
        IDocumentApplicationService documents, IHttpClientFactory? httpClients, CancellationToken ct)
    {
        var logo = reference?.Trim();
        if (string.IsNullOrWhiteSpace(logo)) return NotUploaded;
        if (logo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            return new(logo, null, "Available");

        var match = Regex.Match(logo,
            @"^(?:https?://[^/]+)?/api/(?:UlbImageMaster|DocumentMaster|documents?)/([0-9a-fA-F-]{36})(?:/view)?(?:\?.*)?$",
            RegexOptions.IgnoreCase);
        var localGuid = Guid.TryParse(logo, out var guid)
            || (match.Success && Guid.TryParse(match.Groups[1].Value, out guid));
        try
        {
            if (localGuid)
            {
                var (stream, _, mime) = await documents.ViewDocumentAsync(guid, ct);
                if (stream is null) return new(null, guid.ToString(), "Image file is unavailable");
                await using (stream)
                {
                    if (string.IsNullOrWhiteSpace(mime) || !mime.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                        return new(null, guid.ToString(), "Document is not an image");
                    using var content = new MemoryStream();
                    var buffer = new byte[8192];
                    int count;
                    while ((count = await stream.ReadAsync(buffer, ct)) > 0)
                    {
                        if (content.Length + count > MaxBytes)
                            return new(null, guid.ToString(), "Logo image is too large");
                        content.Write(buffer, 0, count);
                    }
                    return From(new() { DocumentGuid = guid, ContentMimeType = mime, Content = content.ToArray() });
                }
            }
            if (httpClients is not null && Uri.TryCreate(logo, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https")
            {
                using var client = httpClients.CreateClient();
                var data = await RemoteReportImage.LoadAsync(client, uri, MaxBytes, ct);
                return new(data, null, data is null ? "Logo could not be loaded" : "Available");
            }
            return new(null, null, "Unsupported logo reference");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex) when (ex is IOException or HttpRequestException or OperationCanceledException
            or KeyNotFoundException or UnauthorizedAccessException)
        {
            return new(null, localGuid ? guid.ToString() : null, "Logo file is unavailable");
        }
    }
}
