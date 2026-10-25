using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievancePhotoTypeMappingProfile : Profile
{
    public GrievancePhotoTypeMappingProfile()
    {
        CreateMap<GrievancePhotoTypeEntity, GrievancePhotoTypeDto>();
       
        CreateMap<CreateGrievancePhotoTypeDto, GrievancePhotoTypeEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievancePhotoTypeDto, GrievancePhotoTypeEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
