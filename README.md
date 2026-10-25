# PTIS & AI-Powered Floor-Plan Extraction Platform

An enterprise Property Tax Information System (PTIS) enhanced with an AI-driven Computer Vision service for automated room extraction and boundary measurement directly from CAD floor plans and architectural drawings.

---

## 🌟 Highlights & Architecture

The solution integrates modern web technologies, scalable microservices, and enterprise backend architecture:

- **AI Floor-Plan Extraction Service (`floor-plan-extraction`)**
  - **FastAPI & Python 3.10+**: High-throughput REST API.
  - **OpenCV & Computer Vision**: Automated wall contour extraction, room polygon isolation, and dimensional bounding calculation.
  - **Intelligent Polygon Ordering**: Room sequencing and carpet area estimation.

- **Frontend Application (`ntis-ui-dev`)**
  - **Next.js 16 (App Router) & React**: Enterprise UI with high performance.
  - **Interactive Room-Wise Submission**: Instant CAD/drawing inspection, room pre-filling, manual dimension adjustment, and real-time area calculation.
  - **Multilingual Support**: English, Marathi, and Hindi localization.

- **Backend Platform API (`ntis-platform-dev`)**
  - **.NET 10 Web API & C#**: Clean Architecture (Core, Application, Infrastructure, Presentation).
  - **Entity Framework Core**: High-performance persistence layer with custom column type conversions for sub-millimeter area accuracy.
  - **Secure Authentication & Auditing**: Role-based access control and detailed audit tracking.

- **Database Manager (`ntis-database-manager-dev`)**
  - Database provisioning, migrations, and schema management for SQL Server.

---

## 📋 Prerequisites

Before installing, ensure the following are installed on your host machine:

| Component | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (v20+ recommended) | Package manager: `npm` |
| **.NET SDK** | `10.0` or `.NET 9.0+` | For building backend web API |
| **Python** | `3.10+` | Added to system `PATH` |
| **SQL Server** | `SQL Server 2019+` / Express | Database storage |

---

## 🚀 Quick Start (Automated Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/Pravin400/PTIS_FloorExtraction.git
cd PTIS_FloorExtraction
```

### 2. Run the One-Click Setup
Run the automated setup script to set up virtual environments, restore NuGet packages, and install npm modules:
```bat
setup.bat
```

### 3. Launch All Services
Launch the Backend, Frontend, and AI Extraction Service simultaneously:
```bat
start-all.bat
```

Once running, access the services:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend Swagger API**: [https://localhost:7293/swagger](https://localhost:7293/swagger)
- **AI Extraction Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Manual Installation Guide (Component by Component)

If you prefer to configure each service individually:

### 1. AI Floor-Plan Extraction Service
```bash
cd floor-plan-extraction

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python main.py
```
*Service starts on `http://localhost:8000`.*

### 2. Backend Web API (.NET 10)
```bash
cd ntis-platform-dev/src/Presentation/NtisPlatform.Api

# Restore dependencies
dotnet restore

# Run API
dotnet run --launch-profile https
```
*API runs on `https://localhost:7293`.*

### 3. Frontend Web UI (Next.js 16)
```bash
cd ntis-ui-dev

# Install dependencies
npm install

# Run development server (auto-integrates AI service)
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🗄️ Database Configuration

The application uses Microsoft SQL Server. Update the connection string if needed in:
- `ntis-platform-dev/src/Presentation/NtisPlatform.Api/appsettings.json`

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=NTIS_DB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

---

## 📁 Repository Structure

```
PTIS_FloorExtraction/
├── floor-plan-extraction/         # Python AI extraction service (FastAPI + OpenCV)
│   ├── main.py                    # Service entrypoint & extraction algorithm
│   ├── requirements.txt           # Python dependencies
│   └── start-service.bat          # Fast runner script
├── ntis-ui-dev/                   # Next.js 16 frontend application
│   ├── src/                       # Components, hooks, types, pages
│   ├── scripts/                   # Dev automation scripts
│   └── package.json               # Node dependencies
├── ntis-platform-dev/             # .NET 10 Backend Web API
│   ├── src/
│   │   ├── Core/                  # Entities and interfaces
│   │   ├── Application/           # Services, DTOs, mappings
│   │   ├── Infrastructure/        # DbContext and repositories
│   │   └── Presentation/          # Controllers and startup
├── ntis-database-manager-dev/     # Database utilities & migration tool
├── setup.bat                      # 1-Click environment setup script
├── start-all.bat                  # 1-Click launcher for all services
├── start-backend.bat              # Standalone backend runner
├── start-extraction.bat           # Standalone extraction runner
├── start-frontend.bat             # Standalone frontend runner
└── README.md                      # Documentation & guides
```

---

## 👤 Author

Developed by **Pravin400**  
GitHub: [@Pravin400](https://github.com/Pravin400)
