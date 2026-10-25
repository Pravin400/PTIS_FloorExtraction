using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Core.Interfaces.Property;

/// <summary>
/// Data access for the Property "Social Info" tab. Encapsulates the social-attribute and
/// property-social-detail queries so the application service contains no EF Core query expressions.
/// </summary>
public interface IPropertySocialDetailsRepository
{
    /// <summary>Returns all active social attributes ordered by display order then code (the full hierarchy source).</summary>
    Task<List<SocialAttributeEntity>> GetActiveSocialAttributesAsync(CancellationToken cancellationToken = default);


    /// <summary>Returns the property's social-detail rows regardless of active state (for true upsert detection).</summary>
    Task<List<PropertySocialDetailsEntity>> GetSocialDetailsByPropertyAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>Returns the property's active social-detail rows with their SocialAttribute loaded (for the upsert response projection).</summary>
    Task<List<PropertySocialDetailsEntity>> GetActiveSocialDetailsWithAttributeByPropertyAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns active social-detail rows (with their SocialAttribute loaded) filtered by any combination of
    /// <paramref name="socialAttributeId"/>, <paramref name="societyDetailId"/>, <paramref name="wingDetailId"/>
    /// and <paramref name="propertyId"/>.
    /// A null filter argument is ignored. At least one filter is expected to be provided by the caller.
    /// </summary>
    Task<List<PropertySocialDetailsEntity>> GetSocialDetailsByFiltersAsync(
        int? socialAttributeId,
        int? societyDetailId,
        int? wingDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all related entities for a society (wings, properties/units, applied social/discount details, and master attributes)
    /// to power the dedicated Discount and Social Data grid.
    /// </summary>
    Task<(
        SocietyDetailsEntity? Society,
        PropertyEntity? SocietyProperty,
        List<WingDetailsMastEntity> Wings,
        List<PropertyEntity> Units,
        List<PropertySocialDetailsEntity> SocialDetails,
        List<SocialAttributeEntity> MasterAttributes
    )> GetDiscountAndSocialHierarchyDataAsync(
        int societyDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves property details and applied social/discount details for an individual property along with master attributes.
    /// </summary>
    Task<(
        PropertyEntity? Property,
        WingDetailsMastEntity? Wing,
        List<PropertySocialDetailsEntity> SocialDetails,
        List<SocialAttributeEntity> MasterAttributes
    )> GetIndividualPropertyDiscountAndSocialDataAsync(
        int propertyId,
        CancellationToken cancellationToken = default);
}
