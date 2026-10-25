using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master.SocietyWingDetails;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class SocietyWingDetailsService : BaseCommonCrudService<SocietyWingDetailsEntity, SocietyWingDetailsDto, CreateSocietyWingDetailsDto, UpdateSocietyWingDetailsDto, SocietyWingDetailsQueryParameters, int>, ISocietyWingDetailsService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<SocietyDetailsEntity, int> _societydetails;
    private readonly IRepository<PropertyEntity, int> _propertymast;
    private readonly IRepository<WingEntity, int> _wingrepository;
    private readonly IRepository<WingDetailsMastEntity, int>? _wingDetailsMastRepo;
    private readonly IRepository<PropertyAssessmentEntity, int> _propertymastdetails;
    private readonly IRepository<PropertyPhotoEntity, int> _propertyPhotoRepository;
    private readonly IRepository<DocumentBindingEntity, int> _documentBindingRepository;
    private readonly IRepository<DocumentEntity, int> _documentRepository;
    private readonly IRepository<PropertyMapDetailEntity, int> _propertyMapDetailRepository;
    private readonly IRepository<PropertyMastOldEntity, int> _propertyMastOldRepository;

    public SocietyWingDetailsService(
        IRepository<SocietyWingDetailsEntity, int> repository,
        IRepository<PropertyEntity, int> propertymast,
        IRepository<WingEntity, int> wingrepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<SocietyDetailsEntity, int> societydetails,
        IRepository<WingDetailsMastEntity, int>? wingDetailsMastRepo = null,
        IRepository<PropertyAssessmentEntity, int>? propertymastdetails = null,
        IRepository<PropertyPhotoEntity, int>? propertyPhotoRepository = null,
        IRepository<DocumentBindingEntity, int>? documentBindingRepository = null,
        IRepository<DocumentEntity, int>? documentRepository = null,
        IRepository<PropertyMapDetailEntity, int>? propertyMapDetailRepository = null,
        IRepository<PropertyMastOldEntity, int>? propertyMastOldRepository = null)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _societydetails = societydetails;
        _propertymast = propertymast;
        _wingrepository = wingrepository;
        _wingDetailsMastRepo = wingDetailsMastRepo;
        _propertymastdetails = propertymastdetails!;
        _propertyPhotoRepository = propertyPhotoRepository!;
        _documentBindingRepository = documentBindingRepository!;
        _documentRepository = documentRepository!;
        _propertyMapDetailRepository = propertyMapDetailRepository!;
        _propertyMastOldRepository = propertyMastOldRepository!;
    }

    private static readonly System.Text.RegularExpressions.Regex _alphaNumRegex = new System.Text.RegularExpressions.Regex(@"^([A-Za-z]*)(\d+)$", System.Text.RegularExpressions.RegexOptions.Compiled);

    public async Task<PagedResult<WingPropertyDetailsDto>> GetAllAsync(WingPropertyDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        // 1. Base query for properties
        var propertyQuery = _propertymast.GetQueryable()
         .AsNoTracking()
         .Where(p => p.IsActive && !p.MarkedForDeletion);

        if (queryParameters.WingDetailId.HasValue)
        {
            propertyQuery = propertyQuery.Where(p => p.WingDetailId == queryParameters.WingDetailId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.Flag))
        {
            var flag = queryParameters.Flag.Trim().ToUpperInvariant();
            if (flag == "NEW")
            {
                propertyQuery = propertyQuery.Where(p => !_propertyMapDetailRepository.GetQueryable().AsNoTracking()
                    .Any(pmd => pmd.PropertyIdNew == p.Id && pmd.IsActive));
            }
            else if (flag == "OLD")
            {
                propertyQuery = propertyQuery.Where(p => _propertyMapDetailRepository.GetQueryable().AsNoTracking()
                    .Any(pmd => pmd.PropertyIdNew == p.Id && pmd.IsActive));
            }
            else if (flag != "ALL")
            {
                throw new FilterValidationException(nameof(queryParameters.Flag), "Flag must be one of: All, New, Old.");
            }
        }

        // 2. Apply PartitionNo range filter BEFORE the Join (Massive Optimization)
        bool hasFromPartition = !string.IsNullOrWhiteSpace(queryParameters.FromPartitionNo);
        bool hasToPartition = !string.IsNullOrWhiteSpace(queryParameters.ToPartitionNo);

        string? prefix = null;

        if (hasFromPartition || hasToPartition)
        {
            var errors = new Dictionary<string, string>();
            int? fromNum = null;
            int? toNum = null;

            if (hasFromPartition)
            {
                var match = _alphaNumRegex.Match(queryParameters.FromPartitionNo!.Trim());
                if (!match.Success)
                    errors.Add(nameof(queryParameters.FromPartitionNo), "Invalid format. Expected alphanumeric value (e.g., 'P1' or '1').");
                else if (!int.TryParse(match.Groups[2].Value, out var parsedFromNum))
                    errors.Add(nameof(queryParameters.FromPartitionNo), "Numeric portion of FromPartitionNo is too large or invalid.");
                else
                {
                    prefix = match.Groups[1].Value.ToUpper();
                    fromNum = parsedFromNum;
                }
            }

            if (hasToPartition)
            {
                var match = _alphaNumRegex.Match(queryParameters.ToPartitionNo!.Trim());
                if (!match.Success)
                    errors.Add(nameof(queryParameters.ToPartitionNo), "Invalid format. Expected alphanumeric value (e.g., 'P10' or '10').");
                else if (!int.TryParse(match.Groups[2].Value, out var parsedToNum))
                    errors.Add(nameof(queryParameters.ToPartitionNo), "Numeric portion of ToPartitionNo is too large or invalid.");
                else
                {
                    var toPrefix = match.Groups[1].Value.ToUpper();
                    if (prefix != null && prefix != toPrefix)
                    {
                        errors.Add("PartitionNoRange", "FromPartitionNo and ToPartitionNo must have the same alphabetical prefix.");
                    }
                    if (prefix == null)
                    {
                        prefix = toPrefix;
                    }
                    toNum = parsedToNum;
                }
            }

            if (errors.Count > 0)
            {
                throw new FilterValidationException("Validation failed for partition number range.", errors);
            }

            if (prefix != null)
            {
                var prefixLength = prefix.Length;

                if (prefixLength > 0)
                {
                    // 1. Alphanumeric prefix match (e.g., 'P1', 'A10')
                    propertyQuery = propertyQuery.Where(x => 
                        x.PartitionNo != null && 
                        (x.PartitionNo == prefix || EF.Functions.Like(x.PartitionNo, prefix + "[0-9]%")));

                    // 2. Safely extract numeric part and compare
                    if (fromNum.HasValue)
                    {
                        propertyQuery = propertyQuery.Where(x => 
                            (x.PartitionNo == prefix 
                                ? 0 
                                : (!EF.Functions.Like(x.PartitionNo!.Substring(prefixLength), "%[^0-9]%") 
                                    ? Convert.ToInt32(x.PartitionNo!.Substring(prefixLength)) 
                                    : (int?)null)) >= fromNum.Value);
                    }

                    if (toNum.HasValue)
                    {
                        propertyQuery = propertyQuery.Where(x => 
                            (x.PartitionNo == prefix 
                                ? 0 
                                : (!EF.Functions.Like(x.PartitionNo!.Substring(prefixLength), "%[^0-9]%") 
                                    ? Convert.ToInt32(x.PartitionNo!.Substring(prefixLength)) 
                                    : (int?)null)) <= toNum.Value);
                    }
                }
                else
                {
                    // Purely numeric partition numbers (e.g., '1', '10')
                    propertyQuery = propertyQuery.Where(x => 
                        x.PartitionNo != null && !EF.Functions.Like(x.PartitionNo, "%[^0-9]%"));

                    if (fromNum.HasValue)
                    {
                        propertyQuery = propertyQuery.Where(x => Convert.ToInt32(x.PartitionNo) >= fromNum.Value);
                    }

                    if (toNum.HasValue)
                    {
                        propertyQuery = propertyQuery.Where(x => Convert.ToInt32(x.PartitionNo) <= toNum.Value);
                    }
                }
            }
        }

        // 3. Perform Join and Projection
        var query = propertyQuery.Select(p => new WingPropertyDetailsDto
        {
            PropertyId = p.Id,
            WingDetailId = p.WingDetailId,
            PropertyNo = p.PropertyNo,
            PartitionNo = p.PartitionNo,
            WardId = p.WardId,
            OwnerName = p.OwnerName,
            OccupierName = p.OccupierName,
            FlatOrShopNo = p.FlatOrShopNo,
            FlatOrShopName = p.FlatOrShopName,
            BHK = _propertymastdetails.GetQueryable()
                .Where(pms => pms.PropertyId == p.Id && pms.IsActive && !pms.MarkedForDeletion)
                .OrderByDescending(pms => pms.Id)
                .Select(pms => pms.BHKMaster != null ? pms.BHKMaster.BHKName : null)
                .FirstOrDefault(),
            DocumentBindingId = _propertyPhotoRepository.GetQueryable()
                .Where(pp => pp.PropertyId == p.Id && pp.IsLatest && pp.IsActive && !pp.MarkedForDeletion)
                .OrderByDescending(pp => pp.Id)
                .Select(pp => pp.DocumentBindingId)
                .FirstOrDefault(),
            DocumentGuid = (
                from pp in _propertyPhotoRepository.GetQueryable()
                    .Where(pp => pp.PropertyId == p.Id && pp.IsLatest && pp.IsActive && !pp.MarkedForDeletion)
                    .OrderByDescending(pp => pp.Id)
                    .Take(1)
                join db in _documentBindingRepository.GetQueryable().Where(db => db.IsActive && !db.MarkedForDeletion)
                    on pp.DocumentBindingId equals db.Id
                join d in _documentRepository.GetQueryable().Where(d => d.IsActive && !d.MarkedForDeletion)
                    on db.DocumentId equals d.Id
                select (Guid?)d.DocumentGuid
            ).FirstOrDefault(),
            IsActive = p.IsActive
        });

        // Default sort to avoid EF Core warning if no SortBy is specified and Id is not present
        if (hasFromPartition || hasToPartition)
        {
            var prefixParam = prefix ?? "";
            var prefixLen = prefixParam.Length;

            if (prefixLen > 0)
            {
                query = query.OrderBy(x => x.PartitionNo != null && EF.Functions.Like(x.PartitionNo, prefixParam + "[0-9]%") ? prefixParam : x.PartitionNo)
                             .ThenBy(x => x.PartitionNo == prefixParam 
                                    ? 0 
                                    : (x.PartitionNo != null && EF.Functions.Like(x.PartitionNo, prefixParam + "[0-9]%") && !EF.Functions.Like(x.PartitionNo!.Substring(prefixLen), "%[^0-9]%")
                                        ? Convert.ToInt32(x.PartitionNo!.Substring(prefixLen)) 
                                        : (int?)null))
                             .ThenBy(x => x.PropertyId);
            }
            else
            {
                query = query.OrderBy(x => x.PartitionNo != null && !EF.Functions.Like(x.PartitionNo, "%[^0-9]%") ? Convert.ToInt32(x.PartitionNo) : (int?)null)
                             .ThenBy(x => x.PropertyId);
            }
        }
        else
        {
            query = query.OrderBy(x => x.PropertyId);
        }

        // Apply generic logic per project structure
        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<WingPropertyDetailsDto>(items, totalCount, pageNumber, pageSize);
    }

    /// <summary>
    /// Creates a new society wing detail record.
    /// If PropertyId is provided but SocietyDetailId is not, it automatically resolves and saves the associated society details first.
    /// </summary>
    /// <param name="createDto">The data transfer object containing the society wing details.</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A DTO containing the newly created society wing details.</returns>
    public override async Task<SocietyWingDetailsDto> CreateAsync(CreateSocietyWingDetailsDto createDto, CancellationToken cancellationToken = default)
    {
        if (createDto == null)
        {
            throw new ValidationException("Request data cannot be null.", OperationType.Create);
        }

        var wingQuery = _wingrepository.GetQueryable().Where(x => x.IsActive && x.Id == createDto.WingId.Value);
        var isWingIdValid = createDto.WingId.HasValue && (wingQuery is IAsyncEnumerable<WingEntity>
            ? await wingQuery.AnyAsync(cancellationToken)
            : wingQuery.Any());

        if (!isWingIdValid)
        {
            throw new ValidationException($"WingId {createDto.WingId} does not exist or is inactive.", OperationType.Create);
        }

        var propQuery = _propertymast.GetQueryable().Where(x => x.Id == createDto.PropertyId.Value && x.IsActive)
                                             .Select(x => new
                                             {
                                                 x.Id
                                             });
        var mainproperty = createDto.PropertyId.HasValue
            ? (propQuery is IAsyncEnumerable<object>
                ? await propQuery.FirstOrDefaultAsync(cancellationToken)
                : propQuery.FirstOrDefault())
            : null;

        if (mainproperty == null)
        {
            throw new ValidationException($"PropertyId {createDto.PropertyId} does not exist or is inactive.", OperationType.Create);
        }

        if (!string.IsNullOrEmpty(createDto.FromFloor) && !string.IsNullOrEmpty(createDto.ToFloor))
        {
            if (int.TryParse(createDto.FromFloor, out int fromFloor) && int.TryParse(createDto.ToFloor, out int toFloor))
            {
                if (fromFloor > toFloor)
                {
                    throw new ValidationException("FromFloor cannot be greater than ToFloor.", OperationType.Create);
                }
            }
            else
            {
                throw new ValidationException("FromFloor and ToFloor must be valid numeric values.", OperationType.Create);
            }
        }

        // duplicate check
        bool isSocietydetailsExists = false;
        if (_wingDetailsMastRepo != null)
        {
            var q = (
                from sd in _societydetails.GetQueryable()
                join wdm in _wingDetailsMastRepo.GetQueryable() on sd.Id equals wdm.SocietyDetailsMastId
                where sd.PropertyId == createDto.PropertyId && wdm.WingMasterId == createDto.WingId && wdm.WingName == createDto.NewWingName && sd.IsActive && wdm.IsActive
                select wdm
            );
            isSocietydetailsExists = q is IAsyncEnumerable<WingDetailsMastEntity>
                ? await q.AnyAsync(cancellationToken)
                : q.Any();
        }

        if (!isSocietydetailsExists && _repository != null)
        {
            var q1 = _repository.GetQueryable().Where(x => x.IsActive && x.PropertyId == createDto.PropertyId && x.WingId == createDto.WingId);
            bool hasRep = q1 is IAsyncEnumerable<SocietyWingDetailsEntity> ? await q1.AnyAsync(cancellationToken) : q1.Any();

            var q2 = _societydetails.GetQueryable().Where(sd => sd.IsActive && sd.PropertyId == createDto.PropertyId);
            bool hasSoc = q2 is IAsyncEnumerable<SocietyDetailsEntity> ? await q2.AnyAsync(cancellationToken) : q2.Any();

            isSocietydetailsExists = hasRep || hasSoc;
        }

        if (isSocietydetailsExists)
        {
            throw new ValidationException("Wing Details already exists.", OperationType.Create);
        }        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var entity = _mapper.Map<SocietyWingDetailsEntity>(createDto);

            if (!createDto.SocietyDetailId.HasValue && createDto.PropertyId.HasValue)
            {
                var societyDetails = _mapper.Map<SocietyDetailsEntity>(createDto);

                await _societydetails.AddAsync(societyDetails, cancellationToken);

                // Ensure SaveChanges is called here OR rely on the UnitOfWork tracking 
                entity.SocietyDetailsMast = societyDetails;
            }

            if (_repository != null)
            {
                await _repository.AddAsync(entity, cancellationToken);
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return _mapper.Map<SocietyWingDetailsDto>(entity);
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Updates an existing society wing detail record.
    /// If PropertyId is provided but SocietyDetailId is not, it automatically resolves and saves the associated society details first.
    /// </summary>
    public override async Task<SocietyWingDetailsDto?> UpdateAsync(int id, UpdateSocietyWingDetailsDto updateDto, CancellationToken cancellationToken = default)
    {
        // FromFloor to ToFloor validation
        if (!string.IsNullOrEmpty(updateDto.FromFloor) && !string.IsNullOrEmpty(updateDto.ToFloor))
        {
            bool isFromValid = int.TryParse(updateDto.FromFloor, out int fromFloor);
            bool isToValid = int.TryParse(updateDto.ToFloor, out int toFloor);

            if (!isFromValid || !isToValid)
            {
                throw new ValidationException("FromFloor and ToFloor must be valid numeric values.", OperationType.Update);
            }

            if (fromFloor > toFloor)
            {
                throw new ValidationException("FromFloor cannot be greater than ToFloor.", OperationType.Update);
            }
        }

        // --- Transactional work ---
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var entity = await _repository.GetQueryable().FirstOrDefaultAsync(x => x.SocietyDetailId == id, cancellationToken);
            if (entity == null)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return default;
            }

            _mapper.Map(updateDto, entity);

            // Update the SocietyDetails record using the same SocietyDetailId (id)
            var existingSocietyDetails = await _societydetails.GetByIdAsync(id, cancellationToken);
            if (existingSocietyDetails != null)
            {
                _mapper.Map(updateDto, existingSocietyDetails);
                await _societydetails.UpdateAsync(existingSocietyDetails, cancellationToken);
            }

            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return _mapper.Map<SocietyWingDetailsDto>(entity);
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Validates deactivation (IsActive change from true to false) for SocietyWingDetailsEntity.
    /// Uses centralized IReferenceValidationService to check references in related tables.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        SocietyWingDetailsEntity currentEntity,
        SocietyWingDetailsEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<SocietyWingDetailsEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validates delete operation for SocietyWingDetailsEntity.
    /// Uses centralized IReferenceValidationService to check references in related tables.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        SocietyWingDetailsEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<SocietyWingDetailsEntity>(id, cancellationToken);
    }

    /// <summary>
    /// Gets a society wing detail record by SocietyDetailId.
    /// Returns joined data from both SocietyDetails and SocietyWingDetails tables.
    /// </summary>
    public override async Task<SocietyWingDetailsDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var societyQuery = _societydetails.GetQueryable();
        var wingQuery = _repository.GetQueryable();
        var wingDetailsQuery = _wingDetailsMastRepo != null ? _wingDetailsMastRepo.GetQueryable().Where(w => w.IsActive && !w.MarkedForDeletion) : Enumerable.Empty<WingDetailsMastEntity>().AsQueryable();

        var result = await (from sd in societyQuery
                            join wdm in wingDetailsQuery on sd.Id equals wdm.SocietyDetailsMastId into wdmGroup
                            from wdm in wdmGroup.DefaultIfEmpty()
                            join sw in wingQuery on sd.Id equals sw.SocietyDetailId into swGroup
                            from sw in swGroup.DefaultIfEmpty()
                            where sd.Id == id
                            select new SocietyWingDetailsDto
                            {
                                Id = sw != null ? sw.Id : 0,
                                WingId = wdm != null ? (int?)wdm.WingMasterId : null,
                                PropertyId = sd.PropertyId,
                                SocietyDetailId = sd.Id,
                                FromFloor = sw != null ? sw.FromFloor : null,
                                ToFloor = sw != null ? sw.ToFloor : null,
                                OldWingName = sw != null ? sw.OldWingName : null,
                                NewWingName = sw != null ? sw.NewWingName : (wdm != null ? wdm.WingName : null),
                                NoOfFlat = sw != null ? sw.NoOfFlat : null,
                                NoOfShop = sw != null ? sw.NoOfShop : null,
                                NoOfRowHouse = sw != null ? sw.NoOfRowHouse : null,
                                IsActive = sw != null ? sw.IsActive : sd.IsActive,
                                CreatedBy = sw != null ? sw.CreatedBy : sd.CreatedBy,
                                CreatedDate = sw != null ? sw.CreatedDate : sd.CreatedDate,
                                UpdatedBy = sw != null ? sw.UpdatedBy : sd.UpdatedBy,
                                UpdatedDate = sw != null ? sw.UpdatedDate : sd.UpdatedDate
                            }).FirstOrDefaultAsync(cancellationToken);

        return result;
    }

    public override async Task<PagedResult<SocietyWingDetailsDto>> GetAllAsync(SocietyWingDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var societyQuery = _societydetails.GetQueryable();
        var wingQuery = _repository.GetQueryable();
        var wingDetailsQuery = _wingDetailsMastRepo != null ? _wingDetailsMastRepo.GetQueryable().Where(w => w.IsActive && !w.MarkedForDeletion) : Enumerable.Empty<WingDetailsMastEntity>().AsQueryable();

        var query = from sd in societyQuery
                    join sw in wingQuery on sd.Id equals sw.SocietyDetailId into swGroup
                    from sw in swGroup.DefaultIfEmpty()
                    join wdm in wingDetailsQuery on sd.Id equals wdm.SocietyDetailsMastId into wdmGroup
                    from wdm in wdmGroup.OrderByDescending(w => w.CreatedDate).Take(1).DefaultIfEmpty()
                    select new SocietyWingDetailsDto
                    {
                        Id = sw != null ? sw.Id : 0,
                        WingId = wdm != null ? (int?)wdm.WingMasterId : null,
                        PropertyId = sd.PropertyId,
                        SocietyDetailId = sd.Id,
                        FromFloor = sw != null ? sw.FromFloor : null,
                        ToFloor = sw != null ? sw.ToFloor : null,
                        OldWingName = sw != null ? sw.OldWingName : null,
                        NewWingName = sw != null ? sw.NewWingName : (wdm != null ? wdm.WingName : null),
                        NoOfFlat = sw != null ? sw.NoOfFlat : null,
                        NoOfShop = sw != null ? sw.NoOfShop : null,
                        NoOfRowHouse = sw != null ? sw.NoOfRowHouse : null,
                        IsActive = sw != null ? sw.IsActive : sd.IsActive,
                        CreatedBy = sw != null ? sw.CreatedBy : sd.CreatedBy,
                        CreatedDate = sw != null ? sw.CreatedDate : sd.CreatedDate,
                        UpdatedBy = sw != null ? sw.UpdatedBy : sd.UpdatedBy,
                        UpdatedDate = sw != null ? sw.UpdatedDate : sd.UpdatedDate
                    };

        // Default to active records if IsActive is not explicitly filtered
        if (!queryParameters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == true);
        }

        // Apply generic logic per project structure
        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<SocietyWingDetailsDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.SocietyDetailId == id, cancellationToken);
        if (entity == null || !entity.IsActive)
            return false;

        var validationResult = await ValidateForDeleteAsync(entity.Id, entity, cancellationToken);
        if (!validationResult.IsValid)
        {
            var firstError = validationResult.Errors.FirstOrDefault()?.ErrorMessage ?? "Validation failed for delete operation";
            throw new ValidationException(firstError, validationResult.ToDictionary(), OperationType.Delete);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Soft delete the SocietyWingDetails record
            entity.IsActive = false;
            await _repository.UpdateAsync(entity, cancellationToken);

            // Soft delete the SocietyDetails record
            var societyDetails = await _societydetails.GetByIdAsync(id, cancellationToken);
            if (societyDetails != null && societyDetails.IsActive)
            {
                societyDetails.IsActive = false;
                societyDetails.MarkedForDeletion = true;
                await _societydetails.UpdateAsync(societyDetails, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return true;
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}