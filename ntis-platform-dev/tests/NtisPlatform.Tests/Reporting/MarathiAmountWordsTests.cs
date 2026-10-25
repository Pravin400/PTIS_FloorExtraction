using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class MarathiAmountWordsTests
{
    [Theory]
    [InlineData("0", "शून्य रुपये फक्त")]
    [InlineData("100", "शंभर रुपये फक्त")]
    [InlineData("2300", "दोन हजार तीनशे रुपये फक्त")]
    [InlineData("82544", "ब्याऐंशी हजार पाचशे चव्वेचाळीस रुपये फक्त")]
    [InlineData("2825466.7000", "अठ्ठावीस लाख पंचवीस हजार चारशे सहासष्ट रुपये आणि सत्तर पैसे फक्त")]
    [InlineData("10000000", "एक कोटी रुपये फक्त")]
    [InlineData("0.05", "शून्य रुपये आणि पाच पैसे फक्त")]
    [InlineData("1.995", "दोन रुपये फक्त")]
    [InlineData("-12.50", "उणे बारा रुपये आणि पन्नास पैसे फक्त")]
    public void ConvertsRupeesAndPaise(string amount, string expected)
    {
        Assert.Equal(expected, MarathiAmountWords.Convert(decimal.Parse(amount, System.Globalization.CultureInfo.InvariantCulture)));
    }

    [Fact]
    public void MissingAmountDoesNotBecomeZero()
    {
        Assert.Null(MarathiAmountWords.Convert(null));
    }
}
