using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.DTOs.Asset_Management.SubUnitsDetails;
using NtisPlatform.Application.DTOs.Asset_Management.AssetRoomWiseSubmissionDetails;
using NtisPlatform.Application.DTOs.Asset_Management.AssetDetails;
using NtisPlatform.Application.DTOs.Asset_Management.InventoryAsset;
using NtisPlatform.Application.DTOs.Asset_Management.AssetFieldValue;
using NtisPlatform.Application.DTOs.Asset_Management.AssetDocument;
using NtisPlatform.Application.DTOs.Asset_Management.ManageSubUnits;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Services.Asset_Management
{
    public partial class AssetMasterService
    {
        #region Endpoint: Get Sub-Assets By Parent ID

        /// <summary>
        /// Gets all child assets by parent asset ID and floor details ID.
        /// </summary>
        public async Task<List<AssetMasterDto>> GetByParentAssetIdAsync(int parentAssetId, int floorDetailsId, CancellationToken cancellationToken = default)
        {
            var childAssets = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => a.IsActive &&
                a.ParentAssetId == parentAssetId
                            && !a.MarkedForDeletion)
                .Select(a => new AssetMasterDto
                {
                    Id = a.Id,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetNo = a.AssetNo,
                    AssetName = a.AssetName,
                    AssetCategoryId = a.AssetCategoryId,
                    AssetTypeId = a.AssetTypeId,
                    ParentAssetId = a.ParentAssetId,
                    HierarchyLevel = a.HierarchyLevel,
                    HierarchyPath = a.HierarchyPath,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    Details = new AssetDetailsDto
                    {
                        Id = a.Details != null ? a.Details.Id : 0,
                        PropertyNo = a.Details != null ? a.Details.PropertyNo : null,
                        PartitionNo = a.Details != null ? a.Details.PartitionNo : null,
                        MpmsNo = a.Details != null ? a.Details.MpmsNo : null,
                        PlotNo = a.Details != null ? a.Details.PlotNo : null,
                        UpicId = a.Details != null ? a.Details.UpicId : null,
                        InChargeName = a.Details != null ? a.Details.InChargeName : null,
                        InChargeDesignationId = a.Details != null ? a.Details.InChargeDesignationId : null,
                        InChargeMobile = a.Details != null ? a.Details.InChargeMobile : null,
                        InChargeEmail = a.Details != null ? a.Details.InChargeEmail : null
                    },
                    Names = new AssetMasterNamesDto
                    {
                        AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                        AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                        AssetWardNo = a.AssetType != null ? a.AssetType.AssetWardNo : null,
                        ParentAssetName = a.ParentAsset != null ? a.ParentAsset.AssetName : null
                    },
                    FieldValues = a.FieldValues!
                        .Where(fv => fv.IsActive == a.IsActive && !fv.MarkedForDeletion)
                        .Select(fv => new AssetFieldValueDto
                        {
                            Id = fv.Id,
                            FieldDefinitionId = fv.FieldDefinitionId,
                            FieldName = fv.FieldName,
                            FieldValue = fv.FieldValue
                        })
                        .ToList()
                })
                .ToListAsync(cancellationToken);

            await EnrichLocationAsync(childAssets, cancellationToken);
            return childAssets;
        }

        #endregion

        #region Sub-Asset and Floor Details Query Methods

        public async Task<AssetFloorAndOtherDetailsResponseDto?> GetAssetFloorAndOtherDetailsAsync(int parentAssetId, CancellationToken cancellationToken = default)
        {
            var parentAsset = await _repository.GetQueryable()
                .AsNoTracking()
                .Include(a => a.AssetCategory)
                .Include(a => a.AssetType)
                .FirstOrDefaultAsync(a => a.Id == parentAssetId, cancellationToken);

            if (parentAsset == null)
            {
                return null;
            }

            var childAssets = await _repository.GetQueryable()
            .AsNoTracking()
            .Where(a =>
                a.ParentAssetId == parentAssetId &&
                a.IsActive &&
                !a.MarkedForDeletion &&
                _floorDetailsRepository.GetQueryable()
                    .Any(fd =>
                        fd.AssetId == a.Id &&
                        fd.IsActive &&
                        !fd.MarkedForDeletion))
            .Include(a => a.AssetCategory)
            .Include(a => a.AssetType)
            .OrderBy(a => a.Id)
            .ToListAsync(cancellationToken);

            var childAssetIds = childAssets.Select(a => a.Id).ToList();

            // Load AMS TypeOfUse / SubTypeOfUse lookup dictionaries in one query each.
            var typeOfUseLookup = await _amsTypeOfUseRepository.GetQueryable()
                .AsNoTracking()
                .Where(t => t.IsActive)
                .ToDictionaryAsync(t => t.Id, t => t.Description, cancellationToken);

            var subTypeOfUseLookup = await _amsSubTypeOfUseRepository.GetQueryable()
                .AsNoTracking()
                .Where(t => t.IsActive)
                .ToDictionaryAsync(t => t.Id, t => t.Description, cancellationToken);

            var childFloorDetails = await _floorDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(f => childAssetIds.Contains(f.AssetId) && f.IsActive && !f.MarkedForDeletion)
                .Include(f => f.Asset)
                    .ThenInclude(a => a!.AssetCategory)
                .Include(f => f.Asset)
                    .ThenInclude(a => a!.AssetType)
                .Include(f => f.Floor)
                .Include(f => f.SubFloor)
                .Include(f => f.ConstructionType)
                .OrderBy(f => f.AssetId)
                .ThenBy(f => f.FloorId)
                .ThenBy(f => f.SubFloorId)
                .ToListAsync(cancellationToken);

            static decimal? SumOrNull(IEnumerable<decimal?> values)
            {
                decimal sum = 0m;
                var any = false;
                foreach (var v in values)
                {
                    if (v.HasValue)
                    {
                        sum += v.Value;
                        any = true;
                    }
                }
                return any ? sum : null;
            }

            var floorDetailDtos = childFloorDetails
                .GroupBy(f => f.FloorId)
                .OrderBy(g => g.First().Floor != null ? g.First().Floor!.SequenceNo ?? int.MaxValue : int.MaxValue)
                .ThenBy(g => g.Key)
                .Select(g =>
                {
                    var first = g.First();
                    return new AssetFloorDetailResponseDto
                    {
                        FloorName = first.Floor != null ? first.Floor.Description : null,
                        ConstructionTypeName = first.ConstructionType != null ? first.ConstructionType.Description : null,
                        TypeOfUseName = first.TypeOfUseId > 0 && typeOfUseLookup.TryGetValue(first.TypeOfUseId, out var tou) ? tou : null,
                        ConstructionYear = first.ConstructionYear,
                        CarpetAreaSqMeter = SumOrNull(g.Select(x => x.CarpetAreaSqMeter)),
                        CarpetAreaSqFeet = SumOrNull(g.Select(x => x.CarpetAreaSqFeet)),
                        BuiltUpAreaSqMeter = SumOrNull(g.Select(x => x.BuiltUpAreaSqMeter)),
                        BuiltUpAreaSqFeet = SumOrNull(g.Select(x => x.BuiltUpAreaSqFeet)),
                        CapitalValue = SumOrNull(g.Select(x => x.CapitalValue)),
                    };
                })
                .ToList();

            var floorSummary = new AssetFloorSummaryResponseDto
            {
                FloorDetails = floorDetailDtos,
                TotalBaseValue = 0m,
                TotalCapitalValue = floorDetailDtos.Sum(x => x.CapitalValue ?? 0m),
                TotalMarketValue = 0m,
                TotalFloors = floorDetailDtos.Count
            };

            var childAssetDtos = childAssets
                .GroupJoin(
                    childFloorDetails,
                    asset => asset.Id,
                    floor => floor.AssetId,
                    (asset, floors) => new { asset, floors })
                .Select(group =>
                {
                    var firstFloor = group.floors.FirstOrDefault();
                    return new AssetChildAssetResponseDto
                    {
                        AssetId = group.asset.Id,
                        SubUnitsDetailsId = firstFloor != null ? firstFloor.Id : 0,
                        AssetNo = group.asset.AssetNo ?? string.Empty,
                        AssetName = group.asset.AssetName ?? string.Empty,
                        Category = group.asset.AssetCategory?.CategoryName,
                        Type = group.asset.AssetType?.TypeName,
                        OccupancyStatus = group.asset.OccupancyStatus,
                        TypeOfUse = group.floors
                            .Select(f => f.TypeOfUseId > 0 && typeOfUseLookup.TryGetValue(f.TypeOfUseId, out var n) ? n : null)
                            .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)),
                        SubTypeOfUse = group.floors
                            .Select(f => f.SubTypeOfUseId.HasValue && subTypeOfUseLookup.TryGetValue(f.SubTypeOfUseId.Value, out var sn) ? sn : null)
                            .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)),
                        CarpetAreaSqMeter = group.floors.Sum(f => f.CarpetAreaSqMeter ?? 0m),
                        CarpetAreaSqFeet = group.floors.Sum(f => f.CarpetAreaSqFeet ?? 0m),
                        BuiltUpAreaSqMeter = group.floors.Sum(f => f.BuiltUpAreaSqMeter ?? 0m),
                        BuiltUpAreaSqFeet = group.floors.Sum(f => f.BuiltUpAreaSqFeet ?? 0m),
                        FloorName = group.floors.Select(f => f.Floor != null ? f.Floor.Description : null).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)),
                        FloorDetails = group.floors.Select(f => new AssetChildFloorDetailResponseDto
                        {
                            FloorName = f.Floor != null ? f.Floor.Description : null,
                            ConstructionTypeName = f.ConstructionType != null ? f.ConstructionType.Description : null,
                            TypeOfUseName = f.TypeOfUseId > 0 && typeOfUseLookup.TryGetValue(f.TypeOfUseId, out var tu) ? tu : null,
                            SubTypeOfUseName = f.SubTypeOfUseId.HasValue && subTypeOfUseLookup.TryGetValue(f.SubTypeOfUseId.Value, out var stu) ? stu : null,
                            ConstructionYear = f.ConstructionYear,
                            CarpetAreaSqMeter = f.CarpetAreaSqMeter,
                            CarpetAreaSqFeet = f.CarpetAreaSqFeet,
                            BuiltUpAreaSqMeter = f.BuiltUpAreaSqMeter,
                            BuiltUpAreaSqFeet = f.BuiltUpAreaSqFeet,
                            CapitalValue = f.CapitalValue,
                        }).ToList()
                    };
                })
                .ToList();

            var inventoryData = await BuildInventoryDataAsync(parentAssetId, cancellationToken);

            return new AssetFloorAndOtherDetailsResponseDto
            {
                FloorSummary = floorSummary,
                ChildAssets = childAssetDtos,
                InventoryData = MapInventoryData(inventoryData)
            };
        }

        private static AssetInventoryDataResponseDto? MapInventoryData(InventoryBatchListResponseDto? inventoryData)
        {
            if (inventoryData == null) return null;

            return new AssetInventoryDataResponseDto
            {
                ParentAssetId = inventoryData.ParentAssetId,
                ParentAssetName = inventoryData.ParentAssetName,
                TotalBatches = inventoryData.TotalBatches,
                TotalUnits = inventoryData.TotalUnits,
                TotalPurchaseValue = inventoryData.TotalPurchaseValue,
                TotalCapitalValue = inventoryData.TotalCapitalValue,
                Batches = inventoryData.Batches.Select(batch => new AssetInventoryBatchResponseDto
                {
                    BatchId = batch.BatchId,
                    InventoryType = batch.Names.InventoryType,
                    ItemName = batch.Names.ItemName,
                    ModelBrand = batch.Names.ModelBrand,
                    Specifications = batch.Specifications,
                    PurchaseDate = batch.PurchaseDate,
                    OwningDepartment = batch.Names.OwningDepartment,
                    Condition = batch.Names.Condition,
                    Quantity = batch.Quantity,
                    UnitValue = batch.UnitValue,
                    TotalBatchValue = batch.TotalBatchValue,
                    TotalBatchCV = batch.TotalBatchCV,
                    PhotoFileName = batch.PhotoFileName,
                    InvoiceFileName = batch.InvoiceFileName,
                    Units = batch.Units.Select(unit => new AssetInventoryUnitResponseDto
                    {
                        AssetId = unit.AssetId,
                        UnitNumber = unit.UnitNumber,
                        Condition = unit.Condition,
                        UnitPurchaseValue = unit.UnitPurchaseValue,
                        UnitCapitalValue = unit.UnitCapitalValue
                    }).ToList(),
                    Documents = batch.Documents
                        .Where(doc => string.Equals(doc.Remarks, "Inventory Image", StringComparison.OrdinalIgnoreCase) ||
                                      string.Equals(doc.Remarks, "Inventory Invoice", StringComparison.OrdinalIgnoreCase))
                        .ToList()
                }).ToList()
            };
        }

        #endregion

        #region Sub-Asset Grouping Query Methods

        public async Task<SubAssetGroupedResponseDto> GetSubAssetsGroupedByParentAsync(int parentAssetId, CancellationToken cancellationToken = default)
        {
            if (parentAssetId <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(parentAssetId), "Parent asset ID must be greater than zero.");
            }

            // Get parent asset with all fields matching GetByIdAsync
            var parentAsset = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => a.Id == parentAssetId && a.IsActive && !a.MarkedForDeletion)
                .Select(a => new ParentAssetDetailDto
                {
                    Id = a.Id,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetNo = a.AssetNo ?? string.Empty,
                    AssetName = a.AssetName ?? string.Empty,
                    AssetCategoryId = (int?)a.AssetCategoryId,
                    AssetTypeId = (int?)a.AssetTypeId,
                    ParentAssetId = a.ParentAssetId,
                    HierarchyLevel = (int?)a.HierarchyLevel,
                    HierarchyPath = a.HierarchyPath,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    EncroachmentStatus = a.EncroachmentStatus,
                    Details = new AssetDetailsDto
                    {
                        Id = a.Details != null ? a.Details.Id : 0,
                        PropertyNo = a.Details != null ? a.Details.PropertyNo : null,
                        PartitionNo = a.Details != null ? a.Details.PartitionNo : null,
                        MpmsNo = a.Details != null ? a.Details.MpmsNo : null,
                        PlotNo = a.Details != null ? a.Details.PlotNo : null,
                        UpicId = a.Details != null ? a.Details.UpicId : null
                    },
                    Names = new AssetMasterNamesDto
                    {
                        AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                        AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                        AssetWardNo = a.AssetType != null ? a.AssetType.AssetWardNo : null,
                        ParentAssetName = a.ParentAsset != null ? a.ParentAsset.AssetName : null
                    },
                    FieldValues = a.FieldValues != null
                        ? a.FieldValues
                            .Where(fv => fv.IsActive == a.IsActive && !fv.MarkedForDeletion)
                            .Select(fv => new AssetFieldValueDto
                            {
                                Id = fv.Id,
                                FieldDefinitionId = fv.FieldDefinitionId,
                                FieldName = fv.FieldName ?? string.Empty,
                                FieldValue = fv.FieldValue
                            })
                            .ToList()
                        : new List<AssetFieldValueDto>()
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (parentAsset == null)
            {
                return new SubAssetGroupedResponseDto
                {
                    ParentAsset = null,
                    TotalSubAssets = 0,
                    SubAssets = []
                };
            }

            // Resolve Zone/Ward/Mouja names for the parent asset.
            var parentLocations = await GetLocationInfoByAssetIdsAsync(new[] { parentAsset.Id }, cancellationToken);
            if (parentLocations.TryGetValue(parentAsset.Id, out var parentLocation))
            {
                parentAsset.DepartmentId = parentLocation.DepartmentId;
                ApplyLocation(parentAsset.Details, parentAsset.Names, parentLocation);
            }

            var allocatedAssetIds = await GetAllocatedAssetIdsAsync(parentAssetId, cancellationToken);

            // Get all sub-assets (assets where ParentAssetId = parentAssetId) with all fields from GetByIdAsync
            var subAssets = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => a.ParentAssetId == parentAssetId
                && a.IsActive
                && !a.MarkedForDeletion
                && !allocatedAssetIds.Contains(a.Id))
                .Select(a => new SubAssetDetailDto
                {
                    Id = a.Id,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetNo = a.AssetNo ?? string.Empty,
                    AssetName = a.AssetName ?? string.Empty,
                    AssetCategoryId = (int?)a.AssetCategoryId,
                    AssetTypeId = (int?)a.AssetTypeId,
                    ParentAssetId = a.ParentAssetId,
                    HierarchyLevel = (int?)a.HierarchyLevel,
                    HierarchyPath = a.HierarchyPath,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    EncroachmentStatus = a.EncroachmentStatus,
                    Details = new AssetDetailsDto
                    {
                        Id = a.Details != null ? a.Details.Id : 0,
                        PropertyNo = a.Details != null ? a.Details.PropertyNo : null,
                        PartitionNo = a.Details != null ? a.Details.PartitionNo : null,
                        MpmsNo = a.Details != null ? a.Details.MpmsNo : null,
                        PlotNo = a.Details != null ? a.Details.PlotNo : null,
                        UpicId = a.Details != null ? a.Details.UpicId : null
                    },
                    Names = new AssetMasterNamesDto
                    {
                        AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                        AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                        AssetWardNo = a.AssetType != null ? a.AssetType.AssetWardNo : null,
                        ParentAssetName = a.ParentAsset != null ? a.ParentAsset.AssetName : null
                    },
                    FieldValues = a.FieldValues != null
                        ? a.FieldValues
                            .Where(fv => fv.IsActive == a.IsActive && !fv.MarkedForDeletion)
                            .Select(fv => new AssetFieldValueDto
                            {
                                Id = fv.Id,
                                FieldDefinitionId = fv.FieldDefinitionId,
                                FieldName = fv.FieldName ?? string.Empty,
                                FieldValue = fv.FieldValue
                            })
                            .ToList()
                        : new List<AssetFieldValueDto>()
                })
                .ToListAsync(cancellationToken);

            var subAssetIds = subAssets.Select(a => a.Id).ToList();

            var subLocations = await GetLocationInfoByAssetIdsAsync(subAssetIds, cancellationToken);
            foreach (var subAsset in subAssets)
            {
                if (subLocations.TryGetValue(subAsset.Id, out var subLoc))
                {
                    subAsset.DepartmentId = subLoc.DepartmentId;
                    ApplyLocation(subAsset.Details, subAsset.Names, subLoc);
                }
            }

            var floorDetails = await _floorDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(f => subAssetIds.Contains(f.AssetId) && f.IsActive && !f.MarkedForDeletion)
                .Select(f => new SubUnitsDetailsDto
                {
                    Id = f.Id,
                    FloorId = f.FloorId,
                    AssetId = f.AssetId,
                    IsActive = f.IsActive,
                    Names = new SubUnitsDetailsNamesDto
                    {
                        FloorName = f.Floor != null ? f.Floor.Description : null,
                        TypeOfUseName = f.TypeOfUse != null ? f.TypeOfUse.Description : null,
                        SubTypeOfUseName = f.SubTypeOfUse != null ? f.SubTypeOfUse.Description : null
                    }
                })
                .ToListAsync(cancellationToken);

            var roomWiseSubmissions = await _roomWiseSubmissionRepository.GetQueryable()
                .AsNoTracking()
                .Where(r => r.AssetId.HasValue && subAssetIds.Contains(r.AssetId.Value) && r.IsActive && !r.MarkedForDeletion)
                .Select(r => new AssetRoomWiseSubmissionDetailsDto
                {
                    Id = r.Id,
                    IsActive = r.IsActive,
                    CreatedDate = r.CreatedDate,
                    UpdatedDate = r.UpdatedDate,
                    ParentAssetId = r.Asset != null ? r.Asset.ParentAssetId : null,
                    AssetId = r.AssetId,
                    FloorDetailsId = r.SubUnitsDetailsId,
                    LengthMtr = r.LengthMtr,
                    WidthMtr = r.WidthMtr,
                    HeightMtr = r.HeightMtr,
                    AreaSqMtr = r.LengthMtr * r.WidthMtr,
                    TotalAreaSqMtr = r.LengthMtr * r.WidthMtr,
                    Shape = r.Shape,
                    RoomNo = r.RoomNo,
                    RoomType = r.RoomType,
                    OuterYesNo = r.OuterYesNo,
                    MinusYesNo = r.MinusYesNo,
                    MarkedForDeletion = r.MarkedForDeletion,
                    MarkedForDeletionDate = r.MarkedForDeletionDate,
                    ParentAssetName = r.Asset != null && r.Asset.ParentAsset != null ? r.Asset.ParentAsset.AssetName : null,
                    AssetName = r.Asset != null ? r.Asset.AssetName : null
                })
                .ToListAsync(cancellationToken);

            var renterDetails = await GetRenterDetailsAsync(subAssetIds, cancellationToken);

            var floorDetailsGrouped = floorDetails
                .GroupBy(f => f.AssetId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var roomWiseGrouped = roomWiseSubmissions
                .Where(r => r.AssetId.HasValue)
                .GroupBy(r => r.AssetId!.Value)
                .ToDictionary(g => g.Key, g => g.ToList());

            var renterGrouped = renterDetails
                .GroupBy(r => r.AssetId)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var subAsset in subAssets)
            {
                subAsset.RoomWiseSubmissions = roomWiseGrouped.TryGetValue(subAsset.Id, out var rooms) ? rooms : [];
                subAsset.RenterDetails = renterGrouped.TryGetValue(subAsset.Id, out var renters) ? renters : [];

                if (floorDetailsGrouped.TryGetValue(subAsset.Id, out var floors))
                {
                    // Hash the (small) per-asset room-submission floor ids once instead of running a
                    // linear Any() scan over them for every floor in the asset's floor list.
                    var roomFloorDetailsIds = subAsset.RoomWiseSubmissions
                        .Where(r => r.FloorDetailsId.HasValue)
                        .Select(r => r.FloorDetailsId!.Value)
                        .ToHashSet();
                    subAsset.FloorDetails = floors.Where(f => roomFloorDetailsIds.Contains(f.Id)).ToList();
                }
                else
                {
                    subAsset.FloorDetails = [];
                }

                var resolvedFloorDetail = subAsset.FloorDetails.FirstOrDefault();
                if (resolvedFloorDetail != null)
                {
                    subAsset.TypeOfUseName = resolvedFloorDetail.Names?.TypeOfUseName;
                    subAsset.SubTypeOfUseName = resolvedFloorDetail.Names?.SubTypeOfUseName;
                }
                else
                {
                    subAsset.TypeOfUseName = null;
                    subAsset.SubTypeOfUseName = null;
                }

                subAsset.FieldValues ??= [];
            }

            _logger.LogInformation(
                "Retrieved {SubAssetCount} sub-assets for parent asset {ParentAssetId} with {FloorCount} floor details, {RoomCount} room-wise submissions, and {RenterCount} renter details.",
                subAssets.Count,
                parentAssetId,
                floorDetails.Count,
                roomWiseSubmissions.Count,
                renterDetails.Count);

            return new SubAssetGroupedResponseDto
            {
                ParentAsset = parentAsset,
                TotalSubAssets = subAssets.Count,
                SubAssets = subAssets
            };
        }

        #endregion

        #region Sub-Unit Details With Files

        public async Task<ParentSubUnitDetailsResponseDto?> GetSubUnitDetailsByParentAsync(int parentAssetId, SubUnitDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default)
        {
            var response = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => a.Id == parentAssetId && !a.MarkedForDeletion)
                .Select(a => new ParentSubUnitDetailsResponseDto
                {
                    ParentAssetId = a.Id,
                    ParentAssetNo = a.AssetNo,
                    ParentAssetName = a.AssetName,
                    ParentIsActive = a.IsActive
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (response == null)
            {
                return null;
            }

            var subUnitQuery = SubUnitsUnderParents(
                _repository.GetQueryable().Where(a => a.Id == parentAssetId).Select(a => a.Id));
            if (queryParameters.ActiveOnly)
            {
                subUnitQuery = subUnitQuery.Where(c => c.IsActive);
            }

            response.TotalSubUnits = await subUnitQuery.CountAsync(cancellationToken);
            response.TotalCount = response.TotalSubUnits;

            var searchTerm = queryParameters.SearchTerm?.Trim().ToLower();
            if (!string.IsNullOrEmpty(searchTerm))
            {
                // Same case-insensitive "contains" the shared search builder uses, plus the tenant of
                // the unit's lease in force today (the sub-unit panel searches shop name, ID and tenant).
                var tenantMatchAssetIds = LeasesInForce(DateTime.Today)
                    .Where(r => r.TenantName != null && r.TenantName.ToLower().Contains(searchTerm))
                    .Select(r => r.AssetId);

                subUnitQuery = subUnitQuery.Where(c =>
                    (c.AssetNo != null && c.AssetNo.ToLower().Contains(searchTerm)) ||
                    (c.AssetName != null && c.AssetName.ToLower().Contains(searchTerm)) ||
                    (c.AssetRegionalName != null && c.AssetRegionalName.ToLower().Contains(searchTerm)) ||
                    tenantMatchAssetIds.Contains(c.Id));

                response.TotalCount = await subUnitQuery.CountAsync(cancellationToken);
            }

            var pageQuery = SortSubUnits(subUnitQuery, queryParameters);
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
                pageSize = response.TotalCount > 0 ? response.TotalCount : 1;
                pageNumber = 1;
            }
            response.PageNumber = pageNumber;
            response.PageSize = pageSize;

            var subUnits = await pageQuery
                .Select(c => new SubUnitWithFilesDto
                {
                    AssetId = c.Id,
                    AssetNo = c.AssetNo,
                    AssetName = c.AssetName,
                    AssetRegionalName = c.AssetRegionalName,
                    AssetCategoryId = c.AssetCategoryId,
                    AssetCategoryName = c.AssetCategory != null ? c.AssetCategory.CategoryName : null,
                    AssetTypeId = c.AssetTypeId,
                    AssetTypeName = c.AssetType != null ? c.AssetType.TypeName : null,
                    OccupancyStatus = c.OccupancyStatus,
                    IsActive = c.IsActive,
                    CreatedDate = c.CreatedDate
                })
                .ToListAsync(cancellationToken);

            response.Items = subUnits;
            if (subUnits.Count == 0)
            {
                return response;
            }

            var subUnitIds = subUnits.Select(s => s.AssetId).ToList();

            var floorDetails = await _floorDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(f => subUnitIds.Contains(f.AssetId) && f.IsActive && !f.MarkedForDeletion)
                .OrderBy(f => f.Floor != null ? f.Floor.SequenceNo : null)
                .ThenBy(f => f.SubFloorId)
                .ThenBy(f => f.Id)
                .Select(f => new SubUnitFloorDetailDto
                {
                    Id = f.Id,
                    AssetId = f.AssetId,
                    FloorId = f.FloorId,
                    SubFloorId = f.SubFloorId,
                    ConstructionYear = f.ConstructionYear,
                    AssessmentYear = f.AssessmentYear,
                    ConstructionTypeId = f.ConstructionTypeId,
                    TypeOfUseId = f.TypeOfUseId,
                    SubTypeOfUseId = f.SubTypeOfUseId,
                    CarpetAreaSqMeter = f.CarpetAreaSqMeter,
                    CarpetAreaSqFeet = f.CarpetAreaSqFeet,
                    BuiltupAreaSqMeter = f.BuiltUpAreaSqMeter,
                    BuiltupAreaSqFeet = f.BuiltUpAreaSqFeet,
                    NoOfRooms = f.NoOfRooms,
                    BaseValue = f.BaseValue,
                    CapitalValue = f.CapitalValue,
                    CVAgeFactor = f.CVAgeFactor,
                    CVFloorFactor = f.CVFloorFactor,
                    CVNatureFactor = f.CVNatureFactor,
                    CVUseFactor = f.CVUseFactor,
                    CVBaseRate = f.CVBaseRate,
                    IsRented = f.IsRented,
                    IsActive = f.IsActive,
                    FloorName = f.Floor != null ? f.Floor.Description : null,
                    SubFloorName = f.SubFloor != null ? f.SubFloor.Description : null,
                    ConstructionTypeName = f.ConstructionType != null ? f.ConstructionType.Description : null
                })
                .ToListAsync(cancellationToken);

            // TypeOfUseId/SubTypeOfUseId point at the AMS masters (see SubUnitsDetailsEntity), not
            // the CORE tables its navigation properties are typed to.
            var typeOfUseIds = floorDetails.Select(f => f.TypeOfUseId).Distinct().ToList();
            var typeOfUseNames = await _amsTypeOfUseRepository.GetQueryable()
                .AsNoTracking()
                .Where(t => typeOfUseIds.Contains(t.Id) && !t.MarkedForDeletion)
                .ToDictionaryAsync(t => t.Id, t => t.Description, cancellationToken);

            var subTypeOfUseIds = floorDetails.Where(f => f.SubTypeOfUseId.HasValue)
                .Select(f => f.SubTypeOfUseId!.Value).Distinct().ToList();
            var subTypeOfUseNames = subTypeOfUseIds.Count == 0
                ? new Dictionary<int, string>()
                : await _amsSubTypeOfUseRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(t => subTypeOfUseIds.Contains(t.Id) && !t.MarkedForDeletion)
                    .ToDictionaryAsync(t => t.Id, t => t.Description, cancellationToken);

            foreach (var floor in floorDetails)
            {
                floor.TypeOfUseName = typeOfUseNames.TryGetValue(floor.TypeOfUseId, out var typeOfUseName) ? typeOfUseName : null;
                floor.SubTypeOfUseName = floor.SubTypeOfUseId.HasValue &&
                                         subTypeOfUseNames.TryGetValue(floor.SubTypeOfUseId.Value, out var subTypeOfUseName)
                    ? subTypeOfUseName
                    : null;
            }

            var photos = await GetUploadedPhotosAsync(subUnitIds, cancellationToken);
            var documents = await GetUploadedDocumentsAsync(subUnitIds, cancellationToken);

            var floorsBySubUnit = floorDetails.ToLookup(f => f.AssetId);
            var photosBySubUnit = photos.ToLookup(p => p.AssetId);
            var documentsBySubUnit = documents.ToLookup(d => d.AssetId);
            foreach (var subUnit in subUnits)
            {
                subUnit.FloorDetails = floorsBySubUnit[subUnit.AssetId].ToList();
                subUnit.Photos = photosBySubUnit[subUnit.AssetId].ToList();
                subUnit.Documents = documentsBySubUnit[subUnit.AssetId].ToList();
            }

            return response;
        }

        private static readonly string[] SortableSubUnitFields = { "AssetNo", "AssetName", "CreatedDate" };

        /// <summary>
        /// Orders sub-units by AssetNo (default), AssetName or CreatedDate, with Id as a tie-breaker so
        /// pages never overlap. Any other SortBy is rejected the same way ApplySort rejects it.
        /// </summary>
        private static IQueryable<AssetMasterEntity> SortSubUnits(IQueryable<AssetMasterEntity> query, SubUnitDetailsQueryParameters queryParameters)
        {
            var sortBy = string.IsNullOrWhiteSpace(queryParameters.SortBy) ? "AssetNo" : queryParameters.SortBy.Trim();
            var descending = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            IOrderedQueryable<AssetMasterEntity> ordered = sortBy.ToLowerInvariant() switch
            {
                "assetno" => descending ? query.OrderByDescending(c => c.AssetNo) : query.OrderBy(c => c.AssetNo),
                "assetname" => descending ? query.OrderByDescending(c => c.AssetName) : query.OrderBy(c => c.AssetName),
                "createddate" => descending ? query.OrderByDescending(c => c.CreatedDate) : query.OrderBy(c => c.CreatedDate),
                _ => throw new FilterValidationException("SortBy",
                    $"Field '{queryParameters.SortBy}' is not sortable. Allowed fields: {string.Join(", ", SortableSubUnitFields)}")
            };

            return descending ? ordered.ThenByDescending(c => c.Id) : ordered.ThenBy(c => c.Id);
        }

        #endregion

        #region Uploaded File Helpers

        /// <summary>
        /// Latest photos of the given assets whose binding and uploaded file are both still live, so
        /// every entry carries a DocumentGuid. Enabled photo types with no file yet are left out.
        /// </summary>
        private Task<List<AssetPhotoFileDto>> GetUploadedPhotosAsync(IReadOnlyCollection<int> assetIds, CancellationToken cancellationToken)
            => _assetPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(p => assetIds.Contains(p.AssetId) && p.IsLatest && p.IsActive && !p.MarkedForDeletion &&
                            p.DocumentBinding != null && p.DocumentBinding.IsActive && !p.DocumentBinding.MarkedForDeletion &&
                            p.DocumentBinding.Document != null &&
                            p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion)
                .OrderBy(p => p.DisplayOrder)
                .ThenBy(p => p.PhotoTypeId)
                .ThenBy(p => p.Id)
                .Select(p => new AssetPhotoFileDto
                {
                    PhotoId = p.Id,
                    AssetId = p.AssetId,
                    SubUnitsDetailsId = p.SubUnitsDetailsId,
                    PhotoTypeId = p.PhotoTypeId,
                    PhotoTypeCode = p.PhotoType != null ? p.PhotoType.PhotoTypeCode : string.Empty,
                    PhotoTypeName = p.PhotoType != null ? p.PhotoType.PhotoTypeName : string.Empty,
                    DisplayOrder = p.DisplayOrder,
                    Remarks = p.Remarks,
                    DocumentBindingId = p.DocumentBindingId,
                    DocumentGuid = p.DocumentBinding!.Document!.DocumentGuid,
                    FileName = p.DocumentBinding.Document.OriginalFileName,
                    MimeType = p.DocumentBinding.Document.MimeType
                })
                .ToListAsync(cancellationToken);

        /// <summary>
        /// Latest documents of the given assets whose binding and uploaded file are both still live, so
        /// every entry carries a DocumentGuid. Enabled document types with no file yet are left out.
        /// </summary>
        private Task<List<AssetDocumentDto>> GetUploadedDocumentsAsync(IReadOnlyCollection<int> assetIds, CancellationToken cancellationToken)
            => _assetDocumentRepository.GetQueryable()
                .AsNoTracking()
                .Where(d => assetIds.Contains(d.AssetId) && d.IsLatest && d.IsActive && !d.MarkedForDeletion &&
                            d.DocumentBinding != null && d.DocumentBinding.IsActive && !d.DocumentBinding.MarkedForDeletion &&
                            d.DocumentBinding.Document != null &&
                            d.DocumentBinding.Document.IsActive && !d.DocumentBinding.Document.MarkedForDeletion)
                .OrderBy(d => d.DisplayOrder)
                .ThenBy(d => d.DocumentDefinitionId)
                .ThenBy(d => d.Id)
                .Select(d => new AssetDocumentDto
                {
                    DocumentId = d.Id,
                    AssetId = d.AssetId,
                    DocumentDefinitionId = d.DocumentDefinitionId,
                    DocumentCode = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentCode : string.Empty,
                    DocumentName = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentName : string.Empty,
                    DisplayOrder = d.DisplayOrder,
                    Remarks = d.Remarks,
                    DocumentBindingId = d.DocumentBindingId,
                    DocumentGuid = d.DocumentBinding!.Document!.DocumentGuid,
                    FileName = d.DocumentBinding.Document.OriginalFileName,
                    MimeType = d.DocumentBinding.Document.MimeType
                })
                .ToListAsync(cancellationToken);

        #endregion
    }
}
