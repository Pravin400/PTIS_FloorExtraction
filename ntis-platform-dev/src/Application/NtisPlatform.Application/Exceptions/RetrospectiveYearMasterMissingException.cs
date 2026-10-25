using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Application.Exceptions;

/// <summary>
/// A retrospective calculation produced a row for a finance year that has no row of its own in CORE.YearMaster. The ledger
/// (TransMast) is keyed by that row, so the year could not be written; skipping it, or putting it on another year's row,
/// would leave the property's demand understated without anybody being told, hence the whole calculation is refused and
/// nothing of it is written to the ledger. The fix is data: add the missing year(s) to the year master (or correct the
/// certificate date that starts the calculation) and calculate again.
/// </summary>
public class RetrospectiveYearMasterMissingException : NtisPlatformException
{
    public RetrospectiveYearMasterMissingException(int propertyId, IReadOnlyList<int> financeYears)
        : base(
            $"The retrospective tax of property {propertyId} cannot be calculated: the year master has no row of its own for finance " +
            $"year{(financeYears.Count == 1 ? string.Empty : "s")} {string.Join(", ", financeYears)}. A calculated year is never " +
            "skipped or put on another year's row, because that would understate the property's demand; add the missing year(s) to the year master and calculate again.",
            "RETRO_YEAR_MASTER_MISSING")
    {
        PropertyId = propertyId;
        FinanceYears = financeYears;
        Data["PropertyId"] = propertyId;
        Data["FinanceYears"] = string.Join(",", financeYears);
    }

    /// <summary>The property whose calculation was refused.</summary>
    public int PropertyId { get; }

    /// <summary>The finance years (the year the finance year starts in, e.g. 2023 for 2023-24) with no year master row of their own, ascending.</summary>
    public IReadOnlyList<int> FinanceYears { get; }
}