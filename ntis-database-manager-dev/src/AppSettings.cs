namespace DatabaseManager;

public class AppSettings
{
    public string Server { get; set; } = ".";
    public string DatabaseName { get; set; } = "MyAppDb";
    public bool IntegratedSecurity { get; set; } = true;
    public string? UserId { get; set; }
    public string? Password { get; set; }
    public string TargetVersion { get; set; } = "1.0.0";
    public string? ConnectionString { get; set; }

    public string GetConnectionString()
    {
        if (!string.IsNullOrEmpty(ConnectionString))
        {
            return ConnectionString;
        }

        var builder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder();
        builder.DataSource = Server;
        builder.InitialCatalog = DatabaseName;
        builder.IntegratedSecurity = IntegratedSecurity;
        if (!IntegratedSecurity)
        {
            builder.UserID = UserId ?? string.Empty;
            builder.Password = Password ?? string.Empty;
        }
        builder.MultipleActiveResultSets = false;
        builder.TrustServerCertificate = true;
        return builder.ConnectionString;
    }
}
