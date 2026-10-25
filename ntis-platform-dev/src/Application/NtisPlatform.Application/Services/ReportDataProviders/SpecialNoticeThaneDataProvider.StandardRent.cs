using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.ReportDataProviders;

public partial class SpecialNoticeThaneDataProvider
{
    private readonly IReportDataRepository<OldWardWiseRateEntity>? _oldWardWiseRateRepository;
    internal sealed record OldWardRentRow(string WardNo, string? ConstructionType, string? Residential, string? NonResidential);

    private async Task<(string? Residential, string? Commercial)> LoadOldWardStandardRentAsync(
        IEnumerable<string?> oldWardNumbers, int propertyId, CancellationToken ct)
    {
        var wards = oldWardNumbers.Where(w => !string.IsNullOrWhiteSpace(w))
            .Select(w => w!.Trim()).Distinct().ToArray();
        if (wards.Length == 0 || _oldWardWiseRateRepository is null) return (null, null);
        var codes = await _propertyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .Select(d => d.ConstructionType != null && d.ConstructionType.IsActive
                ? d.ConstructionType.ConstructionCode : null).Distinct().ToListAsync(ct);
        if (codes.Count == 0 || codes.Any(string.IsNullOrWhiteSpace)) return (null, null);
        var rows = await _oldWardWiseRateRepository.GetQueryable().AsNoTracking()
            .Where(r => r.OldWard != null && r.OldWard.IsActive && wards.Contains(r.OldWard.OldWardNo))
            .Select(r => new OldWardRentRow(r.OldWard!.OldWardNo,
                r.ConstructionType != null ? r.ConstructionType.ConstructionCode : null, r.Residential, r.NonResidential))
            .ToListAsync(ct);
        return (ResolveOldWardRentDisplay(wards, codes.Select(c => c!), rows, false),
            ResolveOldWardRentDisplay(wards, codes.Select(c => c!), rows, true));
    }

    internal static string? ResolveOldWardRentDisplay(IEnumerable<string> wards, IEnumerable<string> constructionCodes,
        IEnumerable<OldWardRentRow> source, bool commercial)
    {
        var rows = source.ToList();
        var values = new List<(string Ward, string Construction, decimal Rate)>();
        foreach (var ward in wards.Select(w => w.Trim()).Distinct().OrderBy(w => w))
        foreach (var code in constructionCodes.Select(c => c.Trim().ToUpperInvariant()).Distinct().OrderBy(c => c))
        {
            var matching = rows.Where(r => r.WardNo.Trim() == ward
                && string.Equals(r.ConstructionType?.Trim(), code, StringComparison.OrdinalIgnoreCase)).ToList();
            if (matching.Count == 0) return null;
            var rates = new List<decimal?>();
            foreach (var row in matching)
            {
                var text = commercial ? row.NonResidential : row.Residential;
                if (string.IsNullOrWhiteSpace(text)) { rates.Add(null); continue; }
                if (!decimal.TryParse(text.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
                    throw new InvalidOperationException($"Invalid {(commercial ? "NonResidential" : "Residential")} rate for old ward {ward}, construction {code}.");
                rates.Add(rate);
            }
            var resolved = ResolveStandardRentRate(rates, commercial ? "C" : "R");
            if (!resolved.HasValue) return null;
            values.Add((ward, code, resolved.Value));
        }
        if (values.Count == 0) return null;
        if (values.Select(v => v.Rate).Distinct().Count() == 1)
            return values[0].Rate.ToString("0.00", CultureInfo.InvariantCulture);
        return string.Join("; ", values.Select(v => $"{v.Ward}/{v.Construction}: {v.Rate.ToString("0.00", CultureInfo.InvariantCulture)}"));
    }
}
