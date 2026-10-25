namespace NtisPlatform.Core.Constants;

/// <summary>
/// The values of RetrospectiveRuleAction.RateMode (CK_RetrospectiveRuleAction_RateMode): which rate and tax percentage
/// the retrospective calculation prices a retrospective year with. One definition for the engine, the rule-configuration
/// screens and their validation, so a code can not be mistyped in one place and silently take the other branch.
/// </summary>
public static class RetrospectiveRateModes
{
    /// <summary>Each retrospective year's own historical rate and tax percentage.</summary>
    public const string YearWise = "YEAR_WISE";

    /// <summary>The current assessment year's rate and tax percentage for every retrospective year.</summary>
    public const string CurrentYear = "CURRENT_YEAR";
}

/// <summary>
/// The values of RetrospectiveRuleAction.TaxCalculationMode (CK_RetrospectiveRuleAction_TaxCalculationMode).
/// </summary>
public static class RetrospectiveTaxCalculationModes
{
    /// <summary>One multiplier for the entire retrospective period (SINGLE).</summary>
    public const string SingleMultiplier = "SINGLE";

    /// <summary>A second multiplier from a date within the period.</summary>
    public const string Split = "SPLIT";

    /// <summary>CC governs until OC, then OC governs (day-split boundary year).</summary>
    public const string CcThenOcMerge = "CC_THEN_OC_MERGE";
}