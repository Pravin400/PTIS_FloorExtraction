using AutoMapper;
using NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;
using NtisPlatform.Core.Entities.FireAudit;

namespace NtisPlatform.Application.Mappings.FireAudit;

public class JurisdictionOverlayMasterMappingProfile : Profile
{
    public JurisdictionOverlayMasterMappingProfile()
    {
        CreateMap<JurisdictionOverlayMasterEntity, JurisdictionOverlayMasterDto>();

        CreateMap<CreateJurisdictionOverlayMasterDto, JurisdictionOverlayMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateJurisdictionOverlayMasterDto, JurisdictionOverlayMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
