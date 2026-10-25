using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Constants.RetrospectiveTax;
using NtisPlatform.Application.DTOs.RetrospectiveTax.RetrospectiveRuleAction;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.RetrospectiveTax;

public class RetrospectiveRuleActionService : BaseCommonCrudService<RetrospectiveRuleActionEntity, RetrospectiveRuleActionDto, CreateRetrospectiveRuleActionDto, UpdateRetrospectiveRuleActionDto, RetrospectiveRuleActionQueryParameters, int>, IRetrospectiveRuleActionService
{
    private readonly IRepository<EvidenceTypeMasterEntity, int> _evidenceTypeRepository;

    public RetrospectiveRuleActionService(
        IRepository<RetrospectiveRuleActionEntity, int> repository,
        IRepository<EvidenceTypeMasterEntity, int> evidenceTypeRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
        _evidenceTypeRepository = evidenceTypeRepository;
    }

    /// <summary>
    /// Display-label overrides for evidence codes whose natural "{EvidenceName} date" phrasing
    /// doesn't read well (e.g. "Construction Year date"). Falls back to "{EvidenceName} date" for
    /// any evidence type not listed here, so newly added evidence types still get a sane label.
    /// </summary>
    private static readonly Dictionary<string, string> _useDateLabelOverrides = new(StringComparer.OrdinalIgnoreCase)
    {
        ["CHANGE_DETECTION"] = "Change detection date",
        ["CONSTRUCTION_YEAR"] = "Construction date/year",
    };

    // The direct create / update endpoints are a way in as well as the rule screen's save: a mode that is not in the
    // allowed list would reach the database CHECK constraint as a 500, or be stored and later refused by the engine.
    protected override Task<ValidationResult> ValidateForCreateAsync(RetrospectiveRuleActionEntity entity, CancellationToken cancellationToken = default)
        => Task.FromResult(ValidateModes(entity));

    protected override Task<ValidationResult> ValidateForDeactivationAsync(
        int id, RetrospectiveRuleActionEntity currentEntity, RetrospectiveRuleActionEntity updatedEntity, CancellationToken cancellationToken = default)
        => Task.FromResult(ValidateModes(updatedEntity));

    private static ValidationResult ValidateModes(RetrospectiveRuleActionEntity entity)
    {
        var errors = new List<ValidationError>();
        if (!RetrospectiveRuleActionOptions.TaxCalculationModes.Any(o => o.Code == entity.TaxCalculationMode))
        {
            errors.Add(new ValidationError(nameof(entity.TaxCalculationMode), $"'{entity.TaxCalculationMode}' is not a valid TaxCalculationMode."));
        }

        if (!RetrospectiveRuleActionOptions.RateModes.Any(o => o.Code == entity.RateMode))
        {
            errors.Add(new ValidationError(nameof(entity.RateMode), $"'{entity.RateMode}' is not a valid RateMode."));
        }

        return errors.Count == 0 ? ValidationResult.Success() : ValidationResult.Failure(errors);
    }

    public async Task<List<RetrospectiveRuleActionUseDateOptionDto>> GetUseDateOptionsAsync(CancellationToken cancellationToken = default)
    {
        var evidenceTypes = await _evidenceTypeRepository.GetQueryable()
            .Where(e => e.IsActive)
            .OrderBy(e => e.DisplayOrder)
            .ToListAsync(cancellationToken);

        var options = evidenceTypes
            .Select(e => new RetrospectiveRuleActionUseDateOptionDto
            {
                EvidenceTypeId = e.Id,
                Label = _useDateLabelOverrides.TryGetValue(e.EvidenceCode, out var label) ? label : $"{e.EvidenceName} date",
                IsCutoffDate = false
            })
            .ToList();

        options.Add(new RetrospectiveRuleActionUseDateOptionDto
        {
            EvidenceTypeId = null,
            Label = "Cutoff date",
            IsCutoffDate = true
        });

        return options;
    }
}
