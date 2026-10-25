using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service for ApplicationSetting CRUD operations
/// </summary>
public class ApplicationSettingService : BaseCommonCrudService<ApplicationSettingEntity, ApplicationSettingDto, CreateApplicationSettingDto, UpdateApplicationSettingDto, ApplicationSettingQueryParameters, int>, IApplicationSettingService
{
    public ApplicationSettingService(IRepository<ApplicationSettingEntity, int> repository, IUnitOfWork unitOfWork, IMapper mapper) : base(repository, unitOfWork, mapper)
    {
    }

    protected override IQueryable<ApplicationSettingEntity> ApplyIncludes(IQueryable<ApplicationSettingEntity> query)
    {
        return query.Include(x => x.Module);
    }

    public async Task<List<ApplicationSettingModuleDto>> GetSettingsAsync(int? moduleId = null, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => x.IsActive);

        if (moduleId.HasValue)
            query = query.Where(x => x.ModuleId == moduleId.Value);

        var records = await query
            .Include(x => x.Module)
            .OrderBy(x => x.Id)
            .ToListAsync(cancellationToken);

        return records
            .GroupBy(x => new
            {
                x.ModuleId,
                ModuleName = x.Module != null ? x.Module.ModuleName : null
            })
            .Select(group =>
            {
                var moduleName = !string.IsNullOrWhiteSpace(group.Key.ModuleName) ? group.Key.ModuleName : "GlobalSettings";
                var values = new Dictionary<string, object?>();

                foreach (var x in group)
                {
                    if (string.IsNullOrWhiteSpace(x.FlagName))
                        continue;

                    object? value = x.DataType?.Trim().ToUpperInvariant() switch
                    {
                        "BIT" or "BOOLEAN" => x.DefaultValue_Bit,
                        "INT" or "INTEGER" or "BIGINT" or "SMALLINT" or "TINYINT" => x.DefaultValue_INT,
                        "FLOAT" or "DECIMAL" or "DOUBLE" or "NUMERIC" => x.DefaultValue_FLOAT,
                        "DATETIME" or "DATE" or "TIMESTAMP" => x.DefaultValue_DateTime,
                        "NVARCHAR" or "VARCHAR" or "CHAR" or "NCHAR" or "TEXT" => x.DefaultValue_NVARCHAR,
                        _ => null
                    };
                    values[x.FlagName] = value;
                }

                return new ApplicationSettingModuleDto
                {
                    ModuleId = group.Key.ModuleId,
                    ModuleName = group.Key.ModuleName,
                    Settings = new Dictionary<string, object?>
                    {
                        [moduleName] = new[] { values }
                    }
                };
            })
            .ToList();
    }
}