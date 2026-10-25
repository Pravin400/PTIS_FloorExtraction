using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll MaritalStatusMaster entity and DTOs
/// </summary>
public class PayrollMaritalStatusMasterProfile : Profile
{
    public PayrollMaritalStatusMasterProfile()
    {
        CreateMap<PayrollMaritalStatusMasterEntity, PayrollMaritalStatusMasterDto>();

        CreateMap<CreatePayrollMaritalStatusMasterDto, PayrollMaritalStatusMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePayrollMaritalStatusMasterDto, PayrollMaritalStatusMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
