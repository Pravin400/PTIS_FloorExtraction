using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceDepartmentMappingProfile : Profile
{
    public GrievanceDepartmentMappingProfile()
    {
        // Entity → Read DTO (includes CoreDepartment navigation)
        CreateMap<GrievanceDepartmentMasterEntity, GrievanceDepartmentDto>()
            .ForMember(dest => dest.CoreDepartment,
                opt => opt.MapFrom(src => src.CoreDepartment));

        // CORE.DepartmentMaster → CoreDepartmentInfoDto (nested in response)
        CreateMap<DepartmentMasterEntity, CoreDepartmentInfoDto>();

        // Create DTO → Entity
        CreateMap<CreateGrievanceDepartmentDto, GrievanceDepartmentMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceTypes, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.Forwardings, opt => opt.Ignore())
            .ForMember(dest => dest.CoreDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        // Update DTO → Entity
        CreateMap<UpdateGrievanceDepartmentDto, GrievanceDepartmentMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceTypes, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.Forwardings, opt => opt.Ignore())
            .ForMember(dest => dest.CoreDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
