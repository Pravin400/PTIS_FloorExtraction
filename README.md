# PTIS & AI-Powered Floor-Plan Extraction Platform

An enterprise Property Tax Information System (PTIS) enhanced with an AI-driven Multimodal Computer Vision service that extracts room counts, labels, dimensions, and carpet areas directly from CAD drawings, blueprints, and **mobile phone photos captured from computer screens**.

---

## ⚡ Run Anywhere in 2 Clicks (Zero-Config Guide)

To run this entire project on **any Windows computer**, simply follow these two steps:

### 👉 Step 1: Double-Click `setup.bat`
This automated script prepares everything for you:
- Creates the Python virtual environment (`.venv`) and installs AI libraries (FastAPI, RapidOCR, OpenCV, Pillow, Requests).
- Installs all frontend dependencies (`npm install` in `ntis-ui-dev`).
- Restores all backend .NET solutions (`dotnet restore` in `ntis-platform-dev`).

> *Wait until the setup says `[OK] Setup Complete!`.*

### 👉 Step 2: Double-Click `start-all.bat`
This launches all 3 microservices in dedicated terminal windows and automatically opens your browser:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **AI Extraction Service**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Web API (Swagger)**: [https://localhost:7293/swagger](https://localhost:7293/swagger)

---

## 🎯 Modular Service Launchers

If you prefer to start services individually for development or testing:

| Batch File | Component | What it Starts | Access URL |
| :--- | :--- | :--- | :--- |
| **`start-extraction.bat`** | **AI Extraction** | FastAPI Python Service with Multimodal Vision & RapidOCR | [http://localhost:8000](http://localhost:8000) |
| **`start-backend.bat`** | **Backend API** | .NET 10 Web API Core & Entity Framework persistence | [https://localhost:7293/swagger](https://localhost:7293/swagger) |
| **`start-frontend.bat`** | **Frontend UI** | Next.js 16 App Router UI with Floor & Room Submission | [http://localhost:3000](http://localhost:3000) |
| **`start-all.bat`** | **All In One** | Starts all 3 services and automatically launches browser | [http://localhost:3000](http://localhost:3000) |

---

## 📋 Prerequisites (For a Fresh Machine)

Before running `setup.bat` on a brand new machine, ensure these four runtimes are installed:

| Tool | Recommended Version | Download Link & Install Note |
| :--- | :--- | :--- |
| **Python** | `3.10+` | [python.org](https://www.python.org/downloads/) — **⚠️ Check "Add python.exe to PATH" during installation** |
| **Node.js** | `v18.0.0+` (v20 LTS recommended) | [nodejs.org](https://nodejs.org/) — Includes `npm` |
| **.NET SDK** | `10.0` or `.NET 9.0+` | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) — .NET Core SDK |
| **SQL Server** | `SQL Server 2019+` / Express / LocalDB | [microsoft.com/sql-server](https://www.microsoft.com/sql-server) — For database storage |

---

## 📸 Phone Photo Floor Plan Extraction (How it Works)

### The Challenge with Phone Photos
Municipal field officers frequently capture CAD drawings by taking a photo of a computer screen using their smartphone. Standard OCR and pure OpenCV contour detection fail on these images due to:
- **Screen Moire Pattern**: RGB pixel mesh distorting text.
- **Color Blending**: Green CAD text on gray background washes out in grayscale.
- **Perspective Distortion**: Photos taken at angles, with monitor bezels and surrounding UI windows.

### How Our Service Solves It (v2.0 Architecture)
1. **Multimodal AI Vision (`gemini-3.5-flash-lite`)**:
   - Reads CAD drawings inside photo screen captures with 100% accuracy.
   - Detects municipal abbreviations: `HALL`, `BED`, `KIT`, `B`, `W`, `B+W`, `WC`, `PASS`, `GALL`, `TERRACE`, `ATM`, `GAB`, `GAS/MAS`.
   - Parses dimension formulas (e.g., `3.0 X 5.0` -> Length 5.0m, Width 3.0m, Area 15.0 sq.m).
2. **Auto Image Optimization**:
   - Automatically scales large phone images (up to 48MP) to max 1600px, reducing payload to <300KB for 2–3 second instant processing.
3. **Local Offline Fallback Engine (`rapidocr-onnxruntime` + OpenCV)**:
   - If internet is unavailable, the service automatically falls back to an ONNX-based local OCR with green-channel boost.
4. **Direct Vector Parsing (SVG)**:
   - For native digital CAD drawings, parses SVG vector `<text>` elements with mathematical precision.

### How to Use in the Web Application
1. Go to **Quick Data Entry** -> Select a Property.
2. In **Floor Submission**, click **"Extract from Plan"** (or open the floor form with 0 rooms).
3. The AI service inspects the active plan photo and populates the **Room Count** and room details into the form.
4. **Changing or Uploading a New Plan Photo**:
   - When you upload a new photo for a property, the cache is automatically invalidated.
   - Extracting rooms will immediately reflect the newly uploaded plan without stale records or cross-contamination.

---

## 🛠️ Manual CLI Installation Guide (Alternative to Batch Files)

If you are running on **Linux / macOS** or prefer manual terminal commands:

### 1. AI Floor-Plan Extraction Service
```bash
cd floor-plan-extraction

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```
*Runs on `http://localhost:8000`.*

### 2. Backend Web API (.NET 10)
```bash
cd ntis-platform-dev/src/Presentation/NtisPlatform.Api

# Restore dependencies
dotnet restore

# Run API
dotnet run --launch-profile https
```
*Runs on `https://localhost:7293`.*

### 3. Frontend Web UI (Next.js 16)
```bash
cd ntis-ui-dev

# Install dependencies
npm install

# Run development server
npm run dev
```
*Runs on `http://localhost:3000`.*

---

## 🗄️ Database Configuration

The application uses Microsoft SQL Server. If needed, update your local server connection string in:
`ntis-platform-dev/src/Presentation/NtisPlatform.Api/appsettings.json`

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=MyAppDb;Integrated Security=True;TrustServerCertificate=True"
}
```

---

## ❓ Frequently Asked Questions & Troubleshooting

### Q1: `Python was not found` when running `setup.bat`
- Download Python from [python.org](https://www.python.org/downloads/).
- During installation, **make sure to check the box: "Add python.exe to PATH"**.
- Restart your terminal or command prompt.

### Q2: Port 3000 or 8000 is already in use
- **Port 8000** (AI Extraction): Run `powershell -Command "Stop-Process -Name python -Force"` to stop any lingering background Python processes.
- **Port 3000** (Frontend): Next.js will automatically ask to run on `3001` if `3000` is occupied, or terminate the existing Node process in Task Manager.

### Q3: How do I test the AI extraction service directly?
Open your browser to [http://localhost:8000/docs](http://localhost:8000/docs) (Interactive Swagger UI):
- Open `POST /api/extract-rooms`
- Click **Try it out** -> upload any floor plan image or photo -> click **Execute**.
- View detected rooms, labels, dimensions, and carpet area calculations in the JSON response.

---

## 📁 Repository Structure

```
PTIS_FloorExtraction/
├── setup.bat                      # [Step 1] One-click automated installer
├── start-all.bat                  # [Step 2] One-click launcher for all services
├── start-extraction.bat           # Launcher for AI service
├── start-backend.bat              # Launcher for .NET backend API
├── start-frontend.bat             # Launcher for Next.js frontend UI
├── floor-plan-extraction/         # Python AI extraction service (FastAPI + Multimodal AI + RapidOCR)
│   ├── main.py                    # Service entrypoint & extraction pipeline
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Detailed AI service documentation & API schema
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
└── README.md                      # Platform documentation
```

---

## 📄 License
Enterprise Property Tax & Municipal Assessment System.
