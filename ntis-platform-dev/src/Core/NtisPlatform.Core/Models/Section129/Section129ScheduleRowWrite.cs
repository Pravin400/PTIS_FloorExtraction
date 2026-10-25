namespace NtisPlatform.Core.Models.Section129;

/// <summary>Field values for one PropertySection129Schedule row upsert — the service computes these; the repository only persists them.</summary>
public record Section129ScheduleRowWrite(
    int PropertyId,
    int PropertyDetailsId,
    int FinanceYearId,
    int PolicyCodeId,
    int TaxId,
    decimal TaxPercentage,
    decimal OldTaxAmount,
    decimal FullBasisTaxAmount,
    decimal StageTaxAmount,
    decimal TaxAmount,
    bool IsCurrent,
    bool IsPropertyChangeDisqualified);
