using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Core.Entities;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.TaxEngine;

public class RvTaxTotalsTests
{
    private const int GeneralTax = 1;
    private const int EducationTax = 2;
    private const int EmploymentTax = 3;
    private const int TreeCess = 4;

    private static RVCalculationTaxDetailsEntity Row(int taxId, decimal amount, bool isActive = true, bool markedForDeletion = false) =>
        new() { TaxId = taxId, TaxAmount = amount, IsActive = isActive, MarkedForDeletion = markedForDeletion };

    private static RVCalculationResultsEntity Result(decimal? rEducation = null, decimal? cEducation = null, decimal? cEmployment = null, bool isActive = true) =>
        new() { REducationTax = rEducation, CEducationTax = cEducation, CEmploymentTax = cEmployment, IsActive = isActive };

    [Fact]
    public void TwoDetailsThatEachCarryTheWholeEducationAndEmploymentTax_CountThemOnce()
    {
        // The saved RV rows of property 38140 on Ratnagiri: a second detail with no rateable value still carries
        // the property-level education and employment tax. Adding up the rows gave 15,229.03; the saved NETTAX
        // total (the TaxTotal row) is 10,642.
        var taxRows = new List<RVCalculationTaxDetailsEntity>
        {
            Row(GeneralTax, 0.00m), Row(GeneralTax, 5779.80m),
            Row(EducationTax, 3670m), Row(EducationTax, 3670m),
            Row(EmploymentTax, 917m), Row(EmploymentTax, 917m),
            Row(TreeCess, 0.00m), Row(TreeCess, 275.23m),
        };
        var resultRows = new List<RVCalculationResultsEntity>
        {
            Result(cEducation: 3670m, cEmployment: 917m),
            Result(cEducation: 3670m, cEmployment: 917m),
        };

        Assert.Equal(15229.03m, taxRows.Sum(r => r.TaxAmount));

        var total = RvTaxTotals.SumAsSaved(taxRows, resultRows, EducationTax, EmploymentTax);

        Assert.Equal(10642m, total); // 5,780 + 275 + 3,670 + 917
    }

    [Fact]
    public void ResidentialAndCommercialGroups_AddTheLargestEducationTaxOfEachGroup()
    {
        var taxRows = new List<RVCalculationTaxDetailsEntity>
        {
            Row(GeneralTax, 400m),
            Row(EducationTax, 100m), Row(EducationTax, 100m), Row(EducationTax, 300m), Row(EducationTax, 300m),
            Row(EmploymentTax, 50m), Row(EmploymentTax, 50m),
        };
        var resultRows = new List<RVCalculationResultsEntity>
        {
            Result(rEducation: 100m),
            Result(rEducation: 100m),
            Result(cEducation: 300m, cEmployment: 50m),
            Result(cEducation: 300m, cEmployment: 50m),
        };

        var total = RvTaxTotals.SumAsSaved(taxRows, resultRows, EducationTax, EmploymentTax);

        Assert.Equal(400m + (100m + 300m) + 50m, total);
    }

    [Fact]
    public void RegularTaxesAreRoundedPerTax_LikeTheSavedRows()
    {
        // 2.64 + 19.00 = 21.64 is saved as 22 for each of the two taxes: 44, not 43.28.
        var taxRows = new List<RVCalculationTaxDetailsEntity>
        {
            Row(GeneralTax, 2.64m), Row(GeneralTax, 19.00m),
            Row(TreeCess, 2.64m), Row(TreeCess, 19.00m),
        };

        var total = RvTaxTotals.SumAsSaved(taxRows, new List<RVCalculationResultsEntity>(), null, null);

        Assert.Equal(44m, total);
    }

    [Fact]
    public void InactiveAndDeletedRows_AreIgnored()
    {
        var taxRows = new List<RVCalculationTaxDetailsEntity>
        {
            Row(GeneralTax, 1000m),
            Row(GeneralTax, 5000m, isActive: false),
            Row(GeneralTax, 7000m, markedForDeletion: true),
        };
        var resultRows = new List<RVCalculationResultsEntity>
        {
            Result(cEducation: 200m),
            Result(cEducation: 9999m, isActive: false),
        };

        var total = RvTaxTotals.SumAsSaved(taxRows, resultRows, EducationTax, null);

        Assert.Equal(1000m + 200m, total);
    }

    [Fact]
    public void SumAnnualRentalValue_AddsUpTheLiveResultsRowsOnly()
    {
        // Property 38140 on Ratnagiri: one detail with an ALV, one open plot without; deleted / inactive rows do not count.
        var resultRows = new List<RVCalculationResultsEntity>
        {
            new() { AnnualRentalValue = 24464.76, IsActive = true },
            new() { AnnualRentalValue = 0d, IsActive = true },
            new() { AnnualRentalValue = null, IsActive = true },
            new() { AnnualRentalValue = 30580.94, IsActive = false },
            new() { AnnualRentalValue = 99999d, IsActive = true, MarkedForDeletion = true },
        };

        Assert.Equal(24464.76m, RvTaxTotals.SumAnnualRentalValue(resultRows));
    }

    [Fact]
    public void WithoutAnEducationOrEmploymentMaster_TheirRowsCountAsRegularTaxes()
    {
        // Same as the saved totals: with no EDU / EMP tax master there is nothing to treat specially.
        var taxRows = new List<RVCalculationTaxDetailsEntity>
        {
            Row(GeneralTax, 1000m),
            Row(EducationTax, 300m), Row(EducationTax, 300m),
        };
        var resultRows = new List<RVCalculationResultsEntity> { Result(cEducation: 300m), Result(cEducation: 300m) };

        var total = RvTaxTotals.SumAsSaved(taxRows, resultRows, null, null);

        Assert.Equal(1000m + 600m, total);
    }
}
