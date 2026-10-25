using Xunit;

namespace NtisPlatform.Tests.Architecture;

/// <summary>
/// Every host that calculates retrospective tax (the API instances and the Worker) must get the same correctness
/// dependencies: the engine, the refresher, and above all the cross-process database lock that keeps two hosts from
/// calculating one property at once. They get them from one call, <c>AddRetrospectiveTaxEngine</c>, and these tests pin that
/// no host registers any of them by hand, which is how the Worker once ended up with the engine and without the lock.
/// The Worker's registrations are top-level statements in Program.cs and cannot be built in a test, so the registration
/// files are read as text (comments left out).
/// </summary>
public class RetrospectiveHostRegistrationArchitectureTests
{
    private static string RepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (Directory.Exists(Path.Combine(directory.FullName, "src", "Presentation"))
                && Directory.Exists(Path.Combine(directory.FullName, "tests")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException($"The repository root was not found above {AppContext.BaseDirectory}.");
    }

    private static string CodeOf(string repositoryRelativePath)
    {
        var path = Path.Combine(RepositoryRoot(), repositoryRelativePath.Replace('/', Path.DirectorySeparatorChar));
        Assert.True(File.Exists(path), $"{repositoryRelativePath} was not found (the host's registration file moved: update this test).");
        return string.Join(
            Environment.NewLine,
            File.ReadAllLines(path).Where(line => !line.TrimStart().StartsWith("//", StringComparison.Ordinal)));
    }

    public static TheoryData<string> HostRegistrationFiles => new()
    {
        "src/Presentation/NtisPlatform.Api/Extensions/ServiceCollectionExtensions.cs",
        "src/Presentation/NtisPlatform.Worker/Program.cs",
    };

    [Theory]
    [MemberData(nameof(HostRegistrationFiles))]
    public void EveryHostRegistersTheRetrospectiveEngineThroughTheSharedExtension(string registrationFile)
    {
        var code = CodeOf(registrationFile);

        Assert.Contains(".AddRetrospectiveTaxEngine(", code);
    }

    [Theory]
    [MemberData(nameof(HostRegistrationFiles))]
    public void NoHostRegistersTheEngineTheRefresherOrTheLockByHand(string registrationFile)
    {
        var code = CodeOf(registrationFile);

        // a hand-written registration is the one that drifts: it is how a host ended up with the engine and no lock
        Assert.DoesNotContain("RetrospectiveTaxCalculationEngineService>", code);
        Assert.DoesNotContain("RetrospectiveTaxRefresher>", code);
        Assert.DoesNotContain("IRetrospectiveCalculationLock", code);
        Assert.DoesNotContain("SqlServerRetrospectiveCalculationLock", code);
    }
}
