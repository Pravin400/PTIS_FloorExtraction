using NtisPlatform.Application.DTOs.RateableValue;

namespace NtisPlatform.Application.DTOs.RetrospectiveTax;

/// <summary>How <see cref="Interfaces.RetrospectiveTax.IRetrospectiveTaxRefresher"/> recalculates a property.</summary>
public sealed class RetrospectiveTaxRefreshOptions
{
    /// <summary>
    /// Bypasses the RV input-signature fast path and always recalculates, as
    /// <c>IRateableValueService.CalculateAndSaveAsync</c>'s <c>forceRecalculate</c> does.
    /// </summary>
    public bool ForceRecalculate { get; init; }
}

/// <summary>What <see cref="Interfaces.RetrospectiveTax.IRetrospectiveTaxRefresher"/> did for a property.</summary>
public sealed class RetrospectiveTaxRefreshResult
{
    public RetrospectiveTaxRefreshResult(RateableValueResponseDto rateableValue, RetrospectiveTaxEngineResultDto? retrospective)
    {
        RateableValue = rateableValue;
        Retrospective = retrospective;
    }

    /// <summary>What the RV recalculation returned.</summary>
    public RateableValueResponseDto RateableValue { get; }

    /// <summary>What the engine returned: null when no rule matched the property's evidence (nothing is charged retrospectively).</summary>
    public RetrospectiveTaxEngineResultDto? Retrospective { get; }
}
