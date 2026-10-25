namespace NtisPlatform.Core.Interfaces;

/// <summary>
/// On-disk storage for a browse-upload <c>PropertyMediaJob</c>'s files: every file the user
/// selected via the browser, persisted under a per-job folder (one subfolder per file, named by
/// its index, original filename preserved) so the Worker's existing recursive folder scan
/// (<c>ProcessJobAsync</c>) can find them the same way it already finds local-folder-import files.
/// Match status, PhotoTypeId and Remarks all live on the job/detail database rows, not here.
/// </summary>
public interface IPropertyMediaBrowseSessionStorage
{
    /// <summary>
    /// Writes every item under <c>{BasePath}/{previewId}/{index}/{fileName}</c> and returns the folder path.
    /// </summary>
    Task<string> SaveJobFilesAsync(
        string previewId,
        IReadOnlyList<(int Index, Stream Stream, string FileName)> items,
        CancellationToken cancellationToken = default);

    Task<string> SaveJobFilesAsync(
        int jobId,
        IReadOnlyList<(int Index, Stream Stream, string FileName)> items,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the physical directory path for a given staging batch key.
    /// </summary>
    string GetJobFolder(string batchKey);
}
