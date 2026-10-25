using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleValidationService : IWaterPenaltyRuleValidationService
{
    private readonly IRepository<WaterPenaltyRuleMasterEntity, long> _repository;
    private readonly IRepository<YearMasterEntity, int>? _yearRepository;
    private readonly IRepository<ConnectionCategoryMasterEntity, int>? _connectionCategoryRepository;
    private readonly IRepository<GeographyUnitEntity, int>? _geographyUnitRepository;
    private readonly IRepository<ChargeHeadMasterEntity, int>? _chargeHeadRepository;

    public WaterPenaltyRuleValidationService(
        IRepository<WaterPenaltyRuleMasterEntity, long> repository,
        IRepository<YearMasterEntity, int>? yearRepository = null,
        IRepository<ConnectionCategoryMasterEntity, int>? connectionCategoryRepository = null,
        IRepository<GeographyUnitEntity, int>? geographyUnitRepository = null,
        IRepository<ChargeHeadMasterEntity, int>? chargeHeadRepository = null)
    {
        _repository = repository;
        _yearRepository = yearRepository;
        _connectionCategoryRepository = connectionCategoryRepository;
        _geographyUnitRepository = geographyUnitRepository;
        _chargeHeadRepository = chargeHeadRepository;
    }

    public async Task<ValidationResult> ValidateRuleAsync(
        WaterPenaltyRuleMasterEntity rule,
        long? excludeRuleId = null,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<ValidationError>();

        if (rule.FinancialYearId <= 0)
            errors.Add(new ValidationError(nameof(rule.FinancialYearId), "Financial year does not exist or is inactive."));

        if (!rule.IsCurrentBill && !rule.IsPendingBill)
            errors.Add(new ValidationError(nameof(rule.IsCurrentBill), "Penalty rule must apply to at least one bill type (Current Bill or Pending Bill)."));

        var isPercentage = string.Equals(rule.PenaltyType, "Percentage", StringComparison.OrdinalIgnoreCase);
        var isFlat = string.Equals(rule.PenaltyType, "Flat", StringComparison.OrdinalIgnoreCase);
        var isMonthlyPercentage = string.Equals(rule.PenaltyType, "MonthlyPercentage", StringComparison.OrdinalIgnoreCase);

        if (!isPercentage && !isFlat && !isMonthlyPercentage)
        {
            errors.Add(new ValidationError(nameof(rule.PenaltyType), "PenaltyType must be 'Percentage', 'Flat', or 'MonthlyPercentage'."));
        }
        else if (isPercentage || isMonthlyPercentage)
        {
            if (!rule.PercentageRate.HasValue || rule.PercentageRate.Value <= 0 || rule.PercentageRate.Value > 100)
                errors.Add(new ValidationError(nameof(rule.PercentageRate), "PercentageRate must be greater than 0 and less than or equal to 100."));
        }
        else if (isFlat)
        {
            if (!rule.FlatAmount.HasValue || rule.FlatAmount.Value <= 0)
                errors.Add(new ValidationError(nameof(rule.FlatAmount), "FlatAmount must be greater than 0."));
        }

        if (rule.FromDay.HasValue && rule.FromDay.Value < 0)
            errors.Add(new ValidationError(nameof(rule.FromDay), "FromDay cannot be negative."));

        if (rule.ToDay.HasValue && rule.ToDay.Value < 0)
            errors.Add(new ValidationError(nameof(rule.ToDay), "ToDay cannot be negative."));

        if (rule.FromDay.HasValue && rule.ToDay.HasValue && rule.FromDay.Value > rule.ToDay.Value)
            errors.Add(new ValidationError(nameof(rule.FromDay), "FromDay cannot be greater than ToDay."));

        if (rule.EffectiveFrom == default || rule.EffectiveFrom == DateTime.MinValue)
            errors.Add(new ValidationError(nameof(rule.EffectiveFrom), "EffectiveFrom is required and must be a valid date."));

        if (rule.EffectiveTo.HasValue && rule.EffectiveFrom > rule.EffectiveTo.Value)
            errors.Add(new ValidationError(nameof(rule.EffectiveTo), "EffectiveFrom cannot be later than EffectiveTo."));

        if (rule.MaximumAmount.HasValue)
        {
            if (rule.MaximumAmount.Value < 0)
                errors.Add(new ValidationError(nameof(rule.MaximumAmount), "MaximumAmount cannot be negative."));
            else if (isFlat && rule.FlatAmount.HasValue && rule.MaximumAmount.Value < rule.FlatAmount.Value)
                errors.Add(new ValidationError(nameof(rule.MaximumAmount), "MaximumAmount cannot be less than FlatAmount."));
        }

        // Master / Reference Validations
        if (rule.FinancialYearId > 0 && _yearRepository != null)
        {
            var exists = await _yearRepository.GetQueryable()
                .AnyAsync(x => x.Id == rule.FinancialYearId && x.IsActive, cancellationToken);
            if (!exists)
                errors.Add(new ValidationError(nameof(rule.FinancialYearId), "Financial year does not exist or is inactive."));
        }

        if (rule.ConnectionCategoryId.HasValue)
        {
            if (rule.ConnectionCategoryId.Value <= 0)
            {
                errors.Add(new ValidationError(nameof(rule.ConnectionCategoryId), "Connection category does not exist or is inactive."));
            }
            else if (_connectionCategoryRepository != null)
            {
                var exists = await _connectionCategoryRepository.GetQueryable()
                    .AnyAsync(x => x.Id == rule.ConnectionCategoryId.Value && x.IsActive, cancellationToken);
                if (!exists)
                    errors.Add(new ValidationError(nameof(rule.ConnectionCategoryId), "Connection category does not exist or is inactive."));
            }
        }

        if (rule.GeographyUnitId.HasValue)
        {
            if (rule.GeographyUnitId.Value <= 0)
            {
                errors.Add(new ValidationError(nameof(rule.GeographyUnitId), "Geography unit does not exist or is inactive."));
            }
            else if (_geographyUnitRepository != null)
            {
                var exists = await _geographyUnitRepository.GetQueryable()
                    .AnyAsync(x => x.Id == rule.GeographyUnitId.Value && x.IsActive && !x.MarkedForDeletion, cancellationToken);
                if (!exists)
                    errors.Add(new ValidationError(nameof(rule.GeographyUnitId), "Geography unit does not exist or is inactive."));
            }
        }

        if (rule.ChargeHeadId.HasValue)
        {
            if (rule.ChargeHeadId.Value <= 0)
            {
                errors.Add(new ValidationError(nameof(rule.ChargeHeadId), "Charge head does not exist or is inactive."));
            }
            else if (_chargeHeadRepository != null)
            {
                var chargeHead = await _chargeHeadRepository.GetQueryable()
                    .FirstOrDefaultAsync(x => x.Id == rule.ChargeHeadId.Value && x.IsActive, cancellationToken);
                if (chargeHead == null)
                {
                    errors.Add(new ValidationError(nameof(rule.ChargeHeadId), "Charge head does not exist or is inactive."));
                }
                else if (chargeHead.IsRefundable)
                {
                    errors.Add(new ValidationError(nameof(rule.ChargeHeadId), "Penalty rule cannot be configured for a refundable charge head."));
                }
            }
        }

        if (errors.Count > 0)
            return ValidationResult.Failure(errors);

        // Conflict check: Day Range + Effective Date in matching business context (active rules only)
        if (rule.IsActive)
        {
            var query = _repository.GetQueryable()
                .Where(x => x.FinancialYearId == rule.FinancialYearId
                            && (x.ConnectionCategoryId == null || rule.ConnectionCategoryId == null || x.ConnectionCategoryId == rule.ConnectionCategoryId)
                            && (x.GeographyUnitId == null || rule.GeographyUnitId == null || x.GeographyUnitId == rule.GeographyUnitId)
                            && (x.ChargeHeadId == null || rule.ChargeHeadId == null || x.ChargeHeadId == rule.ChargeHeadId)
                            && x.IsActive
                            && ((x.IsCurrentBill && rule.IsCurrentBill) || (x.IsPendingBill && rule.IsPendingBill)));

            if (excludeRuleId.HasValue && excludeRuleId.Value > 0)
                query = query.Where(x => x.PenaltyRuleId != excludeRuleId.Value);

            var existingRules = await query.ToListAsync(cancellationToken);

            var newFromDay = rule.FromDay ?? 0;
            var newToDay = rule.ToDay ?? int.MaxValue;
            var newEffFrom = rule.EffectiveFrom.Date;
            var newEffTo = rule.EffectiveTo?.Date ?? DateTime.MaxValue.Date;

            foreach (var ex in existingRules)
            {
                var exFromDay = ex.FromDay ?? 0;
                var exToDay = ex.ToDay ?? int.MaxValue;
                var exEffFrom = ex.EffectiveFrom.Date;
                var exEffTo = ex.EffectiveTo?.Date ?? DateTime.MaxValue.Date;

                var dayOverlap = exFromDay <= newToDay && exToDay >= newFromDay;
                var dateOverlap = exEffFrom <= newEffTo && exEffTo >= newEffFrom;

                if (dayOverlap && dateOverlap)
                {
                    var msg = $"Penalty rule conflicts with existing active rule ID {ex.PenaltyRuleId} (Day range {ex.FromDay}-{ex.ToDay}, effective {ex.EffectiveFrom:yyyy-MM-dd} to {ex.EffectiveTo:yyyy-MM-dd}).";
                    errors.Add(new ValidationError(nameof(rule.FromDay), msg));
                    break;
                }
            }
        }

        return errors.Count > 0 ? ValidationResult.Failure(errors) : ValidationResult.Success();
    }

    public async Task<WaterPenaltyRuleValidationResultDto> ValidateConflictAsync(
        WaterPenaltyRuleValidationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var tempEntity = new WaterPenaltyRuleMasterEntity
        {
            FinancialYearId = request.FinancialYearId,
            ConnectionCategoryId = request.ConnectionCategoryId,
            GeographyUnitId = request.GeographyUnitId,
            ChargeHeadId = request.ChargeHeadId,
            PenaltyType = request.PenaltyType,
            FromDay = request.FromDay,
            ToDay = request.ToDay,
            PercentageRate = request.PercentageRate,
            FlatAmount = request.FlatAmount,
            MaximumAmount = request.MaximumAmount,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            IsCurrentBill = request.IsCurrentBill,
            IsPendingBill = request.IsPendingBill,
            IsActive = true
        };

        var result = await ValidateRuleAsync(tempEntity, request.PenaltyRuleId, cancellationToken);
        var dto = new WaterPenaltyRuleValidationResultDto();

        if (!result.IsValid)
        {
            foreach (var err in result.Errors)
            {
                if (err.ErrorMessage.Contains("conflicts with", StringComparison.OrdinalIgnoreCase))
                    dto.Conflicts.Add(err.ErrorMessage);
                else
                    dto.Errors.Add(err.ErrorMessage);
            }
        }

        return dto;
    }
}
