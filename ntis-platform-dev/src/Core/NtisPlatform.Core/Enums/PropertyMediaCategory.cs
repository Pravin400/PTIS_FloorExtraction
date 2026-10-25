namespace NtisPlatform.Core.Enums;

/// <summary>
/// Top-level media/document category shown in the Property Media &amp; Document Center's
/// Category dropdown (Upload/Download drawer) and Gap Analysis coverage table.
/// </summary>
public enum PropertyMediaCategory
{
    Photo = 1,
    Plan = 2,
    Document = 3
}

/// <summary>File format for the Detailed Coverage / Missing Properties / Jobs export endpoints.</summary>
public enum PropertyMediaExportFormat
{
    Excel,
    Pdf
}