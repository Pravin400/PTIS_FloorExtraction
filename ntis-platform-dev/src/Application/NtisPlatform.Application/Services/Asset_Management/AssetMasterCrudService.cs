using System.Reflection;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// CRUD base for the Asset Management master services. Behaves like
/// <see cref="BaseCommonCrudService{TEntity, TDto, TCreateDto, TUpdateDto, TQueryParams, TKey}"/>, except that:
/// <list type="bullet">
///   <item>a single-item create/update validation failure reaches the client with a top-level message naming every
///   clashing field (see <see cref="AssetMasterValidation.WithFieldMessages"/>);</item>
///   <item>bulk create/update validate each item against the items accepted before it in the same batch.</item>
/// </list>
/// </summary>
/// <remarks>
/// The base bulk loops validate every item against the saved rows and save the accepted items only after the loop,
/// so a uniqueness check could not see them: two new items with the same name both passed, two updates moving to
/// the same free code both passed and then failed together on the unique index, and a code released by an earlier
/// update (LAND -> PLOT) still blocked a later update reusing it (BLDG -> LAND). Here each accepted item is saved
/// as soon as it passes, inside the batch transaction, so the next item's checks (code/name uniqueness, year-range
/// overlap) see it and the values it released. Conflicts stay item-level failures (the validation hooks return
/// them), the valid items are still saved, and the batch is still rolled back on an unexpected error. A duplicate
/// that another request saves between an item's check and its save is also reported for that item only.
/// </remarks>
public abstract class AssetMasterCrudService<TEntity, TDto, TCreateDto, TUpdateDto, TQueryParams>
    : BaseCommonCrudService<TEntity, TDto, TCreateDto, TUpdateDto, TQueryParams, int>
    where TEntity : class
    where TDto : class
    where TQueryParams : BaseQueryParameters
    where TCreateDto : class
    where TUpdateDto : class
{
    private static readonly MethodInfo MemberwiseCloneMethod =
        typeof(object).GetMethod(nameof(MemberwiseClone), BindingFlags.Instance | BindingFlags.NonPublic)!;

    protected AssetMasterCrudService(IRepository<TEntity, int> repository, IUnitOfWork unitOfWork, IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    public override async Task<TDto> CreateAsync(TCreateDto createDto, CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.CreateAsync(createDto, cancellationToken);
        }
        catch (ValidationException ex) when (ex.OperationType == OperationType.Create)
        {
            throw AssetMasterValidation.WithFieldMessages(ex);
        }
    }

    public override async Task<TDto?> UpdateAsync(int id, TUpdateDto updateDto, CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.UpdateAsync(id, updateDto, cancellationToken);
        }
        catch (ValidationException ex) when (ex.OperationType == OperationType.Update)
        {
            throw AssetMasterValidation.WithFieldMessages(ex);
        }
    }

    // Same flow and error format as the base non-localized bulk create, but each accepted item is saved before the
    // next one is validated. The AMS masters are not localized; a localized subclass keeps the base behaviour.
    public override async Task<BulkResult<TDto>> BulkCreateAsync(TCreateDto[] items, CancellationToken cancellationToken = default)
    {
        if (items.Length == 0 || IsLocalizationEnabled)
            return await base.BulkCreateAsync(items, cancellationToken);

        var results = new List<TDto>();
        var validationErrors = new List<string>();
        var validationFailedCount = 0;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            for (int i = 0; i < items.Length; i++)
            {
                var entity = _mapper.Map<TEntity>(items[i]);

                var validationResult = await ValidateForCreateAsync(entity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    validationFailedCount++;
                    validationErrors.Add($"Item {i}: {FormatErrors(validationResult)}");
                    continue;
                }

                await _repository.AddAsync(entity, cancellationToken);
                if (!await TrySaveItemAsync(cancellationToken))
                {
                    validationFailedCount++;
                    validationErrors.Add($"Item {i}: {AssetMasterValidation.DuplicateRecordMessage}");
                    continue;
                }

                results.Add(_mapper.Map<TDto>(entity));
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return new BulkResult<TDto>(results.Count, validationFailedCount, results, validationErrors.Count > 0 ? validationErrors : null);
    }

    // Same flow and error format as the base bulk update (validate an untracked clone, then apply to the tracked
    // entity), but each accepted update is saved before the next item is validated.
    public override async Task<BulkResult<TDto>> BulkUpdateAsync(
        BulkUpdateItem<int, TUpdateDto>[] items, CancellationToken cancellationToken = default)
    {
        if (items.Length == 0 || IsLocalizationEnabled)
            return await base.BulkUpdateAsync(items, cancellationToken);

        var results = new List<TDto>();
        var errors = new List<string>();
        var failedCount = 0;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var item in items)
            {
                var entity = await _repository.GetByIdAsync(item.Id, cancellationToken);
                if (entity is null)
                {
                    failedCount++;
                    errors.Add($"Record with Id '{item.Id}' not found.");
                    continue;
                }

                var currentEntitySnapshot = Clone(entity);
                var tempEntity = Clone(entity);
                _mapper.Map(item.Data, tempEntity);

                var validationResult = await ValidateForDeactivationAsync(item.Id, currentEntitySnapshot, tempEntity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    failedCount++;
                    errors.Add($"Record with Id '{item.Id}': {FormatErrors(validationResult)}");
                    continue;
                }

                _mapper.Map(item.Data, entity);
                await _repository.UpdateAsync(entity, cancellationToken);
                if (!await TrySaveItemAsync(cancellationToken))
                {
                    failedCount++;
                    errors.Add($"Record with Id '{item.Id}': {AssetMasterValidation.DuplicateRecordMessage}");
                    continue;
                }

                // Mapped now, not after the loop: the same Id can appear more than once in a request, and the
                // tracked entity would by then hold only the last item's values for every one of its results.
                results.Add(_mapper.Map<TDto>(entity));
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return new BulkResult<TDto>(results.Count, failedCount, results, errors.Count > 0 ? errors : null);
    }

    // Saves the current item inside the batch transaction. A duplicate-key error here means another request saved
    // the same unique value after this item was checked: the item's unsaved changes are discarded, it is reported
    // like any other failed item and the batch goes on (EF Core rolls the failed save back to its savepoint, so
    // the items already saved stay in the transaction). Any other database error still ends the batch.
    private async Task<bool> TrySaveItemAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (AssetMasterValidation.IsDuplicateKey(ex))
        {
            _unitOfWork.DiscardChanges();
            return false;
        }
    }

    // Same per-item format as the base bulk loops: "Property: message, Property: message".
    private static string FormatErrors(ValidationResult validationResult)
        => string.Join(", ", validationResult.Errors.Select(e =>
            string.IsNullOrEmpty(e.PropertyName) ? e.ErrorMessage : $"{e.PropertyName}: {e.ErrorMessage}"));

    // Shallow copy, as the base update paths use for the before/after validation snapshots.
    private static TEntity Clone(TEntity entity) => (TEntity)MemberwiseCloneMethod.Invoke(entity, null)!;
}
