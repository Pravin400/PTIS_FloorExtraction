using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll BloodGroupMaster entity and DTOs
/// </summary>
public class PayrollBloodGroupMasterProfile : Profile
{
    public PayrollBloodGroupMasterProfile()
    {
        CreateMap<PayrollBloodGroupMasterEntity, PayrollBloodGroupMasterDto>();

        CreateMap<CreatePayrollBloodGroupMasterDto, PayrollBloodGroupMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePayrollBloodGroupMasterDto, PayrollBloodGroupMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
