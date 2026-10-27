# PTIS AI Floor-Plan Extraction Service (v2.0)

An isolated AI microservice engineered to extract room attributes (room count, room names, dimensional measurements, carpet areas, and shapes) from CAD drawings, architectural blueprints, and **phone-captured photos of computer screens** for the Property Tax Information System (PTIS).

---

## 1. Core Architecture

The service implements a hybrid multi-tier extraction pipeline:

```
                  ┌──────────────────────────────────────────────┐
                  │ Uploaded Floor Plan / Photo / SVG Content   │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │ Format Detection                              │
                 └───┬───────────────────────────────────────┬───┘
                     │                                       │
            [Vector SVG Content]                    [Raster Image / Photo]
                     │                                       │
     ┌───────────────▼───────────────┐                       │
     │ Direct Vector Element Parsing │                       │
     │ - <text> & <tspan> extraction │       ┌───────────────▼───────────────┐
     │ - Math & dimension mapping    │       │ 1. AI Multimodal Vision       │
     └───────────────┬───────────────┘       │    (gemini-3.5-flash-lite)    │
                     │                       │ - Screen moire tolerance      │
                     │                       │ - Angled photo perspective    │
                     │                       │ - Green CAD text parsing      │
                     │                       │ - Dual key rotation & failover│
                     │                       └───────────────┬───────────────┘
                     │                                       │
                     │                            [If Vision API Fails]
                     │                                       │
                     │                       ┌───────────────▼───────────────┐
                     │                       │ 2. Local Fallback Engine      │
                     │                       │ - RapidOCR (ONNX Runtime)     │
                     │                       │ - Green-channel contrast boost│
                     │                       │ - OpenCV contour & wall boxes │
                     │                       └───────────────┬───────────────┘
                     │                                       │
                     └───────────────────┬───────────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │ Normalized JSON Extraction    │
                         │ - room_number & room_name     │
                         │ - room_type (Hall/Bed/Kit/...)│
                         │ - length, width, carpet area  │
                         │ - total rooms_detected        │
                         └───────────────────────────────┘
```

---

## 2. Directory Structure

```text
floor-plan-extraction/
├── .venv/                   # Python Virtual Environment
├── main.py                  # FastAPI service, Multimodal Vision, RapidOCR, OpenCV
├── requirements.txt         # Dependencies (FastAPI, OpenCV, RapidOCR, Requests, Pillow)
├── start-service.bat        # Convenience script to start the service
└── README.md                # Documentation & API Contract
```

---

## 3. Installation & Local Execution on Any System

### Step 1: Create Virtual Environment (Python 3.10+)
```cmd
cd floor-plan-extraction
python -m venv .venv
```

### Step 2: Activate and Install Dependencies
```cmd
# Windows:
.venv\Scripts\activate

# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 3: Start the Service
```cmd
python main.py
```
Or run `start-service.bat` on Windows.

- **API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

## 4. API Endpoints

### `POST /api/extract-rooms`
Accepts `multipart/form-data`:
- `file`: The image or drawing file (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`)
- `measurement_unit`: (Optional) `"m"` or `"ft"` (defaults to auto-detected or `"m"`)

### `POST /api/extract-rooms-json`
Accepts `application/json`:
```json
{
  "image_base64": "<base64 encoded image string>",
  "svg_content": "<optional raw svg string>",
  "measurement_unit": "m"
}
```

### Example Response:
```json
{
  "success": true,
  "rooms_detected": 4,
  "measurement_unit": "m",
  "rooms": [
    {
      "room_number": 1,
      "room_name": "HALL",
      "room_type": "Hall",
      "shape": "Rectangle",
      "length": 5.0,
      "width": 3.0,
      "detected_dimensions": "5.0*3.0",
      "measurement_unit": "m",
      "area": 15.0,
      "area_source": "ai_vision",
      "confidence": 0.95,
      "needs_review": false
    },
    {
      "room_number": 2,
      "room_name": "ROOM",
      "room_type": "Rooms",
      "shape": "Rectangle",
      "length": 2.8,
      "width": 2.0,
      "detected_dimensions": "2.8*2.0",
      "measurement_unit": "m",
      "area": 5.6,
      "area_source": "ai_vision",
      "confidence": 0.95,
      "needs_review": false
    },
    {
      "room_number": 3,
      "room_name": "B",
      "room_type": "Bathroom",
      "shape": "Rectangle",
      "length": 1.4,
      "width": 1.1,
      "detected_dimensions": "1.4*1.1",
      "measurement_unit": "m",
      "area": 1.54,
      "area_source": "ai_vision",
      "confidence": 0.95,
      "needs_review": false
    },
    {
      "room_number": 4,
      "room_name": "W",
      "room_type": "Toilet",
      "shape": "Square",
      "length": 1.1,
      "width": 1.1,
      "detected_dimensions": "1.1*1.1",
      "measurement_unit": "m",
      "area": 1.21,
      "area_source": "ai_vision",
      "confidence": 0.95,
      "needs_review": false
    }
  ],
  "warnings": [],
  "message": "AI Vision extracted 4 rooms successfully from floor plan."
}
```

---

## 5. Configuration & Keys

The service automatically loads keys from:
1. Environment variables (`GEMINI_API_KEY`, `GEMINI_FALLBACK_API_KEY`, `GEMINI_MODEL`)
2. `ntis-platform-dev/src/Presentation/NtisPlatform.Api/appsettings.json` under `"Gemini"`

To customize keys in production:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_FALLBACK_API_KEY="your-fallback-key"
export GEMINI_MODEL="gemini-3.5-flash-lite"
```
