# PTIS AI Floor-Plan Extraction Service

An isolated microservice designed to extract room attributes (room count, labels, dimensions, shapes, and boundaries) from floor plan drawings and images for the Property Tax Assessment and Management System (PTIS).

---

## 1. Responsibilities
- **OpenCV**: Preprocesses floor plans, isolates wall boundaries, identifies enclosed contours, and determines room bounding boxes.
- **OCR Engine (PaddleOCR / EasyOCR / Fallback)**: Detects room names (e.g. `HALL`, `DINING`, `BEDROOM`, `STORE_ROOM`), written dimensions (e.g. `10*10`, `10*15`, `12*13`, `5*7`), and unit annotations (`AREA IN MTR` / `AREA IN FT`).
- **Vector SVG Engine**: Directly parses structured floor plans if vector SVG is provided for 100% precision without loss.
- **FastAPI**: Serves a fast, lightweight HTTP REST API for local consumption.

---

## 2. Directory Structure
```text
floor-plan-extraction/
├── .venv/                   # Python Virtual Environment
├── main.py                  # FastAPI service, OpenCV boundary detection, OCR pipeline
├── requirements.txt         # Dependencies
├── start-service.bat        # Convenience script to start the service
├── README.md                # Documentation & API Contract
└── tests/
    ├── test_plan.png        # Sample floor plan raster image
    ├── test_plan.svg        # Sample floor plan vector SVG
    └── test_extraction.py   # Automated unit tests
```

---

## 3. Installation & Local Execution

### Step 1: Create Virtual Environment (using Python 3.10 recommended)
```cmd
cd d:\Sthapatya\PTIS_Project\floor-plan-extraction
py -3.10 -m venv .venv
```

### Step 2: Activate and Install Dependencies
```cmd
.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Start the Service
```cmd
.venv\Scripts\activate
python main.py
```
Or simply double-click `start-service.bat`.

The service will start at `http://localhost:8000`.
- API Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## 4. API Contract

### `POST /api/extract-rooms`
Accepts `multipart/form-data` with:
- `file`: The image file (`.png`, `.jpg`, `.svg`)
- `measurement_unit`: (Optional) `"m"` or `"ft"`

### Example Response
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
      "shape": "Square",
      "length": 10.0,
      "width": 10.0,
      "detected_dimensions": "10*10",
      "measurement_unit": "m",
      "area": 100.0,
      "area_source": "explicit_dimensions",
      "confidence": 0.98,
      "needs_review": false
    },
    {
      "room_number": 2,
      "room_name": "DINING",
      "room_type": "Dining",
      "shape": "Rectangle",
      "length": 15.0,
      "width": 10.0,
      "detected_dimensions": "10*15",
      "measurement_unit": "m",
      "area": 150.0,
      "area_source": "explicit_dimensions",
      "confidence": 0.98,
      "needs_review": false
    },
    {
      "room_number": 3,
      "room_name": "BEDROOM",
      "room_type": "Bedroom",
      "shape": "Rectangle",
      "length": 13.0,
      "width": 12.0,
      "detected_dimensions": "12*13",
      "measurement_unit": "m",
      "area": 156.0,
      "area_source": "explicit_dimensions",
      "confidence": 0.98,
      "needs_review": false
    },
    {
      "room_number": 4,
      "room_name": "STORE_ROOM",
      "room_type": "Store Room",
      "shape": "Rectangle",
      "length": 7.0,
      "width": 5.0,
      "detected_dimensions": "5*7",
      "measurement_unit": "m",
      "area": 35.0,
      "area_source": "explicit_dimensions",
      "confidence": 0.98,
      "needs_review": false
    }
  ],
  "warnings": [],
  "message": "Extracted successfully from vector plan data."
}
```

---

## 5. Running Tests
```cmd
cd d:\Sthapatya\PTIS_Project\floor-plan-extraction
.venv\Scripts\python tests\test_extraction.py
```
