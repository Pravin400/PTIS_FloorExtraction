using AutoMapper;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;

namespace NtisPlatform.Application.Mappings.Asset_Management;

public class AssetLeaseRentDetailsMappingProfile : Profile
{
    public AssetLeaseRentDetailsMappingProfile()
    {
        CreateMap<AssetLeaseRentDetailsEntity, AssetLeaseRentDetailsDto>()
            .ForMember(dest => dest.Names, opt => opt.MapFrom(src => new AssetLeaseRentDetailsNamesDto
            {
                AssetNo = src.Asset != null ? src.Asset.AssetNo : null,
                AssetName = src.Asset != null ? src.Asset.AssetName : null,
                AssetCategoryName = src.Asset != null && src.Asset.AssetCategory != null ? src.Asset.AssetCategory.CategoryName : null,
                ApplicationTypeName = src.ApplicationType != null ? src.ApplicationType.ApplicationTypeName : null,
                FloorDescription = null
            }))
            // Flat mirror of the above — see AssetLeaseRentDetailsDto.AssetName/AssetCategoryName.
            .ForMember(dest => dest.AssetNo, opt => opt.MapFrom(src => src.Asset != null ? src.Asset.AssetNo : null))
            .ForMember(dest => dest.AssetName, opt => opt.MapFrom(src => src.Asset != null ? src.Asset.AssetName : null))
            .ForMember(dest => dest.AssetCategoryName, opt => opt.MapFrom(src => src.Asset != null && src.Asset.AssetCategory != null ? src.Asset.AssetCategory.CategoryName : null))
            // The rent column was renamed MonthlyRent -> RentAmount. The UI still reads the legacy
            // MonthlyRent field for display, so mirror RentAmount into it on the read side.
            .ForMember(dest => dest.MonthlyRent, opt => opt.MapFrom(src => src.RentAmount ?? 0m))
            // Destination-only fields with no source column on the entity: populated after the
            // fact by AssetLeaseRentDetailsService.EnrichAssetPhotoAndNameAsync (a real photo/
            // parent-asset lookup ProjectTo can't express as a plain projection). Explicitly
            // ignored so AutoMapper's unmapped-member validation documents this as intentional
            // rather than relying on it happening to not be flagged.
            .ForMember(dest => dest.AssetPhotoGuid, opt => opt.Ignore())
            .ForMember(dest => dest.ParentAssetName, opt => opt.Ignore());

        CreateMap<CreateAssetLeaseRentDetailsDto, AssetLeaseRentDetailsEntity>()
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            // The DB column was renamed MonthlyRent -> RentAmount. The UI still posts the rent value
            // in MonthlyRent, so persist RentAmount from whichever field carries a positive amount.
            .ForMember(dest => dest.RentAmount, opt => opt.MapFrom(src =>
                src.RentAmount.HasValue && src.RentAmount.Value > 0m ? src.RentAmount : (decimal?)src.MonthlyRent))
            // Real columns but not yet exposed on this create contract.
            .ForMember(dest => dest.IsIncrement, opt => opt.Ignore())
            .ForMember(dest => dest.AdvanceBalance, opt => opt.Ignore())
            // CreateBaseDtos.IsActive defaults to false (plain bool). A create request that omits
            // it would otherwise overwrite BaseEntity's IsActive = true default with false,
            // creating a lease that immediately fails every active-only operation (document
            // upload, GetById, workflow transitions). Preserve the entity default instead.
            .ForMember(dest => dest.IsActive, opt => opt.Ignore());

        CreateMap<UpdateAssetLeaseRentDetailsDto, AssetLeaseRentDetailsEntity>()
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.RentAmount, opt => opt.MapFrom(src =>
                src.RentAmount.HasValue && src.RentAmount.Value > 0m ? src.RentAmount : (decimal?)src.MonthlyRent))
            .ForMember(dest => dest.IsIncrement, opt => opt.Ignore())
            .ForMember(dest => dest.AdvanceBalance, opt => opt.Ignore())
            // UpdateAssetLeaseRentDetailsDto.IsActive is nullable: an omitted value keeps the
            // lease's current state rather than binding as false and silently deactivating it.
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom((src, dest) => src.IsActive ?? dest.IsActive))
            // Only the guarded workflow-transition endpoints (Verify/Approve/Reject/Revert*) may
            // change WorkflowStatus. UpdateAssetLeaseRentDetailsDto.WorkflowStatus defaults to
            // "Pending", so mapping it here would let a plain PUT silently reset or forge the
            // status without going through any state-machine check.
            .ForMember(dest => dest.WorkflowStatus, opt => opt.Ignore());
    }
}
