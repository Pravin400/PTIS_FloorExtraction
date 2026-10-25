using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceApplicationMappingProfile : Profile
{
    public GrievanceApplicationMappingProfile()
    {
        CreateMap<GrievanceApplicationEntity, GrievanceApplicationDto>()
            .ForMember(dest => dest.WardId, opt => opt.MapFrom(src => src.WardId))
            .ForMember(dest => dest.ZoneId, opt => opt.MapFrom(src => src.ZoneId ?? (src.Ward != null ? src.Ward.ZoneId : null)))
            .ForMember(dest => dest.CitizenName, opt => opt.MapFrom(src => src.Citizen != null ? src.Citizen.Name : null))
            .ForMember(dest => dest.CitizenMobileNo, opt => opt.MapFrom(src => src.Citizen != null ? src.Citizen.MobileNo : null))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.GrievanceDepartment != null ? src.GrievanceDepartment.DepartmentName : null))
            .ForMember(dest => dest.GrievanceType, opt => opt.MapFrom(src => src.GrievanceType != null ? src.GrievanceType.GrievanceType : null))
            .ForMember(dest => dest.WorkflowName, opt => opt.MapFrom(src => src.Workflow != null ? src.Workflow.WorkflowName : null))
            .ForMember(dest => dest.CurrentStateName, opt => opt.MapFrom(src => src.CurrentState != null ? src.CurrentState.StateName : null))
            .ForMember(dest => dest.CurrentAssignedToUserName, opt => opt.MapFrom(src => src.CurrentAssignedToUser != null ? src.CurrentAssignedToUser.UserName : null))
            .ForMember(dest => dest.WardNo, opt => opt.MapFrom(src => src.Ward != null ? src.Ward.WardNo : null))
            .ForMember(dest => dest.ZoneNo, opt => opt.MapFrom(src => src.Zone != null ? src.Zone.ZoneNo : (src.Ward != null && src.Ward.Zone != null ? src.Ward.Zone.ZoneNo : null)));

        CreateMap<CreateGrievanceApplicationDto, GrievanceApplicationEntity>()
            .ForMember(dest => dest.WardId, opt => opt.MapFrom(src => src.WardId))
            .ForMember(dest => dest.ZoneId, opt => opt.MapFrom(src => src.ZoneId))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceNo, opt => opt.Ignore())
            .ForMember(dest => dest.WorkflowId, opt => opt.MapFrom(src => src.WorkflowId ?? 0))
            .ForMember(dest => dest.CurrentStateId, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentAssignedToUserId, opt => opt.Ignore())
            .ForMember(dest => dest.SubmittedDate, opt => opt.Ignore())
            .ForMember(dest => dest.ResolvedDate, opt => opt.Ignore())
            .ForMember(dest => dest.ClosedDate, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Citizen, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceType, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentState, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentAssignedToUser, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.DeptForwardings, opt => opt.Ignore())
            .ForMember(dest => dest.Ward, opt => opt.Ignore())
            .ForMember(dest => dest.Zone, opt => opt.Ignore())
            .ForMember(dest => dest.Escalations, opt => opt.Ignore());

        CreateMap<UpdateGrievanceApplicationDto, GrievanceApplicationEntity>()
            .ForMember(dest => dest.WardId, opt => opt.MapFrom(src => src.WardId))
            .ForMember(dest => dest.ZoneId, opt => opt.MapFrom(src => src.ZoneId))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceNo, opt => opt.Ignore())
            .ForMember(dest => dest.CitizenId, opt => opt.Ignore())
            .ForMember(dest => dest.WorkflowId, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentStateId, opt => opt.Ignore())
            .ForMember(dest => dest.SubmittedDate, opt => opt.Ignore())
            .ForMember(dest => dest.ResolvedDate, opt => opt.Ignore())
            .ForMember(dest => dest.ClosedDate, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Citizen, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceType, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentState, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentAssignedToUser, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.DeptForwardings, opt => opt.Ignore())
            .ForMember(dest => dest.Ward, opt => opt.Ignore())
            .ForMember(dest => dest.Zone, opt => opt.Ignore())
            .ForMember(dest => dest.Escalations, opt => opt.Ignore());
    }
}
