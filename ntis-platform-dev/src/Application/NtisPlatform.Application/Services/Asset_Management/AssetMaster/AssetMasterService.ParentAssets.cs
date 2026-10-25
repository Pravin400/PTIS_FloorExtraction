using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Services.Asset_Management
{
    public partial class AssetMasterService
    {
        #region Parent Asset List

        private const string PlanDocumentCode = "DOC-PLAN";
        private const string TitleDocumentCode = "DOC-TITLE";
        private const string SurveyDocumentCode = "DOC-SURVEY";

        /// <summary>Uncancelled demand row keyed by the main asset it rolls up to.</summary>
        private sealed class DemandOwnerRow
        {
            public int OwnerId { get; set; }
            public decimal PendingAmount { get; set; }
        }

        public async Task<ParentAssetListResponseDto> GetParentAssetDetailsAsync(AssetMasterQueryParameters queryParameters, CancellationToken cancellationToken = default)
        {
            // Always the main-asset list; a ParentAssetId filter would turn it into a child listing.
            queryParameters.ParentAssetId = null;

            var today = DateTime.Today;
            var query = BuildAssetListQuery(queryParameters);
            var summary = await GetParentAssetSummaryAsync(query, today, cancellationToken);
            var totalCount = summary.TotalParentAssets;

            var pageQuery = ApplyParentAssetListSort(query, queryParameters);
            int pageNumber = queryParameters.PageNumber;
            int pageSize = queryParameters.PageSize;
            if (pageSize != -1)
            {
                pageQuery = pageQuery
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize);
            }
            else
            {
                pageSize = totalCount > 0 ? totalCount : 1;
                pageNumber = 1;
            }

            var items = await pageQuery
                .Select(a => new ParentAssetListItemDto
                {
                    Id = a.Id,
                    AssetNo = a.AssetNo,
                    AssetName = a.AssetName,
                    AssetRegionalName = a.AssetRegionalName,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetCategoryId = a.AssetCategoryId,
                    AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                    AssetTypeId = a.AssetTypeId,
                    AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                    MpmsNo = a.Details != null ? a.Details.MpmsNo : null,
                    PlotAreaSqMeter = a.Details != null ? a.Details.LandAreaSqMeter : null,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    AssetConditionId = a.AssetConditionId,
                    EncroachmentStatus = a.EncroachmentStatus
                })
                .ToListAsync(cancellationToken);

            if (items.Count > 0)
            {
                await EnrichParentAssetRowsAsync(items, today, cancellationToken);
            }

            return new ParentAssetListResponseDto(items, totalCount, pageNumber, pageSize)
            {
                Summary = summary
            };
        }

        /// <summary>
        /// Sort for the parent list. CapitalValue and AssetLife are ordered by the rows each page row
        /// rolls up (<see cref="FloorRowsUnderParents"/>: the asset's own floor rows and its active
        /// sub-units', never an inventory unit's), so the order matches the CapitalValue and
        /// ConstructionYear the rows show. Every other SortBy uses the shared list sort.
        /// </summary>
        private IQueryable<AssetMasterEntity> ApplyParentAssetListSort(IQueryable<AssetMasterEntity> query, AssetMasterQueryParameters queryParameters)
        {
            var byCapitalValue = string.Equals(queryParameters.SortBy, "CapitalValue", StringComparison.OrdinalIgnoreCase);
            var byAssetLife = string.Equals(queryParameters.SortBy, "AssetLife", StringComparison.OrdinalIgnoreCase);
            if (!byCapitalValue && !byAssetLife)
            {
                return ApplyAssetListSort(query, queryParameters);
            }

            var descending = queryParameters.SortOrder?.ToLower() == "desc";
            var rows = FloorRowsUnderParents(query.Select(a => a.Id))
                .Select(fd => new { OwnerId = fd.Asset!.ParentAssetId ?? fd.AssetId, fd.CapitalValue, fd.ConstructionYear });

            IOrderedQueryable<AssetMasterEntity> ordered;
            if (byCapitalValue)
            {
                Expression<Func<AssetMasterEntity, decimal>> capitalValue = a => rows
                    .Where(r => r.OwnerId == a.Id)
                    .Sum(r => r.CapitalValue ?? 0m);
                ordered = descending ? query.OrderByDescending(capitalValue) : query.OrderBy(capitalValue);
            }
            else
            {
                // The oldest construction year is the longest life, so descending AssetLife is ascending year.
                Expression<Func<AssetMasterEntity, string?>> oldestConstructionYear = a => rows
                    .Where(r => r.OwnerId == a.Id && r.ConstructionYear != null && r.ConstructionYear != "")
                    .Min(r => r.ConstructionYear);
                ordered = descending ? query.OrderBy(oldestConstructionYear) : query.OrderByDescending(oldestConstructionYear);
            }

            return ThenById(ordered, descending);
        }

        private async Task<ParentAssetListSummaryDto> GetParentAssetSummaryAsync(
            IQueryable<AssetMasterEntity> query, DateTime today, CancellationToken cancellationToken)
        {
            var stats = await query
                .GroupBy(a => 1)
                .Select(g => new
                {
                    TotalCount = g.Count(),
                    ActiveCount = g.Count(a => a.IsActive),
                    EncroachedCount = g.Count(a => a.EncroachmentStatus != null
                                                   && a.EncroachmentStatus != ""
                                                   && !NotEncroachedStatuses.Contains(a.EncroachmentStatus))
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (stats == null || stats.TotalCount == 0)
            {
                return new ParentAssetListSummaryDto();
            }

            var parentIds = query.Select(a => a.Id);
            var floorRows = FloorRowsUnderParents(parentIds);

            var totalCapitalValue = await floorRows.SumAsync(fd => fd.CapitalValue ?? 0m, cancellationToken);

            var subUnitStats = await SubUnitsUnderParents(parentIds)
                .GroupBy(c => 1)
                .Select(g => new { Total = g.Count(), Active = g.Count(c => c.IsActive) })
                .FirstOrDefaultAsync(cancellationToken);

            var rentByFrequency = await CurrentLeasesUnderParents(parentIds, today)
                .GroupBy(r => r.PaymentFrequency)
                .Select(g => new { Frequency = g.Key, Rent = g.Sum(r => r.RentAmount ?? 0m) })
                .ToListAsync(cancellationToken);

            var totalOutstanding = await DemandRowsUnderParents(parentIds)
                .SumAsync(d => d.PendingAmount, cancellationToken);

            return new ParentAssetListSummaryDto
            {
                TotalParentAssets = stats.TotalCount,
                ActiveParentAssets = stats.ActiveCount,
                EncroachedAssets = stats.EncroachedCount,
                TotalSubUnits = subUnitStats?.Total ?? 0,
                ActiveSubUnits = subUnitStats?.Active ?? 0,
                TotalCapitalValue = totalCapitalValue,
                TotalAnnualRevenue = rentByFrequency.Sum(x => AnnualizeRent(x.Rent, x.Frequency)),
                TotalOutstanding = totalOutstanding
            };
        }

        private async Task EnrichParentAssetRowsAsync(List<ParentAssetListItemDto> items, DateTime today, CancellationToken cancellationToken)
        {
            var pageIds = items.Select(x => x.Id).ToList();
            var pageIdQuery = _repository.GetQueryable().Where(a => pageIds.Contains(a.Id)).Select(a => a.Id);

            var locations = await GetLocationInfoByAssetIdsAsync(pageIds, cancellationToken);

            var subUnitCounts = await SubUnitsUnderParents(pageIdQuery)
                .GroupBy(c => c.ParentAssetId!.Value)
                .Select(g => new { ParentAssetId = g.Key, Total = g.Count(), Active = g.Count(c => c.IsActive) })
                .ToDictionaryAsync(x => x.ParentAssetId, cancellationToken);

            // Structure, area, construction, type of use and capital value all derive from this
            // one row set (the asset's own floor rows + its active sub-units').
            var floorRows = await FloorRowsUnderParents(pageIdQuery)
                .Select(fd => new
                {
                    OwnerId = fd.Asset!.ParentAssetId ?? fd.AssetId,
                    fd.AssetId,
                    fd.FloorId,
                    fd.ConstructionYear,
                    ConstructionTypeName = fd.ConstructionType != null ? fd.ConstructionType.Description : null,
                    fd.TypeOfUseId,
                    fd.CarpetAreaSqMeter,
                    fd.BuiltUpAreaSqMeter,
                    fd.CapitalValue
                })
                .ToListAsync(cancellationToken);
            var floorRowsByOwner = floorRows.ToLookup(x => x.OwnerId);

            var typeOfUseIds = floorRows.Where(x => x.TypeOfUseId > 0).Select(x => x.TypeOfUseId).Distinct().ToList();
            var typeOfUseNames = typeOfUseIds.Count == 0
                ? new Dictionary<int, string?>()
                : await _amsTypeOfUseRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(t => typeOfUseIds.Contains(t.Id))
                    .ToDictionaryAsync(t => t.Id, t => (string?)t.Description, cancellationToken);

            var conditionIds = items.Where(x => x.AssetConditionId.HasValue)
                .Select(x => x.AssetConditionId!.Value).Distinct().ToList();
            var conditionNames = conditionIds.Count == 0
                ? new Dictionary<int, string?>()
                : await _conditionRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(c => conditionIds.Contains(c.Id))
                    .ToDictionaryAsync(c => c.Id, c => (string?)c.ConditionName, cancellationToken);

            var leaseRows = await CurrentLeasesUnderParents(pageIdQuery, today)
                .Select(r => new
                {
                    OwnerId = r.Asset!.ParentAssetId ?? r.AssetId,
                    r.RentAmount,
                    r.PaymentFrequency
                })
                .ToListAsync(cancellationToken);
            var leaseRowsByOwner = leaseRows.ToLookup(x => x.OwnerId);

            var outstandingByOwner = await DemandRowsUnderParents(pageIdQuery)
                .GroupBy(d => d.OwnerId)
                .Select(g => new { OwnerId = g.Key, Pending = g.Sum(d => d.PendingAmount) })
                .ToDictionaryAsync(x => x.OwnerId, x => x.Pending, cancellationToken);

            // Same photo/document filters as GetByIdAsync, so the counts match the detail view.
            var photoRows = await _assetPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(p => pageIds.Contains(p.AssetId) && p.IsLatest && p.IsActive && !p.MarkedForDeletion)
                .Select(p => new
                {
                    p.AssetId,
                    p.Remarks,
                    // Only a live binding to a live file gives the photo column an image (same rule as GetUploadedPhotosAsync).
                    DocumentId = p.DocumentBinding != null && p.DocumentBinding.IsActive && !p.DocumentBinding.MarkedForDeletion &&
                                 p.DocumentBinding.Document != null &&
                                 p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion
                        ? (int?)p.DocumentBinding.DocumentId
                        : null
                })
                .ToListAsync(cancellationToken);
            var photoRowsByAsset = photoRows.ToLookup(x => x.AssetId);

            var documentRows = await _assetDocumentRepository.GetQueryable()
                .AsNoTracking()
                .Where(d => pageIds.Contains(d.AssetId) && d.IsLatest && d.IsActive && !d.MarkedForDeletion)
                .Select(d => new
                {
                    d.AssetId,
                    DocumentCode = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentCode : null
                })
                .ToListAsync(cancellationToken);
            var documentRowsByAsset = documentRows.ToLookup(x => x.AssetId);

            var uploadedPhotosByAsset = (await GetUploadedPhotosAsync(pageIds, cancellationToken)).ToLookup(p => p.AssetId);
            var uploadedDocumentsByAsset = (await GetUploadedDocumentsAsync(pageIds, cancellationToken)).ToLookup(d => d.AssetId);

            foreach (var item in items)
            {
                if (locations.TryGetValue(item.Id, out var location))
                {
                    item.DepartmentId = location.DepartmentId;
                    item.DepartmentName = location.DepartmentName;
                    item.Address = location.Address;
                    item.CSN = location.CSN;
                    item.ZoneName = location.ZoneName;
                    item.WardName = location.WardName;
                }

                if (item.AssetConditionId.HasValue &&
                    conditionNames.TryGetValue(item.AssetConditionId.Value, out var conditionName))
                {
                    item.AssetCondition = conditionName;
                }

                if (subUnitCounts.TryGetValue(item.Id, out var subUnits))
                {
                    item.TotalSubUnits = subUnits.Total;
                    item.ActiveSubUnits = subUnits.Active;
                }

                var rows = floorRowsByOwner[item.Id].ToList();
                item.TotalFloors = rows.Select(x => x.FloorId).Distinct().Count();
                item.CapitalValue = rows.Sum(x => x.CapitalValue ?? 0m);
                item.CarpetAreaSqMeter = rows.Any(x => x.CarpetAreaSqMeter.HasValue) ? rows.Sum(x => x.CarpetAreaSqMeter ?? 0m) : null;
                item.BuiltUpAreaSqMeter = rows.Any(x => x.BuiltUpAreaSqMeter.HasValue) ? rows.Sum(x => x.BuiltUpAreaSqMeter ?? 0m) : null;
                item.ConstructionYear = rows
                    .Select(x => ParseConstructionYear(x.ConstructionYear))
                    .Where(y => y.HasValue && y.Value > 0)
                    .Min();
                item.ConstructionTypeName = rows
                    .Where(x => !string.IsNullOrWhiteSpace(x.ConstructionTypeName))
                    .GroupBy(x => x.ConstructionTypeName)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .Select(g => g.Key)
                    .FirstOrDefault();
                var topTypeOfUseId = rows
                    .Where(x => x.TypeOfUseId > 0)
                    .GroupBy(x => x.TypeOfUseId)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .Select(g => (int?)g.Key)
                    .FirstOrDefault();
                item.TypeOfUseName = topTypeOfUseId.HasValue && typeOfUseNames.TryGetValue(topTypeOfUseId.Value, out var typeOfUseName)
                    ? typeOfUseName
                    : null;

                var leases = leaseRowsByOwner[item.Id].ToList();
                item.ActiveLeaseCount = leases.Count;
                item.AnnualRevenue = leases.Sum(x => AnnualizeRent(x.RentAmount ?? 0m, x.PaymentFrequency));
                item.OutstandingAmount = outstandingByOwner.TryGetValue(item.Id, out var pending) ? pending : 0m;

                var photos = photoRowsByAsset[item.Id].ToList();
                item.PhotoCount = photos.Count;
                item.AssetDocumentId = photos
                    .FirstOrDefault(p => p.DocumentId.HasValue &&
                                         string.Equals(p.Remarks?.Trim(), "Asset Image", StringComparison.OrdinalIgnoreCase))
                    ?.DocumentId;

                var documentCodes = documentRowsByAsset[item.Id].Select(d => d.DocumentCode).ToList();
                item.DocumentCount = documentCodes.Count;
                item.HasPlanDocument = documentCodes.Any(c => string.Equals(c, PlanDocumentCode, StringComparison.OrdinalIgnoreCase));
                item.HasTitleDocument = documentCodes.Any(c => string.Equals(c, TitleDocumentCode, StringComparison.OrdinalIgnoreCase));
                item.HasSurveyDocument = documentCodes.Any(c => string.Equals(c, SurveyDocumentCode, StringComparison.OrdinalIgnoreCase));

                item.Photos = uploadedPhotosByAsset[item.Id].ToList();
                item.Documents = uploadedDocumentsByAsset[item.Id].ToList();
            }
        }

        /// <summary>
        /// Sub-units of the given main assets, by the rule ManageSubUnitsService's sub-unit listings
        /// use: non-deleted child assets that are not inventory items (inventory units are also child
        /// AssetMaster rows, linked through AMS.InventoryAssetDetail). Includes units still inactive
        /// because they were bulk-generated but not yet configured.
        /// </summary>
        private IQueryable<AssetMasterEntity> SubUnitsUnderParents(IQueryable<int> parentIds)
            => _repository.GetQueryable()
                .AsNoTracking()
                .Where(c => c.ParentAssetId.HasValue &&
                            parentIds.Contains(c.ParentAssetId.Value) &&
                            !c.MarkedForDeletion &&
                            !_inventoryAssetDetailRepository.GetQueryable().Any(iad => iad.AssetId == c.Id));

        /// <summary>
        /// Ids of the active sub-units of the given main assets. The roll-ups below take child rows only
        /// through <see cref="SubUnitsUnderParents"/>, so inventory units never count towards them.
        /// </summary>
        private IQueryable<int> ActiveSubUnitIdsUnderParents(IQueryable<int> parentIds)
            => SubUnitsUnderParents(parentIds).Where(c => c.IsActive).Select(c => c.Id);

        /// <summary>Active floor rows of the given main assets and of their active sub-units.</summary>
        private IQueryable<SubUnitsDetailsEntity> FloorRowsUnderParents(IQueryable<int> parentIds)
        {
            var activeSubUnitIds = ActiveSubUnitIdsUnderParents(parentIds);
            return _floorDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(fd => fd.IsActive && !fd.MarkedForDeletion &&
                             (parentIds.Contains(fd.AssetId) || activeSubUnitIds.Contains(fd.AssetId)));
        }

        /// <summary>
        /// Leases in force on <paramref name="today"/>: active, not deleted, started, and not yet ended.
        /// An IsActive row alone is not enough — expired and future leases keep IsActive = true.
        /// </summary>
        private IQueryable<AssetLeaseRentDetailsEntity> LeasesInForce(DateTime today)
            => _leaseRentDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(r => r.IsActive && !r.MarkedForDeletion &&
                            r.LeaseStartDate <= today &&
                            (r.LeaseEndDate == null || r.LeaseEndDate >= today));

        /// <summary>Leases in force on <paramref name="today"/> on the given main assets or their active sub-units.</summary>
        private IQueryable<AssetLeaseRentDetailsEntity> CurrentLeasesUnderParents(IQueryable<int> parentIds, DateTime today)
        {
            var activeSubUnitIds = ActiveSubUnitIdsUnderParents(parentIds);
            return LeasesInForce(today)
                .Where(r => parentIds.Contains(r.AssetId) || activeSubUnitIds.Contains(r.AssetId));
        }

        /// <summary>
        /// Uncancelled rent demand of the given main assets and their sub-units (inactive ones too — the
        /// money is still owed), keyed by main asset.
        /// </summary>
        private IQueryable<DemandOwnerRow> DemandRowsUnderParents(IQueryable<int> parentIds)
        {
            if (_demandRepository == null)
            {
                return Enumerable.Empty<DemandOwnerRow>().AsQueryable();
            }
            var subUnitIds = SubUnitsUnderParents(parentIds).Select(c => c.Id);
            return from d in _demandRepository.GetQueryable().AsNoTracking()
                   join a in _repository.GetQueryable().AsNoTracking() on d.AssetId equals a.Id
                   where d.IsActive && d.DemandStatus != "Cancelled" && !a.MarkedForDeletion &&
                         (parentIds.Contains(a.Id) || subUnitIds.Contains(a.Id))
                   select new DemandOwnerRow
                   {
                       OwnerId = a.ParentAssetId ?? a.Id,
                       PendingAmount = d.PendingAmount
                   };
        }

        /// <summary>
        /// Converts a per-period rent amount to a yearly figure. Persisted frequencies are One-time,
        /// Yearly, Quarterly and Monthly (CK_AssetLeaseRentDetails_PaymentFrequency); anything else is
        /// treated as Monthly, the column default.
        /// </summary>
        private static decimal AnnualizeRent(decimal rentAmount, string? paymentFrequency)
        {
            var paymentsPerYear = (paymentFrequency ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                // A one-time amount is received once, not once per month.
                "one-time" or "one time" or "onetime" => 1,
                "yearly" or "annual" or "annually" => 1,
                "half-yearly" or "half yearly" or "halfyearly" => 2,
                "quarterly" => 4,
                _ => 12
            };
            return rentAmount * paymentsPerYear;
        }

        #endregion
    }
}
