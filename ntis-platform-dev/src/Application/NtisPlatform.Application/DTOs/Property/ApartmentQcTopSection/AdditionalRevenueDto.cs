namespace NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;

/// <summary>
/// Latest tax demand, retrospective tax, and historical pre-merge demand details.
/// </summary>
public sealed class AdditionalRevenueDto
{
    public decimal CurrentTax { get; init; } = 0m;
    public decimal RetroTax { get; init; } = 0m;
    public decimal TotalTax { get; init; } = 0m;
    public decimal CurrentDemand { get; init; } = 0m;
    public decimal PendingCurrent { get; init; } = 0m;
    public decimal PendingDemand { get; init; } = 0m;
    public decimal TotalDemand { get; init; } = 0m;
    public decimal Collection { get; init; } = 0m;
    public decimal TotalBalance { get; init; } = 0m;
    public decimal OldCurrentTax { get; init; } = 0m;
    public decimal DifferenceAmount { get; init; } = 0m;
    public double ChangePercent { get; init; } = 0.0;
}

