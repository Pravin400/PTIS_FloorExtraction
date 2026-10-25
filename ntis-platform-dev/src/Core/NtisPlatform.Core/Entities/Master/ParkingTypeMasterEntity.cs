using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Master
{
    public class ParkingTypeMasterEntity : BaseEntity
    {
        public int TypeOfUseId { get; set; }
        public virtual TypeOfUseEntity? TypeOfUse { get; set; }
    }
}
