using Microsoft.Extensions.Options;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Infrastructure.Services;

/// <inheritdoc cref="IPropertyMediaBrowseSessionStorage"/>
public class PropertyMediaBrowseSessionStorage : IPropertyMediaBrowseSessionStorage
{
    private readonly string _basePath;

    public PropertyMediaBrowseSessionStorage(IOptions<PropertyMediaBrowseSessionOptions> options)
    {
        var basePath = options.Value.BasePath;
        // If no path is specified, default to "Uploads/BrowseSessions" inside the application
        if (string.IsNullOrWhiteSpace(basePath))
        {
            basePath = Path.Combine("Uploads", "BrowseSessions");
        }
        _basePath = Path.GetFullPath(basePath);
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveJobFilesAsync(
        string previewId,
        IReadOnlyList<(int Index, Stream Stream, string FileName)> items,
        CancellationToken cancellationToken = default)
    {
        var jobFolder = Path.Combine(_basePath, previewId);
        Directory.CreateDirectory(jobFolder);

        const int bufferSize = 81920; // 80KB optimal buffer
        using var semaphore = new SemaphoreSlim(8);

        var tasks = items.Select(async item =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var itemFolder = Path.Combine(jobFolder, item.Index.ToString());
                Directory.CreateDirectory(itemFolder);
                var destinationPath = Path.Combine(itemFolder, Path.GetFileName(item.FileName));
                await using var destination = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize, useAsync: true);
                await item.Stream.CopyToAsync(destination, bufferSize, cancellationToken);
            }
            finally
            {
                semaphore.Release();
            }
        });

        try
        {
            await Task.WhenAll(tasks);
            return jobFolder;
        }
        catch
        {
            try
            {
                if (Directory.Exists(jobFolder))
                {
                    Directory.Delete(jobFolder, recursive: true);
                }
            }
            catch
            {
                // Suppress secondary cleanup exceptions to preserve the original exception
            }

            throw;
        }
    }

    public Task<string> SaveJobFilesAsync(
    int jobId,
    IReadOnlyList<(int Index, Stream Stream, string FileName)> items,
    CancellationToken cancellationToken = default)
    => SaveJobFilesAsync(jobId.ToString(), items, cancellationToken);

    public string GetJobFolder(string batchKey)
    {
        // 1. If batchKey is already a full physical path that exists, return it directly
        if (Path.IsPathRooted(batchKey) && Directory.Exists(batchKey))
        {
            return batchKey;
        }

        // 2. Otherwise resolve against the configured BasePath
        return Path.Combine(_basePath, batchKey);
    }
}
