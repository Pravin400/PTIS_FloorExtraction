using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll VillageMaster entity and DTOs
/// </summary>
public class PayrollVillageMasterProfile : Profile
{
    public PayrollVillageMasterProfile()
    {
        CreateMap<PayrollVillageMasterEntity, PayrollVillageMasterDto>();

        CreateMap<CreatePayrollVillageMasterDto, PayrollVillageMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePayrollVillageMasterDto, PayrollVillageMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
