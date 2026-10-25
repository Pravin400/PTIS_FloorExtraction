using System;
using System.Collections.Generic;
using System.Linq;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Helpers;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class ApartmentComparisonSorterTests
{
    private static ApartmentQCComparisonDto Row(
        string propertyNo,
        Action<NewSurveyPropertyDto>? survey = null,
        Action<OldSurveyPropertyDto>? old = null,
        Action<ApartmentQCPropertyDifferenceDto>? difference = null)
    {
        var row = new ApartmentQCComparisonDto
        {
            NewSurvey = new NewSurveyPropertyDto { PropertyNo = propertyNo },
            OldSurvey = new OldSurveyPropertyDto(),
            Difference = new ApartmentQCPropertyDifferenceDto()
        };
        survey?.Invoke(row.NewSurvey);
        if (old != null)
        {
            row.OldSurvey.Id = 1;
            old(row.OldSurvey);
        }
        difference?.Invoke(row.Difference);
        return row;
    }

    private static List<string> Order(IReadOnlyList<ApartmentQCComparisonDto> rows, string sortBy, string order = "asc")
    {
        var spec = ApartmentSortSpec.TryParse(sortBy, order);
        Assert.NotNull(spec);
        return ApartmentComparisonSorter.OrderOf(rows, spec!).Select(i => rows[i].NewSurvey.PropertyNo).ToList();
    }

    // ── the sort asked for ───────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("survey:tax", "asc", ApartmentSortPanel.Survey, "tax", false)]
    [InlineData("Existing:RV", "DESC", ApartmentSortPanel.Existing, "rv", true)]
    [InlineData("difference:rtTax", "desc", ApartmentSortPanel.Difference, "rtTax", true)]
    [InlineData("survey:tax", null, ApartmentSortPanel.Survey, "tax", false)]
    public void TryParse_ReadsPanelColumnAndDirection(string sortBy, string? order, ApartmentSortPanel panel, string column, bool descending)
    {
        var spec = ApartmentSortSpec.TryParse(sortBy, order);

        Assert.Equal(new ApartmentSortSpec(panel, column, descending), spec);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("tax")]                 // no table
    [InlineData("survey:")]
    [InlineData("survey:rules")]        // not a sortable column
    [InlineData("difference:prop")]     // the difference table has no such column
    [InlineData("other:tax")]
    public void TryParse_GivesNothingForAnythingElse(string? sortBy)
    {
        Assert.Null(ApartmentSortSpec.TryParse(sortBy, "asc"));
    }

    // ── the order ────────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Numbers_AreSortedAscendingAndDescending()
    {
        var rows = new[]
        {
            Row("A", s => s.NewTaxTotal = 300),
            Row("B", s => s.NewTaxTotal = 100),
            Row("C", s => s.NewTaxTotal = 200)
        };

        Assert.Equal(new[] { "B", "C", "A" }, Order(rows, "survey:tax"));
        Assert.Equal(new[] { "A", "C", "B" }, Order(rows, "survey:tax", "desc"));
    }

    [Fact]
    public void PropertyNumbers_AreSortedNaturally()
    {
        var rows = new[]
        {
            Row("A", s => { s.PropertyNo = "132"; s.PartitionNo = "S10"; }),
            Row("B", s => { s.PropertyNo = "132"; s.PartitionNo = "S2"; }),
            Row("C", s => { s.PropertyNo = "132"; s.PartitionNo = "S1"; })
        };

        // The ids of the rows are their property numbers here; the order is read back through them.
        var spec = ApartmentSortSpec.TryParse("survey:prop", "asc")!;
        var order = ApartmentComparisonSorter.OrderOf(rows, spec);

        Assert.Equal(new[] { 2, 1, 0 }, order);   // S1, S2, S10
    }

    [Fact]
    public void SurveyPropertyColumn_IsTheWingOrPartition_LikeTheScreen()
    {
        // The survey table shows the partition as PROP NO (not the main number 37 / 9), so the partition decides the order.
        var rows = new[]
        {
            Row("x", s => { s.PropertyNo = "37"; s.PartitionNo = "B"; s.FlatOrShopNo = "1"; }),
            Row("y", s => { s.PropertyNo = "37"; s.PartitionNo = "A"; s.FlatOrShopNo = "2"; }),
            Row("z", s => { s.PropertyNo = "9"; s.PartitionNo = "C"; })
        };

        var order = ApartmentComparisonSorter.OrderOf(rows, ApartmentSortSpec.TryParse("survey:prop", "asc")!);

        Assert.Equal(new[] { 1, 0, 2 }, order);   // "A", "B", "C"
    }

    [Fact]
    public void FlatColumn_IsSortedNaturally_AndEmptyFlatsAreLast()
    {
        var rows = new[]
        {
            Row("f101", s => s.FlatOrShopNo = "101"),
            Row("none"),
            Row("f1", s => s.FlatOrShopNo = "1"),
            Row("f20", s => s.FlatOrShopNo = "20")
        };

        Assert.Equal(new[] { "f1", "f20", "f101", "none" }, Order(rows, "survey:flat"));
    }

    [Fact]
    public void TypeColumn_IsOnlyTheType_TheBhkHasItsOwnColumn()
    {
        // TYPE and BHK are two columns: the type column does not look at the BHK.
        var rows = new[]
        {
            Row("r2", s => { s.ApartmentType = "R2"; s.BHK = "1 BHK"; }),
            Row("r1b", s => { s.ApartmentType = "R1"; s.BHK = "3 BHK"; }),
            Row("r1a", s => { s.ApartmentType = "R1"; s.BHK = "1 BHK"; }),
            Row("none")
        };

        Assert.Equal(new[] { "r1b", "r1a", "r2", "none" }, Order(rows, "survey:type"));   // R1, R1 (original order), R2, no type last
    }

    [Fact]
    public void BhkColumn_IsSortedNaturally_AndEmptyBhkIsLast()
    {
        var rows = new[]
        {
            Row("b10", s => s.BHK = "10 BHK"),
            Row("none"),
            Row("b2", s => s.BHK = "2 BHK"),
            Row("b1", s => s.BHK = "1 BHK")
        };

        Assert.Equal(new[] { "b1", "b2", "b10", "none" }, Order(rows, "survey:bhk"));
        Assert.Equal(new[] { "b10", "b2", "b1", "none" }, Order(rows, "survey:bhk", "desc"));
    }

    [Fact]
    public void Floors_AreSortedGroundFirstThenByNumber()
    {
        var rows = new[]
        {
            Row("ten", s => s.FloorCode = "10"),
            Row("ground", s => s.FloorCode = "G"),
            Row("two", s => s.FloorCode = "2"),
            Row("one", s => s.FloorCode = "1")
        };

        Assert.Equal(new[] { "ground", "one", "two", "ten" }, Order(rows, "survey:wgFl"));
    }

    [Fact]
    public void EmptyValues_AreLastInEitherDirection()
    {
        var rows = new[]
        {
            Row("empty", s => s.ConstructionYear = "-"),
            Row("y1999", s => s.ConstructionYear = "1999"),
            Row("y2005", s => s.ConstructionYear = "2005")
        };

        Assert.Equal(new[] { "y1999", "y2005", "empty" }, Order(rows, "survey:cyr"));
        Assert.Equal(new[] { "y2005", "y1999", "empty" }, Order(rows, "survey:cyr", "desc"));
    }

    [Fact]
    public void EqualValues_KeepTheirOrder()
    {
        var rows = new[]
        {
            Row("a", s => s.NewTaxTotal = 5),
            Row("b", s => s.NewTaxTotal = 5),
            Row("c", s => s.NewTaxTotal = 1)
        };

        Assert.Equal(new[] { "c", "a", "b" }, Order(rows, "survey:tax"));
        Assert.Equal(new[] { "a", "b", "c" }, Order(rows, "survey:tax", "desc"));
    }

    [Fact]
    public void Dates_AreSortedByDay()
    {
        var rows = new[]
        {
            Row("new", s => s.OCDate = new DateTime(2024, 3, 5, 18, 0, 0)),
            Row("old", s => s.OCDate = new DateTime(2019, 11, 30)),
            Row("none")
        };

        Assert.Equal(new[] { "old", "new", "none" }, Order(rows, "survey:ocDate"));
    }

    [Fact]
    public void TheExistingTable_IsSortedByTheOldSurvey_AndUnitsWithoutAnOldPropertyShowZero()
    {
        var rows = new[]
        {
            Row("a", old: o => o.RateableValue = 30000),
            Row("b", old: o => o.RateableValue = 10000),
            Row("noOld")   // no old property mapped: its Existing row is empty (RV 0)
        };

        Assert.Equal(new[] { "noOld", "b", "a" }, Order(rows, "existing:rv"));
    }

    [Fact]
    public void TheDifferenceTable_IsSortedByTheDifference()
    {
        var rows = new[]
        {
            Row("a", difference: d => d.TotalTaxDiff = -5),
            Row("b", difference: d => d.TotalTaxDiff = 50),
            Row("c", difference: d => d.TotalTaxDiff = 7)
        };

        Assert.Equal(new[] { "a", "c", "b" }, Order(rows, "difference:tax"));
    }

    [Fact]
    public void ImageAndPlan_AreSortedByWhetherTheUnitHasOne()
    {
        var rows = new[]
        {
            Row("without"),
            Row("withPhoto", s => s.Photos.Add(new PropertyPhotoDocumentDto { DocumentGuid = Guid.NewGuid(), PhotoTypeCode = "PROPERTY_FRONT" })),
            Row("withDirectGuid", s => s.PropertyPhotoDocumentGuid = Guid.NewGuid())
        };

        Assert.Equal(new[] { "withPhoto", "withDirectGuid", "without" }, Order(rows, "survey:img", "desc"));
    }

    [Theory]
    [InlineData("S2", "S10", -1)]
    [InlineData("S10", "S2", 1)]
    [InlineData("a", "A", 0)]
    [InlineData("101", "0101", 0)]
    [InlineData("A1", "A1B", -1)]
    public void NaturalCompare_ComparesDigitRunsAsNumbers(string x, string y, int expectedSign)
    {
        Assert.Equal(expectedSign, Math.Sign(ApartmentComparisonSorter.NaturalCompare(x, y)));
    }
}
