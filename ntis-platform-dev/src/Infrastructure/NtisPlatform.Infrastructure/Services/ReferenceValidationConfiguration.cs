using NtisPlatform.Core.Entities;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Services;


public interface IReferenceValidatorBuilder
{
    List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> Build();

    /// <summary>
    /// The readable-message settings, or null when the entity keeps the message that lists every referencing table.
    /// </summary>
    ReferenceDisplaySettings? BuildDisplaySettings();
}

/// <summary>
/// Readable reference message for one entity, set with <see cref="ReferenceValidatorBuilder{TEntity}.DisplayAs"/>.
/// </summary>
/// <param name="DisplayName">The entity's screen name, e.g. "Asset Type".</param>
/// <param name="MasterTableNames">The labels of the checks added with CheckMasters: the only tables the message names.</param>
public sealed record ReferenceDisplaySettings(string DisplayName, IReadOnlySet<string> MasterTableNames);

public class ReferenceValidatorBuilder<TEntity> : IReferenceValidatorBuilder where TEntity : BaseEntity
{
    private readonly List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> _checks = new();
    private readonly HashSet<string> _masterTableNames = new();
    private string? _displayName;

    public ReferenceValidatorBuilder<TEntity> CheckReferences(params (string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)[] checks)
    {
        _checks.AddRange(checks);
        return this;
    }

    /// <summary>
    /// Adds checks for child masters: records the user can delete from their own master screen. Once
    /// <see cref="DisplayAs"/> is set, the TableName is shown to the user, so it is the plural screen name,
    /// e.g. "Asset Types".
    /// </summary>
    public ReferenceValidatorBuilder<TEntity> CheckMasters(params (string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)[] checks)
    {
        _checks.AddRange(checks);
        foreach (var check in checks)
            _masterTableNames.Add(check.TableName);
        return this;
    }

    /// <summary>
    /// Gives the entity a readable message that names only the child masters added with <see cref="CheckMasters"/>:
    /// "This {displayName} cannot be deleted because it has {masters}. Please delete all {masters} for this
    /// {displayName} first." When only the other checks match (records such as assets or demands, which are never
    /// named), it is "This {displayName} cannot be deleted because it is in use." The readable message comes from
    /// ValidateReferencesAsync with an operation (called by the AMS master services); the overload without an
    /// operation, and any entity without DisplayAs, keep the message that lists every referencing table.
    /// </summary>
    public ReferenceValidatorBuilder<TEntity> DisplayAs(string displayName)
    {
        _displayName = displayName;
        return this;
    }

    List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> IReferenceValidatorBuilder.Build() => _checks;

    ReferenceDisplaySettings? IReferenceValidatorBuilder.BuildDisplaySettings()
        => _displayName is null ? null : new ReferenceDisplaySettings(_displayName, _masterTableNames);

    // For generic usage in the configuration
    public List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)> Build() => _checks;
}

public class ReferenceValidationConfiguration
{
    private readonly Dictionary<Type, IReferenceValidatorBuilder> _builders = new();

    public ReferenceValidatorBuilder<TEntity> ForEntity<TEntity>() where TEntity : BaseEntity
    {
        var builder = new ReferenceValidatorBuilder<TEntity>();
        _builders[typeof(TEntity)] = builder;
        return builder;
    }

    public Dictionary<Type, List<(string TableName, Func<ApplicationDbContext, int, IQueryable<object>> Query)>> Build()
    {
        var result = new Dictionary<Type, List<(string, Func<ApplicationDbContext, int, IQueryable<object>>)>>();
        foreach (var kvp in _builders)
        {
            var list = kvp.Value.Build();
            result[kvp.Key] = list;
        }
        return result;
    }

    /// <summary>
    /// The readable-message settings of the entities registered with DisplayAs.
    /// </summary>
    public Dictionary<Type, ReferenceDisplaySettings> BuildDisplaySettings()
    {
        var result = new Dictionary<Type, ReferenceDisplaySettings>();
        foreach (var kvp in _builders)
        {
            var settings = kvp.Value.BuildDisplaySettings();
            if (settings != null)
                result[kvp.Key] = settings;
        }
        return result;
    }
}
