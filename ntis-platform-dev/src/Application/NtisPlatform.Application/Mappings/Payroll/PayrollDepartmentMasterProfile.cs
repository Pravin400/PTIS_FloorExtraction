using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll DepartmentMaster entity and DTOs
/// </summary>
public class PayrollDepartmentMasterProfile : Profile
{
    public PayrollDepartmentMasterProfile()
    {
        // Entity to DTO
        CreateMap<PayrollDepartmentMasterEntity, PayrollDepartmentMasterDto>();

        // Create DTO to Entity
        CreateMap<CreatePayrollDepartmentMasterDto, PayrollDepartmentMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        // Update DTO to Entity
        CreateMap<UpdatePayrollDepartmentMasterDto, PayrollDepartmentMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
