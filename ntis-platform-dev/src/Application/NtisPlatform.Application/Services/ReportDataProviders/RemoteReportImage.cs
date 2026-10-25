namespace NtisPlatform.Application.Services.ReportDataProviders;

public static class RemoteReportImage
{
    public static async Task<string?> LoadAsync(
        HttpClient client, Uri uri, long maximumBytes, CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(10));
        using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
        response.EnsureSuccessStatusCode();
        var mime = response.Content.Headers.ContentType?.MediaType;
        if (mime is null || !mime.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            || response.Content.Headers.ContentLength > maximumBytes)
            return null;

        await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
        using var content = new MemoryStream();
        var buffer = new byte[8192];
        int count;
        while ((count = await stream.ReadAsync(buffer, timeout.Token)) > 0)
        {
            if (content.Length + count > maximumBytes) return null;
            content.Write(buffer, 0, count);
        }
        return content.Length == 0 ? null : $"data:{mime};base64,{Convert.ToBase64String(content.ToArray())}";
    }
}
