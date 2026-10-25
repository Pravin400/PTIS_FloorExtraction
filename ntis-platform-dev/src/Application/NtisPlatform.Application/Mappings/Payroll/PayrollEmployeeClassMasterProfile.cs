using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll EmployeeClassMaster entity and DTOs
/// </summary>
public class PayrollEmployeeClassMasterProfile : Profile
{
    public PayrollEmployeeClassMasterProfile()
    {
        CreateMap<PayrollEmployeeClassMasterEntity, PayrollEmployeeClassMasterDto>();

        CreateMap<CreatePayrollEmployeeClassMasterDto, PayrollEmployeeClassMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePayrollEmployeeClassMasterDto, PayrollEmployeeClassMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
