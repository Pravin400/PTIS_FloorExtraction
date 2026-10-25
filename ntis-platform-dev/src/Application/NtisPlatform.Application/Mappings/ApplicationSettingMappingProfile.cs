using AutoMapper;
using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

/// <summary>
/// AutoMapper profile for ApplicationSetting entity and DTOs
/// </summary>
public class ApplicationSettingMappingProfile : Profile
{
    public ApplicationSettingMappingProfile()
    {
        // Entity to DTO
        CreateMap<ApplicationSettingEntity, ApplicationSettingDto>()
            .ForMember(dest => dest.ModuleName, opt => opt.MapFrom(src => src.Module != null ? src.Module.ModuleName : null));

        // Create DTO to Entity
        CreateMap<CreateApplicationSettingDto, ApplicationSettingEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Module, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        // Update DTO to Entity
        CreateMap<UpdateApplicationSettingDto, ApplicationSettingEntity>()
            .ForMember(dest => dest.Module, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
