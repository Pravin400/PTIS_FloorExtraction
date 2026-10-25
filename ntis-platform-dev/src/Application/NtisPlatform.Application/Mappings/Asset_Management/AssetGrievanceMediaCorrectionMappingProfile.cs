using AutoMapper;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Mappings.Asset_Management;

public class AssetGrievanceMediaCorrectionMappingProfile : Profile
{
    public AssetGrievanceMediaCorrectionMappingProfile()
    {
        CreateMap<AssetGrievanceMediaCorrectionEntity, AssetGrievanceMediaCorrectionDto>();

        CreateMap<SubmitAssetGrievanceMediaCorrectionDto, AssetGrievanceMediaCorrectionEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceId, opt => opt.Ignore())
            .ForMember(dest => dest.IsApproved, opt => opt.Ignore())
            .ForMember(dest => dest.IsApplied, opt => opt.Ignore())
            .ForMember(dest => dest.AppliedDate, opt => opt.Ignore())
            .ForMember(dest => dest.Grievance, opt => opt.Ignore());
    }
}
