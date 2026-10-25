using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class ReportParameterDefinitionService
    : BaseCommonCrudService<ReportParameterDefinitionEntity, ReportParameterDefinitionDto,
        CreateReportParameterDefinitionDto, UpdateReportParameterDefinitionDto,
        ReportParameterDefinitionQueryParameters, int>,
      IReportParameterDefinitionService
{
    public ReportParameterDefinitionService(
        IRepository<ReportParameterDefinitionEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<ReportDefinitionEntity, int> definitionRepository,
        ICurrentTenantService currentTenant)
        : base(repository, unitOfWork, mapper)
    {
        _definitionRepository = definitionRepository;
        _currentTenant = currentTenant;
    }

    private readonly IRepository<ReportDefinitionEntity, int> _definitionRepository;
    private readonly ICurrentTenantService _currentTenant;

    protected override IQueryable<ReportParameterDefinitionEntity> ApplyReadScope(
        IQueryable<ReportParameterDefinitionEntity> query)
    {
        var tenantId = _currentTenant.GetCurrentTenantId();
        var visibleDefinitions = _definitionRepository.GetQueryable()
            .Where(x => (x.TenantId == null || x.TenantId == tenantId)
                && x.DefaultHtmlTemplateVersionId != null)
            .Select(x => x.Id);
        return query.Where(x => visibleDefinitions.Contains(x.ReportDefinitionId));
    }

    public override async Task<ReportParameterDefinitionDto?> GetByIdAsync(
        int id, CancellationToken cancellationToken = default)
    {
        var entity = await ApplyReadScope(_repository.GetQueryable()).AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? null : _mapper.Map<ReportParameterDefinitionDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        ReportParameterDefinitionEntity entity,
        CancellationToken ct = default)
    {
        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => x.ReportDefinitionId == entity.ReportDefinitionId
                        && x.ParameterKey == entity.ParameterKey, ct);

        return duplicate
            ? ValidationResult.Failure(nameof(entity.ParameterKey), "ReportParam_ParameterKey_Duplicate")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ReportParameterDefinitionEntity currentEntity,
        ReportParameterDefinitionEntity updatedEntity,
        CancellationToken ct = default)
    {
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ReportParameterDefinitionEntity entity,
        CancellationToken ct = default)
    {
        return ValidationResult.Success();
    }
}
