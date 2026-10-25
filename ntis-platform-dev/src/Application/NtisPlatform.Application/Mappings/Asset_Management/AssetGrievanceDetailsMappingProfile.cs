using AutoMapper;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Mappings.Asset_Management;

public class AssetGrievanceDetailsMappingProfile : Profile
{
    public AssetGrievanceDetailsMappingProfile()
    {
        CreateMap<AssetGrievanceDetailsEntity, AssetGrievanceDetailsDto>()
            .ForMember(dest => dest.GrievanceCategoryName, opt => opt.MapFrom(src => src.AssetGrievanceCategory != null ? src.AssetGrievanceCategory.GrievanceTypeName : null))
            .ForMember(dest => dest.AssetNo, opt => opt.Ignore())
            .ForMember(dest => dest.AssetName, opt => opt.Ignore())
            .ForMember(dest => dest.AssetImageGuid, opt => opt.Ignore())
            .ForMember(dest => dest.Documents, opt => opt.Ignore());

        CreateMap<AssetGrievanceDetailsEntity, AssetCitizenGrievanceDto>()
            .ForMember(dest => dest.GrievanceCategoryName, opt => opt.MapFrom(src => src.AssetGrievanceCategory != null ? src.AssetGrievanceCategory.GrievanceTypeName : null))
            .ForMember(dest => dest.AssetNo, opt => opt.Ignore())
            .ForMember(dest => dest.AssetName, opt => opt.Ignore())
            .ForMember(dest => dest.Documents, opt => opt.Ignore());

        // AssetGrievanceDetailsService maps its own already-enriched AssetGrievanceDetailsDto (with
        // Documents populated) down to AssetCitizenGrievanceDto for the citizen-portal responses.
        CreateMap<AssetGrievanceDetailsDto, AssetCitizenGrievanceDto>();

        // CurrentCycleNo and WorkflowStatus are server-controlled (workflow transitions only) â€” never a client input.
        CreateMap<CreateAssetGrievanceDetailsDto, AssetGrievanceDetailsEntity>()
            .ForMember(dest => dest.CurrentCycleNo, opt => opt.Ignore())
            .ForMember(dest => dest.WorkflowStatus, opt => opt.Ignore())
            .ForMember(dest => dest.AssetGrievanceCategory, opt => opt.Ignore());

        CreateMap<UpdateAssetGrievanceDetailsDto, AssetGrievanceDetailsEntity>()
            .ForMember(dest => dest.CurrentCycleNo, opt => opt.Ignore())
            .ForMember(dest => dest.WorkflowStatus, opt => opt.Ignore())
            .ForMember(dest => dest.AssetGrievanceCategory, opt => opt.Ignore());

        CreateMap<AssetGrievanceCorrectionDetailEntity, AssetGrievanceCorrectionDetailDto>();
        CreateMap<AssetGrievanceActionHistoryEntity, AssetGrievanceActionHistoryDto>();
    }
}