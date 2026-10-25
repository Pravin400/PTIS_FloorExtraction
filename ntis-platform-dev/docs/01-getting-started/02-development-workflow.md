# Development Workflow & Coding Standards

This guide outlines the architectural rules, coding standards, and living documentation practices followed across the **NTIS Platform** codebase.

---

## 🏛️ Clean Architecture Principles

We enforce strict unidirectional layer dependencies:

```
Presentation (Api, Worker) ──► Application ──► Core (Domain)
             ▲                      ▲
             │                      │
             └── Infrastructure ────┘
```

1. **`NtisPlatform.Core`**:
   - Contains pure domain entities, enums, exceptions, and repository abstractions.
   - **Zero external dependencies** (no EF Core, ASP.NET Core, or AutoMapper references).
2. **`NtisPlatform.Application`**:
   - Contains business logic services, DTOs, mappings, and validation logic.
   - Depends only on `Core`.
3. **`NtisPlatform.Infrastructure`**:
   - Implements `Core` interfaces (`IRepository`, `IUnitOfWork`) via EF Core 10 and SQL Server.
4. **`NtisPlatform.Api`**:
   - Contains controllers, middlewares, rate limiting, and dependency injection wiring.

---

## 📐 C# & .NET 10 Coding Conventions

1. **Async by Default**: All I/O operations (database queries, external API calls, file writes) must use `async`/`await` and pass `CancellationToken`.
2. **Nullable Reference Types**: Keep nullable reference types enabled (`<Nullable>enable</Nullable>`) and avoid suppressing null warnings with `!`.
3. **XML Doc Comments**: Every public service interface (`I...Service`), DTO, and controller action method must have XML docstrings (`/// <summary>`).
4. **CRUD Standardization**: For standard entities, extend `BaseCommonCrudService<TEntity, TDto, TCreateDto, TUpdateDto, TQueryParam, TKey>` to inherit standard pagination, search, sorting, and soft deletion.

---

## 🔄 Living Documentation Policy (Mandatory)

Whenever you add or change features:
1. **Synchronize Docs in the Same PR**: Never submit code changes without updating the relevant guide under `docs/03-modules/` or `docs/04-api-reference/`.
2. **Update Request/Response Examples**: If you change a DTO or route, update the markdown JSON payload examples.
3. **Document Business Rules**: If you add validation logic or workflow rules, describe them in the module's documentation file.
