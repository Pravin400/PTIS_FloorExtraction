using NtisPlatform.Application.Attributes;

namespace NtisPlatform.Tests.Application.Attributes;

/// <summary>
/// <see cref="JsonObjectOrArrayAttribute"/> must accept exactly what SQL Server's ISJSON(value) = 1 accepts, so it
/// can guard CHECK (col IS NULL OR ISJSON(col) = 1) constraints. Every string case below was run through
/// SELECT ISJSON(@v) on SQL Server; the expected result here is that ISJSON outcome (blank aside, see below).
/// </summary>
public class JsonObjectOrArrayAttributeTests
{
    private readonly JsonObjectOrArrayAttribute _attribute = new();

    [Theory]
    [InlineData("{}")]
    [InlineData("[]")]
    [InlineData("{\"a\":1}")]
    [InlineData("[{\"value\":\"A\",\"label\":\"Option A\"},{\"value\":\"B\",\"label\":\"Option B\"}]")]
    [InlineData("  {\"a\":1}  ")]
    [InlineData("{\"a\":1,\"a\":2}")]
    [InlineData("{\"a\":\"line1\\nline2\"}")]
    [InlineData("{\"label\":\"मालमत्ता\"}")]
    public void IsValid_JsonObjectOrArray_ReturnsTrue(string json)
    {
        Assert.True(_attribute.IsValid(json));
    }

    [Theory]
    [InlineData("1")]
    [InlineData("\"text\"")]
    [InlineData("true")]
    [InlineData("null")]
    [InlineData("{\"a\":1")]
    [InlineData("{'a':1}")]
    [InlineData("{\"a\":1,}")]
    [InlineData("[1,2,]")]
    [InlineData("{\"a\":1}{\"b\":2}")]
    [InlineData("{\"a\":1} x")]
    [InlineData("{\"a\":NaN}")]
    [InlineData("/*c*/ {\"a\":1}")]
    [InlineData("Red,Green,Blue")]
    public void IsValid_ValueSqlServerIsJsonRejects_ReturnsFalse(string json)
    {
        Assert.False(_attribute.IsValid(json));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void IsValid_NullOrBlank_ReturnsTrue(string? value)
    {
        // ISJSON('') = 0, so blank is only safe because the mapping stores it as NULL (covered in the mapping tests).
        Assert.True(_attribute.IsValid(value));
    }

    [Fact]
    public void IsValid_NonStringValue_ReturnsFalse()
    {
        Assert.False(_attribute.IsValid(42));
    }
}
