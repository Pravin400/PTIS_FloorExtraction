using PdfSharp.Fonts;

namespace NtisPlatform.Application.Services.Section129;

/// <summary>
/// Resolves the "Arial" family used by the Section 129A PDF export
/// (<see cref="Section129Service.GetSchedulePdfAsync"/>) straight from the OS's own Fonts folder
/// (English/Latin only — no Devanagari/Marathi support needed) instead of bundling a .ttf in this
/// repo. PdfSharp/MigraDoc 6.x require an explicit IFontResolver for any font — there is no
/// zero-config fallback — but nothing needs to ship with the app as long as this API runs on
/// Windows, where arial.ttf/arialbd.ttf are always present.
/// </summary>
public sealed class Section129PdfFontResolver : IFontResolver
{
    public const string FamilyName = "Arial";

    private static readonly string FontsFolder = Environment.GetFolderPath(Environment.SpecialFolder.Fonts);
    private const string RegularFaceName = "Arial#Regular";
    private const string BoldFaceName = "Arial#Bold";

    public byte[] GetFont(string faceName) =>
        File.ReadAllBytes(Path.Combine(FontsFolder, faceName == BoldFaceName ? "arialbd.ttf" : "arial.ttf"));

    public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
    {
        if (!string.Equals(familyName, FamilyName, StringComparison.OrdinalIgnoreCase))
            return PlatformFontResolver.ResolveTypeface(familyName, isBold, isItalic)
                ?? new FontResolverInfo(isBold ? BoldFaceName : RegularFaceName);

        return new FontResolverInfo(isBold ? BoldFaceName : RegularFaceName);
    }
}
