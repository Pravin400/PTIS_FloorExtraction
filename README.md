# PTIS & AI-Powered Floor-Plan Extraction Platform

An enterprise Property Tax Information System (PTIS) enhanced with an AI-driven Computer Vision and Multimodal AI service for automated room extraction, label recognition, and boundary measurement directly from CAD floor plans, architectural drawings, and phone-captured photos of computer screens.

---

## 🌟 Highlights & Architecture

The platform integrates modern web technologies, scalable microservices, and enterprise backend architecture:

### 1. AI Floor-Plan Extraction Service (`floor-plan-extraction` - v2.0)
- **Multimodal AI Vision Engine (`gemini-3.5-flash-lite`)**:
  - **Phone Photo & Screen Capture Support**: Specifically engineered to accurately parse photos taken by mobile phones of computer monitor screens displaying CAD drawings.
  - **Immune to Camera & Screen Artifacts**: Tolerates screen moire patterns, RGB pixel grids, glare, angled perspective, and green CAD text on gray backgrounds.
  - **Comprehensive Room & Dimension Recognition**: Identifies CAD abbreviations used in municipal corporations (`HALL`, `BED`, `KIT`, `B`, `W`, `B+W`, `WC`, `PASS`, `GALL`, `TERRACE`, `ATM`, `GAB`, `GAS/MAS`), along with formulas (e.g. `3.0 X 5.0`, `5.54X5.28`, `2.8X2.0`, `1.4`, `1.1`), computing length, width, and carpet area automatically.
  - **Fast Image Optimization**: Automatically resizes high-resolution phone captures to optimal dimensions (max 1600px), ensuring sub-second transmission and 2–3s processing.
  - **High Availability & Key Rotation**: Automatic failover between primary and secondary API keys.
- **Local Offline Fallback Engine (`rapidocr-onnxruntime` + OpenCV)**:
  - High-performance ONNX-based local OCR engine with specialized green-channel contrast enhancement for CAD text.
  - Contour and wall extraction algorithms for offline environments.
- **Vector SVG Engine**:
  - Direct SVG vector element parsing for CAD drawings with 100% mathematical precision.

### 2. Frontend Application (`ntis-ui-dev`)
- **Next.js 16 (App Router) & React**: Enterprise UI with high performance.
- **Interactive Floor & Room-Wise Submission**: Instant plan inspection, automated room count detection, manual adjustment, and real-time area calculation.
- **Dynamic Property Plan Invalidation**: Invalidation of photo-plan cache on plan change/upload, ensuring newly uploaded photos immediately update room counts.
- **Strict Property Isolation**: Floor extraction operates strictly within the context of the active property and partition, avoiding sample plan cross-contamination.
- **Multilingual Support**: English, Marathi, and Hindi localization.

### 3. Backend Platform API (`ntis-platform-dev`)
- **.NET 10 Web API & C#**: Clean Architecture (Core, Application, Infrastructure, Presentation).
- **Entity Framework Core**: High-performance persistence layer with custom column type conversions for sub-millimeter area accuracy.
- **Secure Authentication & Auditing**: Role-based access control and detailed audit tracking.

### 4. Database Manager (`ntis-database-manager-dev`)
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
Run the automated setup script to set up virtual environments, install Python dependencies (including RapidOCR), restore NuGet packages, and install npm modules:
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

## 🛠️ Manual Installation Guide (New System Setup)

If you are setting up on a new machine or configuring services individually:

### 1. AI Floor-Plan Extraction Service
```bash
cd floor-plan-extraction

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies (FastAPI, OpenCV, RapidOCR, Requests, Pillow)
pip install -r requirements.txt

# Start the service
python main.py
```
*Service starts on `http://localhost:8000`.*
- Health check: `http://localhost:8000/health`
- Swagger Docs: `http://localhost:8000/docs`

#### Environment Configuration (Optional)
The extraction service automatically reads keys from `ntis-platform-dev/src/Presentation/NtisPlatform.Api/appsettings.json`. You can also supply environment variables directly:
```bash
set GEMINI_API_KEY=your_gemini_api_key
set GEMINI_FALLBACK_API_KEY=your_fallback_key
set GEMINI_MODEL=gemini-3.5-flash-lite
```

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

# Run development server (auto-integrates AI extraction)
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 📸 Phone Photo Floor Plan Extraction (How it Works)

When municipal officers capture floor plans using a phone camera pointed at a computer screen:
1. **The Problem with Traditional OCR**:
   - Camera moire patterns (RGB pixel mesh) distort text.
   - CAD text is green on gray, which disappears in traditional grayscale thresholding.
   - Screen bezels and table windows confuse OpenCV contour detection.
2. **The AI Solution in v2.0**:
   - The photo is pre-scaled to max 1600px for instant upload.
   - Sent to the Multimodal AI Vision engine (`gemini-3.5-flash-lite`).
   - The model isolates the drawing from the monitor screen, reads all room tags (`HALL`, `BED`, `KIT`, `B+W`, `WC`, `PASS`, `GALL`, `TERRACE`), extracts dimensions (`3.0X5.0` -> Length 5.0m, Width 3.0m, Area 15.0 sq.m), and outputs clean JSON.
   - If offline, `rapidocr-onnxruntime` with green-channel contrast boost extracts text locally.
3. **Frontend Integration**:
   - In Quick Data Entry Floor Submission, clicking **"Extract from Plan"** (or opening the floor form) calls `/api/extract-rooms-json`.
   - The detected room count and details automatically update the room input and room-wise submission table.
   - When a user changes or uploads a new plan photo, the cache is invalidated, ensuring the new room count is accurately reflected.

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
├── floor-plan-extraction/         # Python AI extraction service (FastAPI + Multimodal AI + RapidOCR)
│   ├── main.py                    # Service entrypoint & extraction pipeline
│   ├── requirements.txt           # Python dependencies
│   ├── start-service.bat          # Fast runner script
│   └── README.md                  # Detailed extraction service documentation
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
├── setup.bat                      # Automated one-click setup script
├── start-all.bat                  # Multi-service launcher
└── README.md                      # Platform documentation
```

---

## 📄 License
Enterprise Property Tax & Municipal Assessment System.
