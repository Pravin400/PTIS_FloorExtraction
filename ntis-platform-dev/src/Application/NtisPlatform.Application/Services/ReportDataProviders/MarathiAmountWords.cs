namespace NtisPlatform.Application.Services.ReportDataProviders;

internal static class MarathiAmountWords
{
    private static readonly string[] SmallNumbers =
    [
        "शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ",
        "दहा", "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस",
        "वीस", "एकवीस", "बावीस", "तेवीस", "चोवीस", "पंचवीस", "सव्वीस", "सत्तावीस", "अठ्ठावीस", "एकोणतीस",
        "तीस", "एकतीस", "बत्तीस", "तेहतीस", "चौतीस", "पस्तीस", "छत्तीस", "सदतीस", "अडतीस", "एकोणचाळीस",
        "चाळीस", "एकेचाळीस", "बेचाळीस", "त्रेचाळीस", "चव्वेचाळीस", "पंचेचाळीस", "सेहेचाळीस", "सत्तेचाळीस", "अठ्ठेचाळीस", "एकोणपन्नास",
        "पन्नास", "एकावन्न", "बावन्न", "त्रेपन्न", "चौपन्न", "पंचावन्न", "छप्पन्न", "सत्तावन्न", "अठ्ठावन्न", "एकोणसाठ",
        "साठ", "एकसष्ट", "बासष्ट", "त्रेसष्ट", "चौसष्ट", "पासष्ट", "सहासष्ट", "सदुसष्ट", "अडुसष्ट", "एकोणसत्तर",
        "सत्तर", "एकाहत्तर", "बहात्तर", "त्र्याहत्तर", "चौऱ्याहत्तर", "पंच्याहत्तर", "शहात्तर", "सत्याहत्तर", "अठ्ठ्याहत्तर", "एकोणऐंशी",
        "ऐंशी", "एक्याऐंशी", "ब्याऐंशी", "त्र्याऐंशी", "चौऱ्याऐंशी", "पंच्याऐंशी", "शहाऐंशी", "सत्त्याऐंशी", "अठ्ठ्याऐंशी", "एकोणनव्वद",
        "नव्वद", "एक्याण्णव", "ब्याण्णव", "त्र्याण्णव", "चौऱ्याण्णव", "पंच्याण्णव", "शहाण्णव", "सत्त्याण्णव", "अठ्ठ्याण्णव", "नव्याण्णव"
    ];
    private static readonly string[] Hundreds =
        ["", "शंभर", "दोनशे", "तीनशे", "चारशे", "पाचशे", "सहाशे", "सातशे", "आठशे", "नऊशे"];

    public static string? Convert(decimal? amount)
    {
        if (!amount.HasValue) return null;
        // Monetary words use rupees and paise; the numeric report total is not changed.
        var absolute = decimal.Round(decimal.Abs(amount.Value), 2, MidpointRounding.AwayFromZero);
        var rupees = decimal.Truncate(absolute);
        var paise = (int)((absolute - rupees) * 100m);
        var prefix = amount.Value < 0 ? "उणे " : string.Empty;
        return prefix + WholeNumber(rupees) + " रुपये"
            + (paise > 0 ? " आणि " + SmallNumbers[paise] + " पैसे" : string.Empty) + " फक्त";
    }

    private static string WholeNumber(decimal value)
    {
        if (value < 100) return SmallNumbers[(int)value];
        foreach (var (divisor, label) in new (decimal, string)[]
        {
            (10000000m, "कोटी"), (100000m, "लाख"), (1000m, "हजार"), (100m, "शंभर")
        })
        {
            if (value < divisor) continue;
            var quotient = decimal.Truncate(value / divisor);
            var remainder = value % divisor;
            var head = divisor == 100m ? Hundreds[(int)quotient] : WholeNumber(quotient) + " " + label;
            return head + (remainder > 0 ? " " + WholeNumber(remainder) : string.Empty);
        }
        throw new InvalidOperationException("Unsupported amount.");
    }
}
