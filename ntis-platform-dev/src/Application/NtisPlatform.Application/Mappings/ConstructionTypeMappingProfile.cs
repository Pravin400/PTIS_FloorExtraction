using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

public class ConstructionTypeMappingProfile : Profile
{
    public ConstructionTypeMappingProfile()
    {
        CreateMap<ConstructionTypeEntity, ConstructionTypeDto>();
        CreateMap<ConstructionTypeDto, ConstructionTypeEntity>();

        CreateMap<CreateConstructionTypeDto, ConstructionTypeEntity>()
        .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
        .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
        .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.DescriptionEnglish, opt => opt.MapFrom(src => src.DescriptionEnglish));

        CreateMap<UpdateConstructionTypeDto, ConstructionTypeEntity>()
      .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
      .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
      .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.DescriptionEnglish, opt => opt.MapFrom(src => src.DescriptionEnglish));

    }

}
