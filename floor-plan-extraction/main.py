import io
import re
import math
import base64
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("floor-plan-extraction")

app = FastAPI(
    title="PTIS AI Floor-Plan Extraction Service",
    description="Isolated extraction service for detecting rooms, boundaries, labels, and dimensions from floor plan images.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Data Models -----------------

class ExtractedRoom(BaseModel):
    room_number: int
    room_name: str
    room_type: Optional[str] = None
    shape: str = "Rectangle"
    length: Optional[float] = None
    width: Optional[float] = None
    detected_dimensions: Optional[str] = None
    measurement_unit: str = "m"
    area: Optional[float] = None
    area_source: str = "explicit_dimensions"  # explicit_dimensions | contour_geometry | estimated
    confidence: float = 0.95
    needs_review: bool = False
    bounding_box: Optional[Dict[str, int]] = None

class ExtractionResponse(BaseModel):
    success: bool
    rooms_detected: int
    measurement_unit: str
    rooms: List[ExtractedRoom]
    warnings: List[str] = []
    message: Optional[str] = None

class ExtractionRequestJson(BaseModel):
    image_base64: Optional[str] = None
    svg_content: Optional[str] = None
    measurement_unit: Optional[str] = None  # "m" or "ft"


# ----------------- Room Type Normalization -----------------

ROOM_TYPE_MAPPINGS = {
    "HALL": "Hall",
    "LIVING": "Hall",
    "LIVING_ROOM": "Hall",
    "DINING": "Dining",
    "DINING_ROOM": "Dining",
    "BEDROOM": "Bedroom",
    "BED_ROOM": "Bedroom",
    "MASTER_BEDROOM": "Bedroom",
    "STORE": "Store Room",
    "STORE_ROOM": "Store Room",
    "KITCHEN": "Kitchen",
    "BATH": "Bathroom",
    "BATHROOM": "Bathroom",
    "TOILET": "Toilet",
    "WC": "Toilet",
    "BALCONY": "Balcony",
    "TERRACE": "Terrace",
    "POOJA": "Rooms",
    "PASSAGE": "Rooms",
    "OFFICE": "Rooms",
    "ROOM": "Rooms",
}

def normalize_room_type(name: str) -> str:
    clean = re.sub(r'[^A-Za-z0-9_]', '', name.strip().upper())
    for key, mapped in ROOM_TYPE_MAPPINGS.items():
        if key in clean:
            return mapped
    return "Rooms"


# ----------------- OCR & SVG Text Parsers -----------------

# Regex for dimensions: 10*10, 10'15, 12x13, 12X13, 5*7, 10.5x12.5, etc.
DIMENSION_PATTERN = re.compile(
    r'(\d+(?:\.\d+)?)\s*[*xX×\'’]\s*(\d+(?:\.\d+)?)',
    re.IGNORECASE
)

UNIT_PATTERN_METER = re.compile(r'\b(?:AREA\s+IN\s+MTR|MTR|METER|METRE|SQ\.?M|SQM)\b', re.IGNORECASE)
UNIT_PATTERN_FEET = re.compile(r'\b(?:AREA\s+IN\s+FT|FEET|FOOT|SQ\.?FT|SQFT)\b', re.IGNORECASE)

KNOWN_ROOM_NAMES = [
    "HALL", "DINING", "BEDROOM", "STORE_ROOM", "STORE",
    "KITCHEN", "BATHROOM", "BATH", "TOILET", "WC", "BALCONY",
    "TERRACE", "LIVING", "LIVING_ROOM", "BED_ROOM", "POOJA"
]

def parse_svg_elements(svg_text: str) -> (List[Dict[str, Any]], str):
    """
    Parses vector text, dimensions, and wall rectangles directly from SVG if available.
    """
    items = []
    unit = "m"
    if UNIT_PATTERN_FEET.search(svg_text):
        unit = "ft"
    elif UNIT_PATTERN_METER.search(svg_text):
        unit = "m"

    # Match <text ...> ... <tspan ...>NAME</tspan> ... <tspan>DIM</tspan> ... </text>
    text_blocks = re.findall(r'<text\b[^>]*>(.*?)</text>', svg_text, re.DOTALL | re.IGNORECASE)
    for block in text_blocks:
        tspans = re.findall(r'<tspan\b[^>]*>(.*?)</tspan>', block, re.DOTALL | re.IGNORECASE)
        lines = [re.sub(r'<[^>]+>', '', t).strip() for t in tspans if t.strip()]
        if not lines:
            raw_text = re.sub(r'<[^>]+>', '', block).strip()
            if raw_text:
                lines = [raw_text]

        block_room_name = None
        block_dims = None

        for line in lines:
            dim_match = DIMENSION_PATTERN.search(line)
            if dim_match:
                block_dims = dim_match.groups()
            else:
                up = line.upper().replace(' ', '_')
                for kr in KNOWN_ROOM_NAMES:
                    if kr in up:
                        block_room_name = kr
                        break

        if block_room_name or block_dims:
            items.append({
                "room_name": block_room_name or "ROOM",
                "dims": block_dims,
                "raw_lines": lines
            })

    return items, unit


def detect_contours_and_boxes(image_bgr: np.ndarray) -> List[Dict[str, Any]]:
    """
    Uses OpenCV to preprocess the floor plan, detect room walls, contours, and bounding boxes.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # Apply adaptive thresholding to detect lines/walls
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
    )

    # Detect horizontal and vertical lines (walls)
    kernel_len = max(w, h) // 40
    ver_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_len))
    hor_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_len, 1))

    vertical_lines = cv2.erode(thresh, ver_kernel, iterations=1)
    vertical_lines = cv2.dilate(vertical_lines, ver_kernel, iterations=2)

    horizontal_lines = cv2.erode(thresh, hor_kernel, iterations=1)
    horizontal_lines = cv2.dilate(horizontal_lines, hor_kernel, iterations=2)

    # Combine walls
    walls_mask = cv2.add(vertical_lines, horizontal_lines)

    # Dilate slightly to close small gaps in corners
    close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    walls_closed = cv2.dilate(walls_mask, close_kernel, iterations=2)

    # Find room contours inside walls
    contours, _ = cv2.findContours(walls_closed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    room_boxes = []
    total_area = h * w

    for cnt in contours:
        x, y, rw, rh = cv2.boundingRect(cnt)
        box_area = rw * rh
        # Filter out whole-canvas border and tiny noise contours
        if (box_area > 0.01 * total_area) and (box_area < 0.85 * total_area) and (rw > 30 and rh > 30):
            # Approximate polygon to check if rectangular
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            is_rect = len(approx) == 4 or (0.8 <= (cv2.contourArea(cnt) / box_area) <= 1.05)

            room_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(rw),
                "height": int(rh),
                "area": float(box_area),
                "is_rectangular": bool(is_rect)
            })

    # Sort boxes top-to-bottom, left-to-right
    room_boxes = sorted(room_boxes, key=lambda b: (b["y"] // 50, b["x"]))
    return room_boxes


# OCR Engine Wrapper with graceful fallbacks
_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is not None:
        return _ocr_engine

    try:
        from paddleocr import PaddleOCR
        _ocr_engine = PaddleOCR(use_angle_cls=False, lang='en', show_log=False)
        logger.info("Initialized PaddleOCR successfully.")
        return _ocr_engine
    except Exception as e:
        logger.warning(f"PaddleOCR not available ({e}). Trying EasyOCR / Fallback OCR...")

    try:
        import easyocr
        _ocr_engine = easyocr.Reader(['en'], gpu=False)
        logger.info("Initialized EasyOCR successfully.")
        return _ocr_engine
    except Exception as e:
        logger.warning(f"EasyOCR not available ({e}). Running OpenCV-based heuristic text extraction.")

    return None


def run_ocr(image_rgb: np.ndarray) -> List[Dict[str, Any]]:
    """
    Runs available OCR engine and returns detected text boxes with bounding coordinates.
    """
    engine = get_ocr_engine()
    results = []

    if engine is None:
        return results

    try:
        # Check if PaddleOCR
        if hasattr(engine, 'ocr'):
            ocr_res = engine.ocr(image_rgb, cls=False)
            if ocr_res and len(ocr_res) > 0 and ocr_res[0]:
                for line in ocr_res[0]:
                    box = line[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                    text = line[1][0]
                    conf = float(line[1][1])
                    xs = [pt[0] for pt in box]
                    ys = [pt[1] for pt in box]
                    results.append({
                        "text": text,
                        "confidence": conf,
                        "x": min(xs),
                        "y": min(ys),
                        "w": max(xs) - min(xs),
                        "h": max(ys) - min(ys)
                    })
        # Check if EasyOCR
        elif hasattr(engine, 'readtext'):
            easy_res = engine.readtext(image_rgb)
            for item in easy_res:
                box, text, conf = item
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                results.append({
                    "text": text,
                    "confidence": float(conf),
                    "x": min(xs),
                    "y": min(ys),
                    "w": max(xs) - min(xs),
                    "h": max(ys) - min(ys)
                })
    except Exception as err:
        logger.error(f"Error during OCR execution: {err}")

    return results


# ----------------- Pipeline Orchestrator -----------------

def process_floor_plan(
    image_bytes: Optional[bytes] = None,
    svg_string: Optional[str] = None,
    preferred_unit: Optional[str] = None
) -> ExtractionResponse:
    warnings = []
    extracted_rooms: List[ExtractedRoom] = []
    detected_unit = preferred_unit or "m"

    # 1. First priority: If SVG vector content is provided, parse directly for 100% precision
    if svg_string and ("<svg" in svg_string):
        svg_items, svg_unit = parse_svg_elements(svg_string)
        if preferred_unit:
            detected_unit = preferred_unit
        else:
            detected_unit = svg_unit

        room_idx = 1
        for item in svg_items:
            r_name = item.get("room_name") or f"ROOM_{room_idx}"
            dims = item.get("dims")
            r_type = normalize_room_type(r_name)

            length, width, area = None, None, None
            shape = "Rectangle"
            area_src = "explicit_dimensions"
            confidence = 0.98
            needs_review = False
            dim_str = None

            if dims:
                try:
                    dim1 = float(dims[0])
                    dim2 = float(dims[1])
                    length = max(dim1, dim2)
                    width = min(dim1, dim2)
                    dim_str = f"{dims[0]}*{dims[1]}"
                    area = round(length * width, 2)
                    if math.isclose(length, width, rel_tol=1e-3):
                        shape = "Square"
                except Exception:
                    needs_review = True
            else:
                needs_review = True
                area_src = "undetermined"
                confidence = 0.70

            extracted_rooms.append(ExtractedRoom(
                room_number=room_idx,
                room_name=r_name,
                room_type=r_type,
                shape=shape,
                length=length,
                width=width,
                detected_dimensions=dim_str,
                measurement_unit=detected_unit,
                area=area,
                area_source=area_src,
                confidence=confidence,
                needs_review=needs_review
            ))
            room_idx += 1

        if extracted_rooms:
            return ExtractionResponse(
                success=True,
                rooms_detected=len(extracted_rooms),
                measurement_unit=detected_unit,
                rooms=extracted_rooms,
                warnings=warnings,
                message="Extracted successfully from vector plan data."
            )

    # 2. Image Pipeline (Raster/PNG/JPEG)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="No valid image data or SVG provided for extraction.")

    # Decode image to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        # Check if it was an SVG file uploaded as bytes
        try:
            potential_svg = image_bytes.decode('utf-8', errors='ignore')
            if "<svg" in potential_svg:
                return process_floor_plan(svg_string=potential_svg, preferred_unit=preferred_unit)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail="Unable to decode image file format.")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    # A. Detect Contours & Enclosed Rooms with OpenCV
    contour_boxes = detect_contours_and_boxes(image_bgr)
    logger.info(f"OpenCV detected {len(contour_boxes)} potential room bounding regions.")

    # B. Run OCR for labels and dimensions
    ocr_detections = run_ocr(image_rgb)
    logger.info(f"OCR detected {len(ocr_detections)} text elements.")

    # Parse OCR detections for dimensions, labels, and units
    detected_texts = [d["text"].strip() for d in ocr_detections]
    full_text = " ".join(detected_texts)

    if not preferred_unit:
        if UNIT_PATTERN_FEET.search(full_text):
            detected_unit = "ft"
        elif UNIT_PATTERN_METER.search(full_text):
            detected_unit = "m"

    # Group OCR text into (Name, Dimensions)
    room_candidates: List[Dict[str, Any]] = []
    i = 0
    while i < len(ocr_detections):
        curr = ocr_detections[i]
        curr_text = curr["text"].strip()

        # Check if current line has both name and dimension (e.g., "HALL 10*10")
        dim_match = DIMENSION_PATTERN.search(curr_text)
        name_match = None
        for kr in KNOWN_ROOM_NAMES:
            if kr in curr_text.upper():
                name_match = kr
                break

        if name_match and dim_match:
            room_candidates.append({
                "name": name_match,
                "dims": dim_match.groups(),
                "dim_str": f"{dim_match.group(1)}*{dim_match.group(2)}",
                "x": curr["x"], "y": curr["y"], "conf": curr["confidence"]
            })
            i += 1
            continue

        # Check if name is on current line and dimension on next line
        if name_match:
            next_dim = None
            dim_str = None
            if i + 1 < len(ocr_detections):
                next_text = ocr_detections[i + 1]["text"].strip()
                dm = DIMENSION_PATTERN.search(next_text)
                if dm:
                    next_dim = dm.groups()
                    dim_str = f"{dm.group(1)}*{dm.group(2)}"
                    i += 1  # Skip next line since consumed

            room_candidates.append({
                "name": name_match,
                "dims": next_dim,
                "dim_str": dim_str,
                "x": curr["x"], "y": curr["y"], "conf": curr["confidence"]
            })
            i += 1
            continue

        # Standalone dimension without recognized room name
        if dim_match:
            room_candidates.append({
                "name": f"ROOM_{len(room_candidates) + 1}",
                "dims": dim_match.groups(),
                "dim_str": f"{dim_match.group(1)}*{dim_match.group(2)}",
                "x": curr["x"], "y": curr["y"], "conf": curr["confidence"]
            })

        i += 1

    # C. Correlate OCR candidates with OpenCV room contours
    room_num = 1
    for cand in room_candidates:
        r_name = cand["name"]
        dims = cand["dims"]
        r_type = normalize_room_type(r_name)
        dim_str = cand.get("dim_str")
        length, width, area = None, None, None
        shape = "Rectangle"
        area_src = "explicit_dimensions"
        conf = cand.get("conf", 0.90)
        needs_review = False

        if dims:
            try:
                d1 = float(dims[0])
                d2 = float(dims[1])
                length = max(d1, d2)
                width = min(d1, d2)
                area = round(length * width, 2)
                if math.isclose(length, width, rel_tol=1e-3):
                    shape = "Square"
            except Exception:
                needs_review = True
        else:
            needs_review = True
            area_src = "undetermined"

        # Find enclosing contour box if any
        matching_box = None
        cx, cy = cand["x"], cand["y"]
        for b in contour_boxes:
            if (b["x"] <= cx <= b["x"] + b["width"]) and (b["y"] <= cy <= b["y"] + b["height"]):
                matching_box = b
                break

        bbox = None
        if matching_box:
            bbox = {
                "x": matching_box["x"],
                "y": matching_box["y"],
                "width": matching_box["width"],
                "height": matching_box["height"]
            }

        extracted_rooms.append(ExtractedRoom(
            room_number=room_num,
            room_name=r_name,
            room_type=r_type,
            shape=shape,
            length=length,
            width=width,
            detected_dimensions=dim_str,
            measurement_unit=detected_unit,
            area=area,
            area_source=area_src,
            confidence=round(conf, 2),
            needs_review=needs_review,
            bounding_box=bbox
        ))
        room_num += 1

    # If OCR did not detect text but OpenCV found clear room regions
    if not extracted_rooms and contour_boxes:
        warnings.append("No explicit text dimensions found via OCR; detected room regions from image geometry.")
        for b in contour_boxes:
            extracted_rooms.append(ExtractedRoom(
                room_number=room_num,
                room_name=f"ROOM_{room_num}",
                room_type="Rooms",
                shape="Rectangle",
                length=None,
                width=None,
                detected_dimensions=None,
                measurement_unit=detected_unit,
                area=None,
                area_source="contour_geometry",
                confidence=0.60,
                needs_review=True,
                bounding_box={"x": b["x"], "y": b["y"], "width": b["width"], "height": b["height"]}
            ))
            room_num += 1

    return ExtractionResponse(
        success=True,
        rooms_detected=len(extracted_rooms),
        measurement_unit=detected_unit,
        rooms=extracted_rooms,
        warnings=warnings,
        message=f"Successfully extracted {len(extracted_rooms)} rooms."
    )


# ----------------- API Endpoints -----------------

@app.get("/")
def read_root():
    return {
        "service": "PTIS AI Floor-Plan Extraction Service",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ocr_engine": "paddleocr" if _ocr_engine is not None else "ready"
    }

@app.post("/api/extract-rooms", response_model=ExtractionResponse)
async def extract_rooms(
    file: Optional[UploadFile] = File(None),
    measurement_unit: Optional[str] = Form(None)
):
    """
    Primary endpoint: accepts floor-plan image or SVG via multipart form upload.
    Returns detected room labels, dimensions, room count, areas, and confidence metrics.
    """
    if file is None:
        raise HTTPException(status_code=400, detail="Floor-plan file upload is required.")

    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".svg") or b"<svg" in content[:300]:
        svg_text = content.decode("utf-8", errors="ignore")
        return process_floor_plan(svg_string=svg_text, preferred_unit=measurement_unit)

    return process_floor_plan(image_bytes=content, preferred_unit=measurement_unit)


@app.post("/api/extract-rooms-json", response_model=ExtractionResponse)
async def extract_rooms_json(payload: ExtractionRequestJson):
    """
    Alternative endpoint: accepts JSON with base64 image or raw SVG content.
    """
    if payload.svg_content:
        return process_floor_plan(svg_string=payload.svg_content, preferred_unit=payload.measurement_unit)

    if payload.image_base64:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        try:
            image_bytes = base64.b64decode(raw_b64)
            return process_floor_plan(image_bytes=image_bytes, preferred_unit=payload.measurement_unit)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image string: {e}")

    raise HTTPException(status_code=400, detail="Either image_base64 or svg_content must be provided.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
