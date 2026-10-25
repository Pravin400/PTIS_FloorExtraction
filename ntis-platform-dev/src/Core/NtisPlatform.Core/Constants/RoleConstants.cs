namespace NtisPlatform.Core.Constants;

/// <summary>
/// Constants for user roles and administrative role classifications.
/// </summary>
public static class RoleConstants
{
    public const string Admin = "Admin";
    public const string SuperAdmin = "Super Admin";
    public const string Administrator = "Administrator";
    public const string ZoneManager = "Zone Manager";

    /// <summary>
    /// Collection of role names recognized as administrator privileges.
    /// </summary>
    public static readonly string[] AdminRoleNames = { Admin, SuperAdmin, Administrator };
}
