# Quickstart & Local Setup Guide

This guide walks new developers through configuring and running the **NTIS Platform** on their local workstation.

---

## 💻 Prerequisites

Ensure you have the following installed before proceeding:
1. **[.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)** (Verify with `dotnet --version`).
2. **Microsoft SQL Server** (2019+ / LocalDB / SQL Server Express / Docker SQL Server).
3. **IDE**: Visual Studio 2022 (v17.12+), JetBrains Rider, or VS Code with C# Dev Kit.
4. **Git**: Installed and configured.

---

## 🛠️ Step-by-Step Installation

### 1. Clone the Repository
```powershell
git clone <repository-url>
cd ntis-platform
```

### 2. Restore Dependencies
Restore NuGet packages across all projects:
```powershell
dotnet restore
```

### 3. Build the Solution
Verify the entire solution compiles without errors:
```powershell
dotnet build
```

---

## ⚙️ Configuration Setup

### 1. Configure Connection Strings (`src/Presentation/NtisPlatform.Api/appsettings.json`)
Open `appsettings.json` or `appsettings.Development.json` and configure your SQL Server connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=NtisPlatformDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "YourSuperSecretEnterpriseJwtSigningKey_MustBe32CharsOrLonger!",
    "Issuer": "NtisPlatform",
    "Audience": "NtisPlatformUsers",
    "ExpiresInMinutes": 1440
  },
  "Sms": {
    "Provider": "Mock",
    "ApiKey": "OptionalKey",
    "SenderId": "NTISGV"
  }
}
```

---

## 🗄️ Database Migrations

Apply pending Entity Framework Core migrations to your SQL Server instance:

```powershell
# Using dotnet-ef tool
dotnet ef database update --project src/Infrastructure/NtisPlatform.Infrastructure --startup-project src/Presentation/NtisPlatform.Api
```

---

## 🚀 Running the API & Worker

### Running the REST API (HTTP & Swagger)
```powershell
dotnet run --project src/Presentation/NtisPlatform.Api
```
- The API will start (e.g. at `http://localhost:5000` or `https://localhost:7001`).
- Open your browser and navigate to **`/swagger`** (e.g., `https://localhost:7001/swagger`) to interact with the Swagger/OpenAPI explorer.

### Running the Background Worker
```powershell
dotnet run --project src/Presentation/NtisPlatform.Worker
```

---

## 🧪 Running Unit & Integration Tests

Run the full xUnit test suite:
```powershell
dotnet test
```
To run tests with detailed logging:
```powershell
dotnet test --logger "console;verbosity=detailed"
```
