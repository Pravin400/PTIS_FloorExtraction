using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mappings;

public class OldZoneMasterMappingProfile : Profile
{
    public OldZoneMasterMappingProfile()
    {
        CreateMap<OldZoneMasterEntity, OldZoneMasterDto>()
            .ForMember(dest => dest.OldZoneName, opt => opt.MapFrom(src => src.Description));

        CreateMap<CreateOldZoneMasterDto, OldZoneMasterEntity>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.OldZoneName) ? src.OldZoneName : (src.Description ?? string.Empty)))
            .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateTime.Now))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateOldZoneMasterDto, OldZoneMasterEntity>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.OldZoneName) ? src.OldZoneName : (src.Description ?? string.Empty)))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.MapFrom(_ => DateTime.Now))
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
