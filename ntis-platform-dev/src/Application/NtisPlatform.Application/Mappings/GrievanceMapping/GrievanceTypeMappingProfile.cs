using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceTypeMappingProfile : Profile
{
    public GrievanceTypeMappingProfile()
    {
        CreateMap<GrievanceTypeMasterEntity, GrievanceTypeDto>()
            .ForMember(dest => dest.DepartmentName,
                opt => opt.MapFrom(src => src.GrievanceDepartment != null ? src.GrievanceDepartment.DepartmentName : null));

        CreateMap<CreateGrievanceTypeDto, GrievanceTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievanceTypeDto, GrievanceTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
