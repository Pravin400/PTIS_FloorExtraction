using System;
using System.Collections.Generic;

namespace NtisPlatform.Application.Helpers;

public static class FloorNamingHelper
{
    private static readonly char[] MarathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

    private static readonly Dictionary<int, string> EnglishOrdinals = new()
    {
        { 1, "First" },
        { 2, "Second" },
        { 3, "Third" },
        { 4, "Fourth" },
        { 5, "Fifth" },
        { 6, "Sixth" },
        { 7, "Seventh" },
        { 8, "Eighth" },
        { 9, "Ninth" },
        { 10, "Tenth" },
        { 11, "Eleventh" },
        { 12, "Twelfth" },
        { 13, "Thirteenth" },
        { 14, "Fourteenth" },
        { 15, "Fifteenth" },
        { 16, "Sixteenth" },
        { 17, "Seventeenth" },
        { 18, "Eighteenth" },
        { 19, "Nineteenth" },
        { 20, "Twentieth" },
        { 21, "Twenty-First" },
        { 22, "Twenty-Second" },
        { 23, "Twenty-Third" },
        { 24, "Twenty-Fourth" },
        { 25, "Twenty-Fifth" },
        { 26, "Twenty-Sixth" },
        { 27, "Twenty-Seventh" },
        { 28, "Twenty-Eighth" },
        { 29, "Twenty-Ninth" },
        { 30, "Thirtieth" },
        { 31, "Thirty-First" },
        { 32, "Thirty-Second" },
        { 33, "Thirty-Third" },
        { 34, "Thirty-Fourth" },
        { 35, "Thirty-Fifth" },
        { 36, "Thirty-Sixth" },
        { 37, "Thirty-Seventh" },
        { 38, "Thirty-Eighth" },
        { 39, "Thirty-Ninth" },
        { 40, "Fortieth" },
        { 41, "Forty-First" },
        { 42, "Forty-Second" },
        { 43, "Forty-Third" },
        { 44, "Forty-Fourth" },
        { 45, "Forty-Fifth" },
        { 46, "Forty-Sixth" },
        { 47, "Forty-Seventh" },
        { 48, "Forty-Eighth" },
        { 49, "Forty-Ninth" },
        { 50, "Fiftieth" },
        { 51, "Fifty-First" },
        { 52, "Fifty-Second" },
        { 53, "Fifty-Third" },
        { 54, "Fifty-Fourth" },
        { 55, "Fifty-Fifth" },
        { 56, "Fifty-Sixth" },
        { 57, "Fifty-Seventh" },
        { 58, "Fifty-Eighth" },
        { 59, "Fifty-Ninth" },
        { 60, "Sixtieth" },
        { 61, "Sixty-First" },
        { 62, "Sixty-Second" },
        { 63, "Sixty-Third" },
        { 64, "Sixty-Fourth" },
        { 65, "Sixty-Fifth" },
        { 66, "Sixty-Sixth" },
        { 67, "Sixty-Seventh" },
        { 68, "Sixty-Eighth" },
        { 69, "Sixty-Ninth" },
        { 70, "Seventieth" },
        { 71, "Seventy-First" },
        { 72, "Seventy-Second" },
        { 73, "Seventy-Third" },
        { 74, "Seventy-Fourth" },
        { 75, "Seventy-Fifth" },
        { 76, "Seventy-Sixth" },
        { 77, "Seventy-Seventh" },
        { 78, "Seventy-Eighth" },
        { 79, "Seventy-Ninth" },
        { 80, "Eightieth" },
        { 81, "Eighty-First" },
        { 82, "Eighty-Second" },
        { 83, "Eighty-Third" },
        { 84, "Eighty-Fourth" },
        { 85, "Eighty-Fifth" },
        { 86, "Eighty-Sixth" },
        { 87, "Eighty-Seventh" },
        { 88, "Eighty-Eighth" },
        { 89, "Eighty-Ninth" },
        { 90, "Ninetieth" },
        { 91, "Ninety-First" },
        { 92, "Ninety-Second" },
        { 93, "Ninety-Third" },
        { 94, "Ninety-Fourth" },
        { 95, "Ninety-Fifth" },
        { 96, "Ninety-Sixth" },
        { 97, "Ninety-Seventh" },
        { 98, "Ninety-Eighth" },
        { 99, "Ninety-Ninth" }
    };

    private static readonly Dictionary<int, string> EnglishHundredsPrefix = new()
    {
        { 1, "One Hundred" },
        { 2, "Two Hundred" },
        { 3, "Three Hundred" },
        { 4, "Four Hundred" },
        { 5, "Five Hundred" },
        { 6, "Six Hundred" },
        { 7, "Seven Hundred" },
        { 8, "Eight Hundred" },
        { 9, "Nine Hundred" }
    };

    private static readonly Dictionary<int, string> EnglishExactHundredsOrdinals = new()
    {
        { 1, "One Hundredth" },
        { 2, "Two Hundredth" },
        { 3, "Three Hundredth" },
        { 4, "Four Hundredth" },
        { 5, "Five Hundredth" },
        { 6, "Six Hundredth" },
        { 7, "Seven Hundredth" },
        { 8, "Eight Hundredth" },
        { 9, "Nine Hundredth" }
    };



    private static readonly Dictionary<int, string> MarathiOrdinals = new()
    {
        { 1, "पहिला" },
        { 2, "दुसरा" },
        { 3, "तिसरा" },
        { 4, "चौथा" },
        { 5, "पाचवा" },
        { 6, "सहावा" },
        { 7, "सातवा" },
        { 8, "आठवा" },
        { 9, "नववा" },
        { 10, "दहावा" },
        { 11, "अकरावा" },
        { 12, "बारावा" },
        { 13, "तेरावा" },
        { 14, "चौदावा" },
        { 15, "पंधरावा" },
        { 16, "सोळावा" },
        { 17, "सतरावा" },
        { 18, "अठरावा" },
        { 19, "एकोणिसावा" },
        { 20, "विसावा" },
        { 21, "एकविसावा" },
        { 22, "बाविसावा" },
        { 23, "तेविसावा" },
        { 24, "चोविसावा" },
        { 25, "पंचविसावा" },
        { 26, "सव्विसावा" },
        { 27, "सत्ताविसावा" },
        { 28, "अठ्ठाविसावा" },
        { 29, "एकोणतीसावा" },
        { 30, "तिसावा" },
        { 31, "एकतीसावा" },
        { 32, "बत्तीसावा" },
        { 33, "तेहेतीसावा" },
        { 34, "चौतीसावा" },
        { 35, "पस्तीसावा" },
        { 36, "छत्तीसावा" },
        { 37, "सदतीसावा" },
        { 38, "अडतीसावा" },
        { 39, "एकोणचाळिसावा" },
        { 40, "चाळिसावा" },
        { 41, "एक्केचाळिसावा" },
        { 42, "बेचाळिसावा" },
        { 43, "त्रेचाळिसावा" },
        { 44, "चव्वेचाळिसावा" },
        { 45, "पंचेचाळिसावा" },
        { 46, "शेहेचाळिसावा" },
        { 47, "सत्तेचाळिसावा" },
        { 48, "अठ्ठेचाळिसावा" },
        { 49, "एकोणपन्नासावा" },
        { 50, "पन्नासावा" },
        { 51, "एकावन्नावा" },
        { 52, "बावन्नावा" },
        { 53, "त्रेपन्नावा" },
        { 54, "चौपन्नावा" },
        { 55, "पंचावन्नावा" },
        { 56, "छप्पन्नावा" },
        { 57, "सत्तावन्नावा" },
        { 58, "अठ्ठावन्नावा" },
        { 59, "एकोणसाठावा" },
        { 60, "साठावा" },
        { 61, "एकसष्ठावा" },
        { 62, "बासष्ठावा" },
        { 63, "त्रेसष्ठावा" },
        { 64, "चौसष्ठावा" },
        { 65, "पासष्ठावा" },
        { 66, "सहासष्ठावा" },
        { 67, "सदोसष्ठावा" },
        { 68, "अडोसष्ठावा" },
        { 69, "एकोणसत्तरावा" },
        { 70, "सत्तरावा" },
        { 71, "एकाहत्तरावा" },
        { 72, "बहात्तरावा" },
        { 73, "त्र्याहत्तरावा" },
        { 74, "चौहत्तरावा" },
        { 75, "पंचाहत्तरावा" },
        { 76, "शहात्तरावा" },
        { 77, "सत्याहत्तरावा" },
        { 78, "अठ्ठ्याहत्तरावा" },
        { 79, "एकोणऐंशीवा" },
        { 80, "ऐंशीवा" },
        { 81, "एक्याऐंशीवा" },
        { 82, "ब्याऐंशीवा" },
        { 83, "त्र्याऐंशीवा" },
        { 84, "चौऱ्याऐंशीवा" },
        { 85, "पंच्याऐंशीवा" },
        { 86, "शहाऐंशीवा" },
        { 87, "सत्त्याऐंशीवा" },
        { 88, "अठ्ठ्याऐंशीवा" },
        { 89, "एकोणनव्वदावा" },
        { 90, "नव्वदावा" },
        { 91, "एक्याण्णवा" },
        { 92, "ब्याण्णवा" },
        { 93, "त्र्याण्णवा" },
        { 94, "चौऱ्याण्णवा" },
        { 95, "पंच्याण्णवा" },
        { 96, "शहाण्णवा" },
        { 97, "सत्याण्णवा" },
        { 98, "अठ्ठ्याण्णवा" },
        { 99, "नव्व्याण्णवा" }
    };

    private static readonly Dictionary<int, string> HundredsPrefix = new()  
    {
        { 1, "एकशे" },
        { 2, "दोनशे" },
        { 3, "तीनशे" },
        { 4, "चारशे" },
        { 5, "पाचशे" },
        { 6, "सहाशे" },
        { 7, "सातशे" },
        { 8, "आठशे" },
        { 9, "नऊशे" }
    };

    private static readonly Dictionary<int, string> ExactHundredsOrdinals = new()
    {
        { 1, "शंभरावा" },
        { 2, "दोनशेवा" },
        { 3, "तीनशेवा" },
        { 4, "चारशेवा" },
        { 5, "पाचशेवा" },
        { 6, "सहाशेवा" },
        { 7, "सातशेवा" },
        { 8, "आठशेवा" },
        { 9, "नऊशेवा" }
    };


    public static string ToMarathiDigits(int number)
    {
        if (number < 0) return "-" + ToMarathiDigits(-number);
        var str = number.ToString();
        var chars = new char[str.Length];
        for (int i = 0; i < str.Length; i++)
        {
            chars[i] = char.IsDigit(str[i]) ? MarathiDigits[str[i] - '0'] : str[i];
        }
        return new string(chars);
    }

    public static string ToMarathiDigits(string numberStr)
    {
        if (string.IsNullOrEmpty(numberStr)) return numberStr;
        if (int.TryParse(numberStr, out int num))
            return ToMarathiDigits(num);

        var chars = new char[numberStr.Length];
        for (int i = 0; i < numberStr.Length; i++)
        {
            chars[i] = numberStr[i] >= '0' && numberStr[i] <= '9'
                ? MarathiDigits[numberStr[i] - '0']
                : numberStr[i];
        }
        return new string(chars);
    }

    public static string GetEnglishOrdinalWord(int number)
    {
        if (number <= 0) return number.ToString();

        if (number < 100)
        {
            if (EnglishOrdinals.TryGetValue(number, out var word))
                return word;

            return GetNumericOrdinal(number);
        }

        if (number == 1000)
        {
            return "One Thousandth";
        }

        if (number > 1000)
        {
            return GetNumericOrdinal(number);
        }

        int hundred = number / 100;
        int remainder = number % 100;

        if (remainder == 0)
        {
            if (EnglishExactHundredsOrdinals.TryGetValue(hundred, out var exactWord))
                return exactWord;

            return GetNumericOrdinal(number);
        }

        if (EnglishHundredsPrefix.TryGetValue(hundred, out var prefix) &&
            EnglishOrdinals.TryGetValue(remainder, out var remainderWord))
        {
            return $"{prefix} {remainderWord}";
        }

        return GetNumericOrdinal(number);
    }

    private static string GetNumericOrdinal(int number)
    {
        int abs = Math.Abs(number);
        int rem100 = abs % 100;
        string suffix = (rem100 is >= 11 and <= 13) ? "th" : (abs % 10) switch
        {
            1 => "st",
            2 => "nd",
            3 => "rd",
            _ => "th"
        };
        return $"{number}{suffix}";
    }

    public static string GetMarathiOrdinalWord(int number)
    {
        if (number <= 0) return ToMarathiDigits(number);

        if (number < 100)
        {
            if (MarathiOrdinals.TryGetValue(number, out var word))
                return word;

            return $"{ToMarathiDigits(number)} वा";
        }

        if (number == 1000)
        {
            return "एक हजारावा";
        }

        if (number > 1000)
        {
            return $"{ToMarathiDigits(number)} वा";
        }

        int hundred = number / 100;
        int remainder = number % 100;

        if (remainder == 0)
        {
            if (ExactHundredsOrdinals.TryGetValue(hundred, out var exactWord))
                return exactWord;

            return $"{ToMarathiDigits(number)} वा";
        }

        if (HundredsPrefix.TryGetValue(hundred, out var prefix) &&
            MarathiOrdinals.TryGetValue(remainder, out var remainderWord))
        {
            return $"{prefix} {remainderWord}";
        }

        return $"{ToMarathiDigits(number)} वा";
    }

    /// <summary>
    /// Legacy overload for backward compatibility with existing tests and callers.
    /// </summary>
    public static string GetEnglishDescription(string rangeValue)
    {
        if (int.TryParse(rangeValue, out int floorNumber))
        {
            if (floorNumber == 0) return "Ground Floor";
            if (floorNumber < 0) return $"Basement {Math.Abs(floorNumber)}";

            int abs = Math.Abs(floorNumber);
            int rem100 = abs % 100;
            string suffix = (rem100 is >= 11 and <= 13) ? "th" : (abs % 10) switch
            {
                1 => "st",
                2 => "nd",
                3 => "rd",
                _ => "th"
            };

            return $"{floorNumber}{suffix} Floor";
        }

        return $"{rangeValue} Floor";
    }

    /// <summary>
    /// Category-aware English description generator for Floor Range.
    /// </summary>
    public static string GetEnglishDescription(string rangeValue, int flatGenerationGroupId)
    {
        if (!int.TryParse(rangeValue, out int floorNumber) || floorNumber <= 0)
        {
            return GetEnglishDescription(rangeValue);
        }

        string ordinal = GetEnglishOrdinalWord(floorNumber);

        return flatGenerationGroupId switch
        {
            1 => $"{ordinal} Upper",
            2 => $"{ordinal} Floor",
            3 => $"{ordinal} Openplot",
            4 => $"{ordinal} Podium",
            5 => $"{ordinal} Mezzanine",
            6 => $"{ordinal} Lower",
            7 => $"{ordinal} Basement",
            _ => $"{ordinal} Floor"
        };
    }

    /// <summary>
    /// Legacy overload for backward compatibility with existing tests and callers.
    /// </summary>
    public static string GetRegionalDescription(string rangeValue)
    {
        if (int.TryParse(rangeValue, out int floorNumber))
        {
            if (floorNumber == 0) return "तळमजला";
            if (floorNumber < 0) return $"तळघर {ToMarathiDigits(Math.Abs(floorNumber))}";

            string marathiNum = ToMarathiDigits(floorNumber);
            string suffix = floorNumber switch
            {
                1 => "ला",
                2 => "रा",
                3 => "रा",
                4 => "था",
                _ => "वा"
            };

            return $"{marathiNum} {suffix} मजला";
        }

        return $"{ToMarathiDigits(rangeValue)} मजला";
    }

    /// <summary>
    /// Category-aware Regional (Marathi) description generator for Floor Range.
    /// </summary>
    public static string GetRegionalDescription(string rangeValue, int flatGenerationGroupId)
    {
        if (!int.TryParse(rangeValue, out int floorNumber) || floorNumber <= 0)
        {
            return GetRegionalDescription(rangeValue);
        }

        string ordinal = GetMarathiOrdinalWord(floorNumber);

        return flatGenerationGroupId switch
        {
            1 => $"{ordinal} वरचा मजला",
            2 => $"{ordinal} मजला",
            3 => $"{ordinal} मोकळा भूखंड",
            4 => $"{ordinal} पोडियम",
            5 => $"{ordinal} पोटमाळा",
            6 => $"{ordinal} खालचा मजला",
            7 => $"{ordinal} तळघर",
            _ => $"{ordinal} मजला"
        };
    }

    /// <summary>
    /// Gets the default floor code prefix for a flat generation group (e.g. 'P' for PODIUM, 'U' for UPPER).
    /// </summary>
    public static string GetGroupCodePrefix(int flatGenerationGroupId) => flatGenerationGroupId switch
    {
        1 => "U",
        3 => "OP",
        4 => "P",
        5 => "M",
        6 => "L",
        7 => "B",
        _ => string.Empty
    };
}

