using NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;
using NtisPlatform.Core.Entities.FireAudit;

namespace NtisPlatform.Application.Interfaces.FireAudit;

public interface IJurisdictionOverlayMasterService : ICommonCrudService<
    JurisdictionOverlayMasterEntity,
    JurisdictionOverlayMasterDto,
    CreateJurisdictionOverlayMasterDto,
    UpdateJurisdictionOverlayMasterDto,
    JurisdictionOverlayMasterQueryParameters,
    int>
{
}
