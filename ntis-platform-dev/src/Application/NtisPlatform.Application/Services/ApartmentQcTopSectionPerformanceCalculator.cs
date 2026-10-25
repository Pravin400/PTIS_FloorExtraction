using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Computes additional revenue metrics shown on the ApartmentQC top-section panel and on the Individual screen:
/// additional revenue = total tax (current + retro) - old current tax, and its actual percentage change.
/// </summary>
public sealed class ApartmentQcTopSectionPerformanceCalculator
{
    public AdditionalRevenueDto ComputeAdditionalRevenue(decimal? currentTax, decimal? retroTax, decimal? oldCurrentTax, decimal? pendingCurrent)
    {
        var curTax = currentTax ?? 0m;
        var retTax = retroTax ?? 0m;
        var oldCurTax = oldCurrentTax ?? 0m;
        var pendCur = pendingCurrent ?? 0m;

        var totalTax = curTax + retTax;
        var currentDemand = curTax;
        var pendingDemand = retTax + pendCur;
        var totalDemand = currentDemand + pendingDemand;
        var collection = 0m;
        var totalBalance = totalDemand - collection;
        var differenceAmount = totalTax - oldCurTax;

        double changePercent = 0.0;
        if (oldCurTax != 0m)
        {
            // The actual percentage change: a tax that grew ten times shows +900 %, it is not limited to 100 %.
            changePercent = Math.Round((double)(differenceAmount / oldCurTax * 100m), 2);
        }

        return new AdditionalRevenueDto
        {
            CurrentTax = curTax,
            RetroTax = retTax,
            TotalTax = totalTax,
            CurrentDemand = currentDemand,
            PendingCurrent = pendCur,
            PendingDemand = pendingDemand,
            TotalDemand = totalDemand,
            Collection = collection,
            TotalBalance = totalBalance,
            OldCurrentTax = oldCurTax,
            DifferenceAmount = differenceAmount,
            ChangePercent = changePercent
        };
    }
}
