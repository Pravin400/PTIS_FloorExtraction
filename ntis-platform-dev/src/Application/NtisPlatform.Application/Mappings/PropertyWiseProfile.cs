using AutoMapper;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

public class PropertyWiseMappingProfile : Profile
{
    public PropertyWiseMappingProfile()
    {
        CreateMap<GlobalSurveyWardAllocationEntity, PropertyWiseDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => s.User != null ? (!string.IsNullOrWhiteSpace(s.User.FirstName) ? s.User.FirstName : s.User.UserName) : null))
            .ForMember(d => d.EmpCode, o => o.MapFrom(s => s.User != null ? s.User.UserCode : null))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department != null ? s.Department.DepartmentName : null))
            .ForMember(d => d.ModuleName, o => o.MapFrom(s => s.Module != null ? s.Module.ModuleName : null))
            .ForMember(d => d.ZoneNo, o => o.MapFrom(s => s.Zone != null ? s.Zone.ZoneNo : null))
            .ForMember(d => d.WardNo, o => o.MapFrom(s => s.Ward != null ? s.Ward.WardNo : null))
            .ForMember(d => d.OldZoneId, o => o.MapFrom(s => s.OldWard != null ? (int?)s.OldWard.OldZoneId : null))
            .ForMember(d => d.OldZoneNo, o => o.MapFrom(s => s.OldWard != null && s.OldWard.OldZone != null ? s.OldWard.OldZone.OldZoneNo : null))
             .ForMember(d => d.OldZoneName, o => o.MapFrom(s => s.OldWard != null && s.OldWard.OldZone != null ? (string.IsNullOrWhiteSpace(s.OldWard.OldZone.Description) ? s.OldWard.OldZone.OldZoneNo : s.OldWard.OldZone.Description) : null))
            .ForMember(d => d.OldWardNo, o => o.MapFrom(s => s.OldWard != null ? s.OldWard.OldWardNo : null))
            .ForMember(d => d.OldWardName, o => o.MapFrom(s => s.OldWard != null ? s.OldWard.Description : null));

        CreateMap<GlobalSurveyWardAllocationEntity, PropertyWiseDetailDto>()
            .IncludeBase<GlobalSurveyWardAllocationEntity, PropertyWiseDto>();

        CreateMap<GlobalSurveyWardAllocationEntity, PropertyWiseListDto>();

        CreateMap<CreatePropertyWiseDto, GlobalSurveyWardAllocationEntity>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedDate, o => o.Ignore())
            .ForMember(d => d.UpdatedDate, o => o.Ignore())
            .ForMember(d => d.UpdatedBy, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletion, o => o.MapFrom(s => !s.IsActive))
            .ForMember(d => d.MarkedForDeletionDate, o => o.MapFrom(s => s.IsActive ? (DateTime?)null : DateTime.Now));

        CreateMap<UpdatePropertyWiseDto, GlobalSurveyWardAllocationEntity>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedDate, o => o.Ignore())
            .ForMember(d => d.CreatedBy, o => o.Ignore())
            .ForMember(d => d.UpdatedDate, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletion, o => o.MapFrom(s => !s.IsActive))
            .ForMember(d => d.MarkedForDeletionDate, o => o.MapFrom(s => s.IsActive ? (DateTime?)null : DateTime.Now));
    }
}