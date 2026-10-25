using System.Reflection;
using System.Text.Json;
using MockQueryable;
using Moq;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class KarakarniRoomDataTests
{
    [Fact]
    public async Task DetailsExposeEachActiveRoomAndPreserveExistingFloorFields()
    {
        var detail = new PropertyDetailsEntity
        {
            Id = 1, PropertyId = 1, FloorId = 8, TypeOfUseId = 1, IsActive = true,
            CarpetAreaSqMeter = 20, BuiltupAreaSqMeter = 24,
            RoomWiseSubmissionDetails = new[]
            {
                Room(20, 5, 4, 14, "Office"), Room(10, 3, 2, 6, "Bath"),
                Room(30, 8, 8, 64, "Inactive", active: false),
                Room(40, 8, 8, 64, "Deleted", deleted: true)
            }.ToList()
        };
        var provider = new KarakarniDataProvider(
            propertyRepository: null!, wardRepository: null!, societyRepository: null!,
            typeOfUseRepository: Repository(new TypeOfUseEntity { Id = 1, TypeOfUseCode = "C" }),
            propertyDetailsRepository: Repository(detail),
            floorRepository: Repository(new FloorEntity { Id = 8, FloorCode = "8" }),
            constructionTypeRepository: Repository<ConstructionTypeEntity>(),
            transmastRepository: null!, taxMastRepository: null!, ulbMasterRepository: null!,
            userRepository: null!, yearRepository: null!, propertyTypeRepository: null!,
            rvResultsRepository: Repository<RVCalculationResultsEntity>(), wingRepository: null!,
            propertyPhotoRepository: null!, buildingPlanRepository: null!, propertyMastOldRepository: null!,
            documentApplicationService: null!, cache: null!, currentTenant: null!, logger: null!, ulbConfigService: null!);
        var method = typeof(KarakarniDataProvider).GetMethod("BuildPropertyDetailsRowsAsync", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var result = await (Task<List<object>>)method.Invoke(provider, [new List<int> { 1 }, CancellationToken.None])!;
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(Assert.Single(result)));
        var row = json.RootElement;
        var rooms = row.GetProperty("rooms");

        Assert.Equal(2, rooms.GetArrayLength());
        Assert.Equal(10, rooms[0].GetProperty("roomId").GetInt32());
        Assert.Equal("Bath", rooms[0].GetProperty("roomType").GetString());
        Assert.Equal(14m, rooms[1].GetProperty("totalAreaSqMtr").GetDecimal());
        Assert.Equal(20m, rooms[1].GetProperty("areaSqMtr").GetDecimal());
        Assert.Equal(20m, row.GetProperty("carpetAreaSqMeter").GetDecimal());
        Assert.Equal(24m, row.GetProperty("builtupAreaSqMeter").GetDecimal());
        Assert.Equal("5 x 4 / 3 x 2", row.GetProperty("roomDimensions").GetString());
        Assert.Equal("Office / Bath", row.GetProperty("roomType").GetString());
    }

    private static RoomWiseSubmissionDetailsEntity Room(int id, double length, double width, double net,
        string type, bool active = true, bool deleted = false) => new()
    {
        Id = id, RoomNo = id.ToString(), LengthMtr = length, WidthMtr = width,
        AreaSqMtr = length * width, TotalAreaSqMtr = net, NoOfRooms = 1,
        IsActive = active, MarkedForDeletion = deleted,
        RoomTypeMaster = new RoomTypeMasterEntity { Id = id, RoomTypeName = type }
    };

    private static IReportDataRepository<T> Repository<T>(params T[] rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(repo => repo.GetQueryable()).Returns(rows.BuildMock());
        return repository.Object;
    }
}
