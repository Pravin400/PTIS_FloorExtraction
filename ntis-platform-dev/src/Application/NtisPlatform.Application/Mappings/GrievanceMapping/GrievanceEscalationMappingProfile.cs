using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceEscalationMappingProfile : Profile
{
    public GrievanceEscalationMappingProfile()
    {
        CreateMap<GrievanceEscalationEntity, GrievanceEscalationDto>()
            .ForMember(dest => dest.GrievanceNo, opt => opt.MapFrom(src => src.GrievanceApplication != null ? src.GrievanceApplication.GrievanceNo : null))
            .ForMember(dest => dest.WardNo, opt => opt.MapFrom(src => src.Ward != null ? src.Ward.WardNo : null))
            .ForMember(dest => dest.ZoneNo, opt => opt.MapFrom(src => src.Zone != null ? src.Zone.ZoneNo : (src.Ward != null && src.Ward.Zone != null ? src.Ward.Zone.ZoneNo : null)))
            .ForMember(dest => dest.EscalatedByUserName, opt => opt.MapFrom(src => src.EscalatedByUser != null ? src.EscalatedByUser.UserName : null))
            .ForMember(dest => dest.EscalatedByFullName, opt => opt.MapFrom(src => src.EscalatedByUser != null ? $"{src.EscalatedByUser.FirstName} {src.EscalatedByUser.LastName}".Trim() : null))
            .ForMember(dest => dest.TargetDepartmentName, opt => opt.MapFrom(src => src.TargetDepartment != null ? src.TargetDepartment.DepartmentName : null))
            .ForMember(dest => dest.TargetAssignedToUserName, opt => opt.MapFrom(src => src.TargetAssignedToUser != null ? src.TargetAssignedToUser.UserName : null))
            .ForMember(dest => dest.RespondedByUserName, opt => opt.MapFrom(src => src.RespondedByUser != null ? src.RespondedByUser.UserName : null));

        CreateMap<CreateGrievanceEscalationDto, GrievanceEscalationEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.EscalationStatus, opt => opt.MapFrom(_ => "PENDING"))
            .ForMember(dest => dest.TargetDepartmentId, opt => opt.Ignore())
            .ForMember(dest => dest.TargetAssignedToUserId, opt => opt.Ignore())
            .ForMember(dest => dest.StaffResponse, opt => opt.Ignore())
            .ForMember(dest => dest.RespondedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.RespondedAt, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplication, opt => opt.Ignore())
            .ForMember(dest => dest.Ward, opt => opt.Ignore())
            .ForMember(dest => dest.EscalatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.TargetDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.TargetAssignedToUser, opt => opt.Ignore())
            .ForMember(dest => dest.RespondedByUser, opt => opt.Ignore());
    }
}
