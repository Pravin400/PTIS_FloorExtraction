using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceActivityLogService : IGrievanceActivityLogService
{
    private readonly IRepository<GrievanceActivityLogEntity, long> _repository;
    private readonly IMapper _mapper;

    public GrievanceActivityLogService(
        IRepository<GrievanceActivityLogEntity, long> repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    private IQueryable<GrievanceActivityLogEntity> ApplyIncludes(IQueryable<GrievanceActivityLogEntity> query)
    {
        return query
            .Include(x => x.GrievanceApplication)
            .Include(x => x.FromState)
            .Include(x => x.ToState)
            .Include(x => x.Transition)
            .Include(x => x.ActionByUser)
            .Include(x => x.AssignedToUser);
    }

    public async Task<PagedResult<GrievanceActivityLogDto>> GetAllAsync(
        GrievanceActivityLogQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable().AsNoTracking());
        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = query.Provider is IAsyncQueryProvider
            ? await query.CountAsync(cancellationToken)
            : query.Count();

        var pagedQuery = query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var items = pagedQuery.Provider is IAsyncQueryProvider
            ? await pagedQuery.ToListAsync(cancellationToken)
            : pagedQuery.ToList();

        var dtos = _mapper.Map<List<GrievanceActivityLogDto>>(items);
        return new PagedResult<GrievanceActivityLogDto>(dtos, totalCount, queryParameters.PageNumber, queryParameters.PageSize);
    }

    public async Task<GrievanceActivityLogDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            : query.AsNoTracking().FirstOrDefault(x => x.Id == id);

        return entity == null ? null : _mapper.Map<GrievanceActivityLogDto>(entity);
    }

    public async Task<List<GrievanceActivityLogDto>> GetByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable())
            .Where(x => x.GrievanceApplicationId == grievanceId)
            .OrderBy(x => x.ActionAt);

        var items = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking().ToListAsync(cancellationToken)
            : query.AsNoTracking().ToList();

        return _mapper.Map<List<GrievanceActivityLogDto>>(items);
    }
}
