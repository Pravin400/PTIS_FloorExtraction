using NtisPlatform.Application.Helpers;
using Xunit;

namespace NtisPlatform.Tests.Application.Helpers;

public class FloorNamingHelperTests
{
    #region ToMarathiDigits Tests

    [Theory]
    [InlineData(0, "०")]
    [InlineData(1, "१")]
    [InlineData(2, "२")]
    [InlineData(3, "३")]
    [InlineData(4, "४")]
    [InlineData(5, "५")]
    [InlineData(9, "९")]
    [InlineData(10, "१०")]
    [InlineData(25, "२५")]
    [InlineData(100, "१००")]
    [InlineData(-1, "-१")]
    [InlineData(-5, "-५")]
    public void ToMarathiDigits_IntInput_ConvertsCorrectly(int input, string expected)
    {
        var result = FloorNamingHelper.ToMarathiDigits(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("123", "१२३")]
    [InlineData("0", "०")]
    [InlineData("ABC", "ABC")]
    [InlineData("167 मजला", "१६७ मजला")]
    public void ToMarathiDigits_StringInput_ConvertsCorrectly(string input, string expected)
    {
        var result = FloorNamingHelper.ToMarathiDigits(input);
        Assert.Equal(expected, result);
    }

    #endregion

    #region English Description Tests

    [Theory]
    [InlineData("0", "Ground Floor")]
    [InlineData("-1", "Basement 1")]
    [InlineData("-2", "Basement 2")]
    [InlineData("1", "1st Floor")]
    [InlineData("2", "2nd Floor")]
    [InlineData("3", "3rd Floor")]
    [InlineData("4", "4th Floor")]
    [InlineData("11", "11th Floor")]
    [InlineData("12", "12th Floor")]
    [InlineData("13", "13th Floor")]
    [InlineData("21", "21st Floor")]
    [InlineData("22", "22nd Floor")]
    [InlineData("23", "23rd Floor")]
    [InlineData("101", "101st Floor")]
    [InlineData("Mezzanine", "Mezzanine Floor")]
    public void GetEnglishDescription_GeneratesAccurateNaming(string rangeValue, string expected)
    {
        var result = FloorNamingHelper.GetEnglishDescription(rangeValue);
        Assert.Equal(expected, result);
    }

    #endregion

    #region Regional (Marathi) Description Tests

    [Theory]
    [InlineData("0", "तळमजला")]
    [InlineData("-1", "तळघर १")]
    [InlineData("-2", "तळघर २")]
    [InlineData("1", "१ ला मजला")]
    [InlineData("2", "२ रा मजला")]
    [InlineData("3", "३ रा मजला")]
    [InlineData("4", "४ था मजला")]
    [InlineData("5", "५ वा मजला")]
    [InlineData("10", "१० वा मजला")]
    [InlineData("Mezzanine", "Mezzanine मजला")]
    public void GetRegionalDescription_GeneratesAccurateDevanagariNaming(string rangeValue, string expected)
    {
        var result = FloorNamingHelper.GetRegionalDescription(rangeValue);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(1, "U")]
    [InlineData(2, "")]
    [InlineData(3, "OP")]
    [InlineData(4, "P")]
    [InlineData(5, "M")]
    [InlineData(6, "L")]
    [InlineData(7, "B")]
    [InlineData(99, "")]
    public void GetGroupCodePrefix_ReturnsCorrectPrefix(int groupId, string expected)
    {
        var result = FloorNamingHelper.GetGroupCodePrefix(groupId);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("1", 4, "First Podium")]
    [InlineData("45", 4, "Forty-Fifth Podium")]
    [InlineData("57", 4, "Fifty-Seventh Podium")]
    [InlineData("100", 4, "One Hundredth Podium")]
    [InlineData("103", 4, "One Hundred Third Podium")]
    [InlineData("104", 4, "One Hundred Fourth Podium")]
    [InlineData("111", 4, "One Hundred Eleventh Podium")]
    [InlineData("151", 4, "One Hundred Fifty-First Podium")]
    [InlineData("200", 4, "Two Hundredth Podium")]
    [InlineData("500", 4, "Five Hundredth Podium")]
    [InlineData("1000", 4, "One Thousandth Podium")]
    [InlineData("1", 1, "First Upper")]
    public void GetEnglishDescription_CategoryAware_ReturnsExpected(string rangeValue, int groupId, string expected)
    {
        var result = FloorNamingHelper.GetEnglishDescription(rangeValue, groupId);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("1", 4, "पहिला पोडियम")]
    [InlineData("45", 4, "पंचेचाळिसावा पोडियम")]
    [InlineData("51", 4, "एकावन्नावा पोडियम")]
    [InlineData("57", 4, "सत्तावन्नावा पोडियम")]
    [InlineData("100", 4, "शंभरावा पोडियम")]
    [InlineData("151", 4, "एकशे एकावन्नावा पोडियम")]
    [InlineData("200", 4, "दोनशेवा पोडियम")]
    [InlineData("500", 4, "पाचशेवा पोडियम")]
    [InlineData("784", 4, "सातशे चौऱ्याऐंशीवा पोडियम")]
    [InlineData("1000", 4, "एक हजारावा पोडियम")]
    [InlineData("1", 1, "पहिला वरचा मजला")]
    [InlineData("1", 5, "पहिला पोटमाळा")]
    [InlineData("1", 7, "पहिला तळघर")]
    public void GetRegionalDescription_CategoryAware_ReturnsExpected(string rangeValue, int groupId, string expected)
    {
        var result = FloorNamingHelper.GetRegionalDescription(rangeValue, groupId);
        Assert.Equal(expected, result);
    }

    #endregion
}

