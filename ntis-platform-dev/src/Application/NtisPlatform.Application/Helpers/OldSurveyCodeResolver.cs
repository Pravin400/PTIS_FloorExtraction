using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Helpers;

/// <summary>
/// Completes the old-survey DTOs (the "Existing Assessment (Previous)" table) from the masters and from PropertyDetailsOld:
/// the short master codes (floor G/1/2, use R/C/I, construction A/B/AB), the descriptions, the construction year, the
/// assessment year and the property type name.
/// PropertyMastOld itself is mostly empty for construction year / construction type, so the latest PropertyDetailsOld row of the
/// old property fills what PropertyMastOld does not carry.
/// </summary>
public static class OldSurveyCodeResolver
{
    public static async Task ApplyAsync(
        IEnumerable<OldSurveyPropertyDto> oldSurveys,
        IRepository<PropertyDetailsOldEntity, int>? detailsRepository,
        IRepository<FloorEntity, int>? floorRepository,
        IRepository<ConstructionTypeEntity, int>? constructionTypeRepository,
        IRepository<TypeOfUseEntity, int>? typeOfUseRepository,
        CancellationToken cancellationToken = default,
        IRepository<SubTypeOfUseEntity, int>? subTypeOfUseRepository = null,
        IRepository<PropertyTypeMasterEntity, int>? propertyTypeRepository = null)
    {
        var targets = oldSurveys.Where(o => o != null && o.Id > 0).ToList();
        if (targets.Count == 0) return;

        if (detailsRepository != null && floorRepository != null
            && constructionTypeRepository != null && typeOfUseRepository != null)
        {
            await ApplyDetailsAsync(targets, detailsRepository, floorRepository, constructionTypeRepository,
                typeOfUseRepository, subTypeOfUseRepository, cancellationToken);
        }

        await ApplyPropertyTypeAsync(targets, propertyTypeRepository, cancellationToken);

        // Last resort for the assessment year: the year of the old assessment date.
        foreach (var dto in targets)
        {
            if (!dto.OldAssessmentYear.HasValue && dto.OldAssessmentDate.HasValue)
                dto.OldAssessmentYear = dto.OldAssessmentDate.Value.Year;
        }
    }

    private static async Task ApplyDetailsAsync(
        List<OldSurveyPropertyDto> targets,
        IRepository<PropertyDetailsOldEntity, int> detailsRepository,
        IRepository<FloorEntity, int> floorRepository,
        IRepository<ConstructionTypeEntity, int> constructionTypeRepository,
        IRepository<TypeOfUseEntity, int> typeOfUseRepository,
        IRepository<SubTypeOfUseEntity, int>? subTypeOfUseRepository,
        CancellationToken cancellationToken)
    {
        var oldIds = targets.Select(o => (int)o.Id).Distinct().ToList();

        var details = await detailsRepository.GetQueryable().AsNoTracking()
            .Where(d => oldIds.Contains(d.PropertyMastOldId) && d.IsActive && !d.MarkedForDeletion)
            .Select(d => new
            {
                d.Id, d.PropertyMastOldId, d.OldFloorId, d.OldConstructionTypeId, d.OldTypeOfUseId, d.OldSubTypeOfUseId,
                d.OldConstructionYear, d.OldAssessmentYear
            })
            .ToListAsync(cancellationToken);
        if (details.Count == 0) return;

        var latestByOld = details
            .GroupBy(d => d.PropertyMastOldId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(d => d.Id).First());

        var floorIds = latestByOld.Values.Where(d => d.OldFloorId.HasValue).Select(d => d.OldFloorId!.Value).Distinct().ToList();
        var ctIds = latestByOld.Values.Where(d => d.OldConstructionTypeId.HasValue).Select(d => d.OldConstructionTypeId!.Value).Distinct().ToList();
        var touIds = latestByOld.Values.Where(d => d.OldTypeOfUseId.HasValue).Select(d => d.OldTypeOfUseId!.Value).Distinct().ToList();
        var stouIds = latestByOld.Values.Where(d => d.OldSubTypeOfUseId.HasValue).Select(d => d.OldSubTypeOfUseId!.Value).Distinct().ToList();

        var floors = floorIds.Count == 0
            ? new Dictionary<int, (string? Code, string? Description)>()
            : await floorRepository.GetQueryable().AsNoTracking()
                .Where(f => floorIds.Contains(f.Id))
                .ToDictionaryAsync(f => f.Id, f => (Code: f.FloorCode, Description: f.Description), cancellationToken);
        var constructionTypes = ctIds.Count == 0
            ? new Dictionary<int, (string? Code, string? Description)>()
            : await constructionTypeRepository.GetQueryable().AsNoTracking()
                .Where(c => ctIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => (Code: c.ConstructionCode, Description: c.Description), cancellationToken);
        var typesOfUse = touIds.Count == 0
            ? new Dictionary<int, (string? Code, string? Description)>()
            : await typeOfUseRepository.GetQueryable().AsNoTracking()
                .Where(t => touIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id, t => (Code: t.TypeOfUseCode, Description: t.Description), cancellationToken);
        var subTypesOfUse = subTypeOfUseRepository == null || stouIds.Count == 0
            ? new Dictionary<int, string?>()
            : await subTypeOfUseRepository.GetQueryable().AsNoTracking()
                .Where(s => stouIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Description, cancellationToken);

        foreach (var dto in targets)
        {
            if (!latestByOld.TryGetValue((int)dto.Id, out var d)) continue;

            if (d.OldFloorId.HasValue && floors.TryGetValue(d.OldFloorId.Value, out var floor))
            {
                dto.FloorCode = floor.Code;
                if (string.IsNullOrWhiteSpace(dto.Floor)) dto.Floor = floor.Description;
            }
            if (d.OldConstructionTypeId.HasValue && constructionTypes.TryGetValue(d.OldConstructionTypeId.Value, out var ct))
            {
                dto.ConstructionCode = ct.Code;
                if (string.IsNullOrWhiteSpace(dto.ConstructionType)) dto.ConstructionType = ct.Description;
            }
            if (d.OldTypeOfUseId.HasValue && typesOfUse.TryGetValue(d.OldTypeOfUseId.Value, out var tou))
            {
                dto.TypeOfUseCode = tou.Code;
                if (string.IsNullOrWhiteSpace(dto.TypeOfUse)) dto.TypeOfUse = tou.Description;
            }
            if (d.OldSubTypeOfUseId.HasValue && subTypesOfUse.TryGetValue(d.OldSubTypeOfUseId.Value, out var subTypeDescription))
            {
                dto.SubTypeOfUse = subTypeDescription;
            }

            if (string.IsNullOrWhiteSpace(dto.ConstructionYear) && !string.IsNullOrWhiteSpace(d.OldConstructionYear))
                dto.ConstructionYear = d.OldConstructionYear.Trim();

            if (!dto.OldAssessmentYear.HasValue && int.TryParse(d.OldAssessmentYear?.Trim(), out var detailYear) && detailYear > 0)
                dto.OldAssessmentYear = detailYear;
        }
    }

    private static async Task ApplyPropertyTypeAsync(
        List<OldSurveyPropertyDto> targets,
        IRepository<PropertyTypeMasterEntity, int>? propertyTypeRepository,
        CancellationToken cancellationToken)
    {
        if (propertyTypeRepository == null) return;

        var typeIds = targets.Where(t => t.OldPropertyTypeId.HasValue).Select(t => t.OldPropertyTypeId!.Value).Distinct().ToList();
        if (typeIds.Count == 0) return;

        var propertyTypes = await propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(p => typeIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => (Name: p.PropertyDescription, Code: p.PartType), cancellationToken);

        foreach (var dto in targets)
        {
            if (dto.OldPropertyTypeId.HasValue && propertyTypes.TryGetValue(dto.OldPropertyTypeId.Value, out var propertyType))
            {
                dto.OldPropertyTypeName = propertyType.Name;
                dto.OldPropertyTypeCode = propertyType.Code;
            }
        }
    }
}
