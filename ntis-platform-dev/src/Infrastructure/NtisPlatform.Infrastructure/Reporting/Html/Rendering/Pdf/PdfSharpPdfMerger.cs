using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace Ntis.Reporting.Rendering.Pdf;

public interface IPdfMerger
{
    Task<PdfMergeResult> MergeAsync(
        IReadOnlyList<string> inputPaths,
        string temporaryOutputPath,
        string finalOutputPath,
        CancellationToken ct = default);
}

public sealed record PdfMergeResult(
    IReadOnlyList<int> InputPageCounts,
    int TotalPageCount,
    long OutputBytes);

public sealed class PdfSharpPdfMerger : IPdfMerger
{
    public Task<PdfMergeResult> MergeAsync(
        IReadOnlyList<string> inputPaths,
        string temporaryOutputPath,
        string finalOutputPath,
        CancellationToken ct = default)
    {
        if (inputPaths.Count == 0)
            throw new ArgumentException("At least one chunk PDF is required.", nameof(inputPaths));

        var outputDirectory = Path.GetDirectoryName(finalOutputPath)
            ?? throw new ArgumentException("The final output path must have a directory.", nameof(finalOutputPath));
        Directory.CreateDirectory(outputDirectory);
        if (File.Exists(temporaryOutputPath)) File.Delete(temporaryOutputPath);

        // A one-chunk report does not need PDF parsing and rewriting. Keep the same atomic
        // temporary-file promotion while using the filesystem's optimized copy path.
        if (inputPaths.Count == 1)
        {
            int pageCount;
            using (var input = PdfReader.Open(inputPaths[0], PdfDocumentOpenMode.Import))
                pageCount = input.PageCount;
            File.Copy(inputPaths[0], temporaryOutputPath, true);
            ct.ThrowIfCancellationRequested();
            File.Move(temporaryOutputPath, finalOutputPath, true);
            return Task.FromResult(new PdfMergeResult(
                [pageCount], pageCount, new FileInfo(finalOutputPath).Length));
        }

        var inputPageCounts = new List<int>(inputPaths.Count);
        using (var output = new PdfDocument())
        {
            // Imported Chromium PDFs already contain compressed image streams. These settings
            // favour merge speed and avoid spending CPU trying a second JPEG compression pass.
            output.Options.FlateEncodeMode = PdfFlateEncodeMode.BestSpeed;
            output.Options.UseFlateDecoderForJpegImages = PdfUseFlateDecoderForJpegImages.Never;
            output.Options.EnableCcittCompressionForBilevelImages = false;

            foreach (var inputPath in inputPaths)
            {
                ct.ThrowIfCancellationRequested();
                using var input = PdfReader.Open(inputPath, PdfDocumentOpenMode.Import);
                inputPageCounts.Add(input.PageCount);
                for (var pageIndex = 0; pageIndex < input.PageCount; pageIndex++)
                {
                    ct.ThrowIfCancellationRequested();
                    output.AddPage(input.Pages[pageIndex]);
                }
            }

            using (var fileStream = new FileStream(temporaryOutputPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 65536))
            {
                output.Save(fileStream);
            }
        }

        ct.ThrowIfCancellationRequested();
        File.Move(temporaryOutputPath, finalOutputPath, true);
        return Task.FromResult(new PdfMergeResult(
            inputPageCounts,
            inputPageCounts.Sum(),
            new FileInfo(finalOutputPath).Length));
    }
}
