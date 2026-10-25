# Data Layer & Database Architecture

## 🗄️ Database Strategy & EF Core 10

The **NTIS Platform** uses Microsoft SQL Server with **Entity Framework Core 10** for relational data persistence.

---

## 🏗️ Core Patterns

### 1. Base Entity & Audit Columns
All database entities inherit from `BaseEntity<TKey>`:

```csharp
public abstract class BaseEntity<TKey>
{
    public TKey Id { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public int? CreatedBy { get; set; }
    public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
```

### 2. Soft-Delete Global Query Filter
Entities with `IsActive` are automatically filtered out from EF queries unless explicitly bypassed:
```csharp
modelBuilder.Entity<GrievanceApplicationEntity>().HasQueryFilter(e => e.IsActive);
```

### 3. Generic Repository & Unit of Work
- `IRepository<TEntity, TKey>`: Provides standard abstractions (`GetByIdAsync`, `GetQueryable`, `AddAsync`, `UpdateAsync`, `DeleteAsync`).
- `IUnitOfWork`: Coordinates multi-repository database transactions into atomic operations via `SaveChangesAsync`.

---

## 🛠️ EF Core Migrations Workflow

### Adding a New Migration
```powershell
dotnet ef migrations add <MigrationName> --project src/Infrastructure/NtisPlatform.Infrastructure --startup-project src/Presentation/NtisPlatform.Api
```

### Applying Migrations to Database
```powershell
dotnet ef database update --project src/Infrastructure/NtisPlatform.Infrastructure --startup-project src/Presentation/NtisPlatform.Api
```
