using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceDeptForwardingMappingProfile : Profile
{
    public GrievanceDeptForwardingMappingProfile()
    {
        CreateMap<GrievanceDeptForwardingEntity, GrievanceDeptForwardingDto>()
            .ForMember(dest => dest.GrievanceNo, opt => opt.MapFrom(src => src.GrievanceApplication != null ? src.GrievanceApplication.GrievanceNo : null))
            .ForMember(dest => dest.ForwardedToDeptName, opt => opt.MapFrom(src => src.ForwardedToDept != null ? src.ForwardedToDept.DepartmentName : null))
            .ForMember(dest => dest.AssignedToUserName, opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.FirstName + " " + src.AssignedToUser.LastName : null));

        CreateMap<CreateGrievanceDeptForwardingDto, GrievanceDeptForwardingEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ForwardedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ResolvedAt, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplication, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLog, opt => opt.Ignore())
            .ForMember(dest => dest.ForwardedToDept, opt => opt.Ignore())
            .ForMember(dest => dest.AssignedToUser, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievanceDeptForwardingDto, GrievanceDeptForwardingEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplicationId, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLogId, opt => opt.Ignore())
            .ForMember(dest => dest.ForwardedToDeptId, opt => opt.Ignore())
            .ForMember(dest => dest.ForwardedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplication, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLog, opt => opt.Ignore())
            .ForMember(dest => dest.ForwardedToDept, opt => opt.Ignore())
            .ForMember(dest => dest.AssignedToUser, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
