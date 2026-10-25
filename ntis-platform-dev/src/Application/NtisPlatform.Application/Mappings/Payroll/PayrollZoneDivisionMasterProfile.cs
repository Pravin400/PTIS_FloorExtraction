using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll ZoneDivisionMaster entity and DTOs
/// </summary>
public class PayrollZoneDivisionMasterProfile : Profile
{
    public PayrollZoneDivisionMasterProfile()
    {
        CreateMap<PayrollZoneDivisionMasterEntity, PayrollZoneDivisionMasterDto>();

        CreateMap<CreatePayrollZoneDivisionMasterDto, PayrollZoneDivisionMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePayrollZoneDivisionMasterDto, PayrollZoneDivisionMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
