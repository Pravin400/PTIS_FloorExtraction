using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class PolicyCodeLookupService : IPolicyCodeLookupService
{
    private readonly IRepository<PolicyCodeMasterEntity, int> _repository;

    public PolicyCodeLookupService(IRepository<PolicyCodeMasterEntity, int> repository)
    {
        _repository = repository;
    }

    public async Task<int> GetIdAsync(string policyCode, CancellationToken cancellationToken = default)
    {
        var allPolicies = await _repository.GetQueryable()
            .Where(p => p.IsActive)
            .Select(p => new { p.Id, p.PolicyCode, p.PolicyName })
            .ToListAsync(cancellationToken);

        var match = allPolicies.FirstOrDefault(p => MatchExact(p.PolicyCode, policyCode))
            ?? allPolicies.FirstOrDefault(p => MatchFallback(p.PolicyCode, policyCode));
        if (match != null)
        {
            return match.Id;
        }

        throw new InvalidOperationException(
            $"No active PTIS.PolicyCodeMaster row found for policy code '{policyCode}'. Seed this master data first.");
    }

    public async Task<Dictionary<string, int>> GetIdsAsync(IEnumerable<string> policyCodes, CancellationToken cancellationToken = default)
    {
        var existing = await GetExistingIdsAsync(policyCodes, cancellationToken);
        var missing = policyCodes.Distinct(StringComparer.OrdinalIgnoreCase).Where(c => !existing.ContainsKey(c)).ToList();
        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"No active PTIS.PolicyCodeMaster row found for policy code(s): {string.Join(", ", missing)}. Seed this master data first.");
        }

        return existing;
    }

    public async Task<Dictionary<string, int>> GetExistingIdsAsync(IEnumerable<string> policyCodes, CancellationToken cancellationToken = default)
    {
        var allPolicies = await _repository.GetQueryable()
            .Where(p => p.IsActive)
            .Select(p => new { p.Id, p.PolicyCode, p.PolicyName })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var requestedCode in policyCodes.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var match = allPolicies.FirstOrDefault(p => MatchExact(p.PolicyCode, requestedCode))
                ?? allPolicies.FirstOrDefault(p => MatchFallback(p.PolicyCode, requestedCode));
            if (match != null)
            {
                result[requestedCode] = match.Id;
            }
        }

        return result;
    }

    private static bool MatchExact(string? dbCode, string targetCode)
    {
        if (string.IsNullOrWhiteSpace(dbCode)) return false;
        if (string.Equals(dbCode.Trim(), targetCode.Trim(), StringComparison.OrdinalIgnoreCase)) return true;

        var normalizedDb = Normalize(dbCode);
        var normalizedTarget = Normalize(targetCode);
        if (normalizedDb == normalizedTarget) return true;

        return normalizedTarget switch
        {
            "PARTIAL_CC" or "CC_PARTIAL" or "PARTIALCC" => normalizedDb is "PARTIAL_CC" or "CC_PARTIAL" or "PARTIALCC",
            "PARTIAL_OC" or "OC_PARTIAL" or "PARTIALOC" => normalizedDb is "PARTIAL_OC" or "OC_PARTIAL" or "PARTIALOC",
            "PARTIAL_ELECTRIC_BILL" or "ELECTRIC_PARTIAL" or "PARTIAL_ELECTRICITY" or "PARTIALELECTRICBILL" =>
                normalizedDb is "PARTIAL_ELECTRIC_BILL" or "ELECTRIC_PARTIAL" or "PARTIAL_ELECTRICITY" or "PARTIALELECTRICBILL",
            "ELECTRIC_BILL" or "ELECTRICITY" or "ELECTRIC" or "EB" =>
                normalizedDb is "ELECTRIC_BILL" or "ELECTRICITY" or "ELECTRIC" or "EB",
            "NETTAX" or "NET_TAX" => normalizedDb is "NETTAX" or "NET_TAX",
            "OLD_ARREARS" or "OLDARREARS" or "ARREARS" => normalizedDb is "OLD_ARREARS" or "OLDARREARS" or "ARREARS",
            _ => false
        };
    }

    private static bool MatchFallback(string? dbCode, string targetCode)
    {
        if (string.IsNullOrWhiteSpace(dbCode)) return false;

        var normalizedDb = Normalize(dbCode);
        var normalizedTarget = Normalize(targetCode);

        return normalizedTarget switch
        {
            "PARTIAL_CC" or "CC_PARTIAL" or "PARTIALCC" => normalizedDb is "CC",
            "PARTIAL_OC" or "OC_PARTIAL" or "PARTIALOC" => normalizedDb is "OC",
            "PARTIAL_ELECTRIC_BILL" or "ELECTRIC_PARTIAL" or "PARTIAL_ELECTRICITY" or "PARTIALELECTRICBILL" =>
                normalizedDb is "ELECTRIC_BILL" or "ELECTRICITY",
            _ => false
        };
    }

    private static string Normalize(string code) =>
        code.Replace(" ", "_").Replace("-", "_").ToUpperInvariant();
}
