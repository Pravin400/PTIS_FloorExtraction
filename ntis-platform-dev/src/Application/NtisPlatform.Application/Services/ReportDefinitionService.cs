using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class ReportDefinitionService
    : BaseCommonCrudService<ReportDefinitionEntity, ReportDefinitionDto,
        CreateReportDefinitionDto, UpdateReportDefinitionDto,
        ReportDefinitionQueryParameters, int>,
      IReportDefinitionService
{
    public ReportDefinitionService(
        IRepository<ReportDefinitionEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentTenantService currentTenant)
        : base(repository, unitOfWork, mapper)
    {
        _currentTenant = currentTenant;
    }

    private readonly ICurrentTenantService _currentTenant;

    protected override IQueryable<ReportDefinitionEntity> ApplyReadScope(
        IQueryable<ReportDefinitionEntity> query)
    {
        var tenantId = _currentTenant.GetCurrentTenantId();
        return query.Where(x => (x.TenantId == null || x.TenantId == tenantId)
            && x.DefaultHtmlTemplateVersionId != null);
    }

    public override async Task<ReportDefinitionDto?> GetByIdAsync(
        int id, CancellationToken cancellationToken = default)
    {
        var tenantId = _currentTenant.GetCurrentTenantId();
        var entity = await _repository.GetQueryable().AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id
                && (x.TenantId == null || x.TenantId == tenantId)
                && x.DefaultHtmlTemplateVersionId != null, cancellationToken);
        return entity is null ? null : _mapper.Map<ReportDefinitionDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        ReportDefinitionEntity entity,
        CancellationToken ct = default)
    {
        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => x.ReportCode == entity.ReportCode && x.TenantId == entity.TenantId, ct);

        return duplicate
            ? ValidationResult.Failure(nameof(entity.ReportCode), "Report_ReportCode_Duplicate")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ReportDefinitionEntity currentEntity,
        ReportDefinitionEntity updatedEntity,
        CancellationToken ct = default)
    {
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ReportDefinitionEntity entity,
        CancellationToken ct = default)
    {
        return ValidationResult.Success();
    }
}
