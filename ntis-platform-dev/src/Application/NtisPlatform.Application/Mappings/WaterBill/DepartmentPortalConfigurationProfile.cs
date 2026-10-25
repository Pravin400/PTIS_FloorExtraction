using AutoMapper;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Application.Mappings.WaterBill;

/// <summary>
/// AutoMapper profile for DepartmentPortalConfiguration entity and DTO mappings.
/// Audit fields and ConfigVersion are strictly server-controlled and ignored from input DTO mappings.
/// </summary>
public class DepartmentPortalConfigurationProfile : Profile
{
    public DepartmentPortalConfigurationProfile()
    {
        CreateMap<DepartmentPortalConfigurationEntity, DepartmentPortalConfigurationDto>();

        CreateMap<CreateDepartmentPortalConfigurationDto, DepartmentPortalConfigurationEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ConfigVersion, opt => opt.Ignore())
            .ForMember(dest => dest.Department, opt => opt.Ignore());

        CreateMap<UpdateDepartmentPortalConfigurationDto, DepartmentPortalConfigurationEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.DepartmentId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ConfigVersion, opt => opt.Ignore())
            .ForMember(dest => dest.Department, opt => opt.Ignore());
    }
}
