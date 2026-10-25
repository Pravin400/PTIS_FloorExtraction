# System Architecture & Design Overview

## 🎯 Architecture Overview

The **NTIS Platform** is designed as a modular, scalable, enterprise-grade e-governance backend built on **.NET 10** following **Clean Architecture** (Ports & Adapters) principles.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│   • NtisPlatform.Api (REST Controllers, Swagger, Auth)      │
│   • NtisPlatform.Worker (Background Schedulers & Jobs)      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                     Application Layer                       │
│   • Business Services (Grievance, Property, Tax Engine, QC) │
│   • DTOs (Request / Response Contracts)                     │
│   • BaseCommonCrudService Generic Engine                    │
│   • AutoMapper Profiles & Fluent Validation                 │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain / Core Layer                     │
│   • Domain Entities (Aggregate Roots & Lookup Masters)      │
│   • Enums, Constants & Business Exceptions                  │
│   • IRepository<T, TKey> & IUnitOfWork Abstractions         │
└──────────────▲──────────────────────────────────────────────┘
               │
               │ (Implements Core Interfaces)
┌──────────────┴──────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│   • NtisPlatformDbContext (EF Core 10)                      │
│   • Generic Repository & UnitOfWork Implementation          │
│   • SQL Server Provider, Soft-Delete Query Filters          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Projects Breakdown

### 1. `NtisPlatform.Core`
- **Role**: Pure domain model.
- **Folder Structure**:
  - `Entities/` (Organized by domain: `GrievanceEntities/`, `Master/`, `GIS/`, `WaterBill/`, `Rules/`, `RetrospectiveTax/`, `Asset_Management/`).
  - `Interfaces/` (`IRepository<T, TKey>`, `IUnitOfWork`, `IAggregateRoot`).
  - `Exceptions/` (`DomainException`, `NotFoundException`, `ValidationException`).

### 2. `NtisPlatform.Application`
- **Role**: Use cases, business rules, and orchestration.
- **Key Concepts**:
  - `BaseCommonCrudService`: Reusable generic service providing paginated querying, sorting, dynamic filtering, create, update, and soft-delete across all standard entities.
  - Partial Service Classes: Complex services (such as `GrievanceApplicationService` and `PropertyService`) are split into logical partial classes (e.g. `.Workflow.cs`, `.Tracking.cs`, `.Range.cs`, `.Split.cs`).
  - `DTOs/`: Strictly decoupled request and response contracts preventing domain entity leakage.

### 3. `NtisPlatform.Infrastructure`
- **Role**: Persistence and external integrations.
- **Key Concepts**:
  - `NtisPlatformDbContext`: Configures EF Core mappings, composite indexes, cascades, and global query filters for soft deletion (`IsActive == true`).
  - Generic Repository pattern implementation.

### 4. `NtisPlatform.Api`
- **Role**: HTTP API presentation.
- **Key Concepts**:
  - Thin REST controllers delegating to application services via `this.ExecuteGetAllPaged()`, `this.ExecuteCreate()`, etc.
  - JWT Bearer Authentication, Two-Factor Authentication, and endpoint Rate Limiting.
  - Swagger/OpenAPI interactive API generation.

### 5. `NtisPlatform.Worker`
- **Role**: Background task execution.
- **Key Concepts**:
  - Long-running jobs, periodic SLA checks, bulk tax recalculations, and asynchronous notification workers.
