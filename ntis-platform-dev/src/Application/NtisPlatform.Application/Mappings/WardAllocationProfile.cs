using AutoMapper;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mapping;

public class WardAllocationProfile : Profile
{
    public WardAllocationProfile()
    {
        CreateMap<GlobalSurveyWardAllocationEntity, WardAllocationDto>()
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => src.User != null ? (!string.IsNullOrWhiteSpace(src.User.FirstName) ? src.User.FirstName : src.User.UserName) : null))
            .ForMember(dest => dest.EmpCode,
                opt => opt.MapFrom(src => src.User != null ? src.User.UserCode : null))
            .ForMember(dest => dest.DepartmentName,
                opt => opt.MapFrom(src => src.Department != null ? src.Department.DepartmentName : null))
            .ForMember(dest => dest.ModuleName,
                opt => opt.MapFrom(src => src.Module != null ? src.Module.ModuleName : null))
            .ForMember(dest => dest.ZoneNo,
                opt => opt.MapFrom(src => src.Zone != null ? src.Zone.ZoneNo : null))
            .ForMember(dest => dest.WardNo,
                opt => opt.MapFrom(src => src.Ward != null ? src.Ward.WardNo : null))
            .ForMember(dest => dest.OldWardNo,
                opt => opt.MapFrom(src => src.OldWard != null ? src.OldWard.OldWardNo : null))
            .ForMember(dest => dest.OldWardName,
                opt => opt.MapFrom(src => src.OldWard != null ? src.OldWard.Description : null))
            .ForMember(dest => dest.OldZoneNo,
                opt => opt.MapFrom(src => src.OldWard != null && src.OldWard.OldZone != null ? src.OldWard.OldZone.OldZoneNo : null))
            .ForMember(dest => dest.OldZoneName,
                opt => opt.MapFrom(src => src.OldWard != null && src.OldWard.OldZone != null ? src.OldWard.OldZone.Description : null));

        CreateMap<CreateWardAllocationDto, GlobalSurveyWardAllocationEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.DepartmentId, opt => opt.Ignore()) // set from service
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Department, opt => opt.Ignore())
            .ForMember(dest => dest.Module, opt => opt.Ignore())
            .ForMember(dest => dest.Zone, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.MapFrom(src => (DateTime?)null));

        CreateMap<UpdateWardAllocationDto, GlobalSurveyWardAllocationEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.DepartmentId, opt => opt.Ignore())
            .ForMember(dest => dest.ModuleId, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Department, opt => opt.Ignore())
            .ForMember(dest => dest.Module, opt => opt.Ignore())
            .ForMember(dest => dest.Zone, opt => opt.Ignore())
            .ForMember(dest => dest.Ward, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
           .ForMember(dest => dest.FromPropertyNo,
               opt => opt.MapFrom(src =>
                string.IsNullOrWhiteSpace(src.FromPropertyNo)
            ? null
            : src.FromPropertyNo.Trim()))
           .ForMember(dest => dest.ToPropertyNo,
               opt => opt.MapFrom(src =>
                string.IsNullOrWhiteSpace(src.ToPropertyNo)
            ? null
            : src.ToPropertyNo.Trim()));
    }
}