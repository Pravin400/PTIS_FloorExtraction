using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mappings;

public class OldWardMasterMappingProfile : Profile
{
    public OldWardMasterMappingProfile()
    {
        CreateMap<OldWardMasterEntity, OldWardMasterDto>()
            .ForMember(dest => dest.OldWardName, opt => opt.MapFrom(src => src.Description));

        CreateMap<CreateOldWardMasterDto, OldWardMasterEntity>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.OldWardName) ? src.OldWardName : (src.Description ?? string.Empty)))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateOldWardMasterDto, OldWardMasterEntity>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.OldWardName) ? src.OldWardName : (src.Description ?? string.Empty)))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
