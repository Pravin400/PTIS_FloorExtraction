namespace NtisPlatform.Application.Constants;

public static class PropertyPhotoConstants
{
    public const string PhotoTypeCodePropertyFront = "PROPERTY_FRONT";
    public const string PhotoTypeCodeSocietyPlace = "SOCIETY_PLACE";

    public const string PhotoEntityTypeProperty = "P";
    public const string PhotoEntityTypeSociety = "S";
    public const string PhotoEntityTypeWing = "W";
}

public static class PropertyPhotoTypeCodes
{
    public const string PropertyFront = PropertyPhotoConstants.PhotoTypeCodePropertyFront;
    public const string SocietyPlace = PropertyPhotoConstants.PhotoTypeCodeSocietyPlace;
}

public static class PropertyPhotoEntityTypes
{
    public const string Property = PropertyPhotoConstants.PhotoEntityTypeProperty;
    public const string Society = PropertyPhotoConstants.PhotoEntityTypeSociety;
    public const string Wing = PropertyPhotoConstants.PhotoEntityTypeWing;
}
