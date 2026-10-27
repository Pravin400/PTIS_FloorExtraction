import os
import io
import re
import math
import json
import base64
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("floor-plan-extraction")

app = FastAPI(
    title="PTIS AI Floor-Plan Extraction Service",
    description="Multimodal AI extraction service for detecting rooms, boundaries, labels, and dimensions from CAD drawings and phone-captured floor plan photos.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Configuration & Keys -----------------

def get_gemini_config() -> Dict[str, str]:
    """
    Retrieves Gemini Vision API keys and model configuration from:
    1. Environment variables
    2. ../ntis-platform-dev/src/Presentation/NtisPlatform.Api/appsettings.json
    3. Production defaults
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    fallback_key = os.environ.get("GEMINI_FALLBACK_API_KEY")
    model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

    if not api_key or not fallback_key:
        appsettings_paths = [
            Path(__file__).parent.parent / "ntis-platform-dev" / "src" / "Presentation" / "NtisPlatform.Api" / "appsettings.json",
            Path(__file__).parent / "appsettings.json"
        ]
        for p in appsettings_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        cfg = json.load(f)
                        gemini_section = cfg.get("Gemini", {})
                        if not api_key:
                            api_key = gemini_section.get("ApiKey")
                        if not fallback_key:
                            fallback_key = gemini_section.get("FallbackApiKey")
                        if not model:
                            model = gemini_section.get("Model", "gemini-3.5-flash-lite")
                        break
                except Exception as ex:
                    logger.warning(f"Could not load Gemini config from {p}: {ex}")

    return {
        "api_key": api_key or "",
        "fallback_key": fallback_key or "",
        "model": model or "gemini-3.5-flash-lite",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/models/"
    }


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
    area_source: str = "explicit_dimensions"  # explicit_dimensions | ai_vision | contour_geometry | estimated
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
    "BED": "Bedroom",
    "MASTER_BEDROOM": "Bedroom",
    "STORE": "Store Room",
    "STORE_ROOM": "Store Room",
    "KITCHEN": "Kitchen",
    "KIT": "Kitchen",
    "BATH": "Bathroom",
    "BATHROOM": "Bathroom",
    "B+W": "Bathroom",
    "B+WC": "Bathroom",
    "B": "Bathroom",
    "TOILET": "Toilet",
    "WC": "Toilet",
    "W": "Toilet",
    "BALCONY": "Balcony",
    "GALLERY": "Balcony",
    "GALL": "Balcony",
    "TERRACE": "Terrace",
    "PASSAGE": "Rooms",
    "PASS": "Rooms",
    "POOJA": "Rooms",
    "OFFICE": "Rooms",
    "ATM": "Rooms",
    "GAB": "Rooms",
    "GAS/MAS": "Rooms",
    "ROOM": "Rooms",
    "CLOSE": "Rooms",
    "CB": "Rooms",
}

def normalize_room_type(name: str) -> str:
    clean = re.sub(r'[^A-Za-z0-9_]', '', name.strip().upper())
    for key, mapped in ROOM_TYPE_MAPPINGS.items():
        if key == clean or key in clean:
            return mapped
    return "Rooms"


# ----------------- OCR & SVG Text Parsers -----------------

DIMENSION_PATTERN = re.compile(
    r'(\d+(?:\.\d+)?)\s*[*xX×\'’]\s*(\d+(?:\.\d+)?)',
    re.IGNORECASE
)

UNIT_PATTERN_METER = re.compile(r'\b(?:AREA\s+IN\s+MTR|MTR|METER|METRE|SQ\.?M|SQM)\b', re.IGNORECASE)
UNIT_PATTERN_FEET = re.compile(r'\b(?:AREA\s+IN\s+FT|FEET|FOOT|SQ\.?FT|SQFT)\b', re.IGNORECASE)

KNOWN_ROOM_NAMES = [
    "HALL", "DINING", "BEDROOM", "BED", "STORE_ROOM", "STORE",
    "KITCHEN", "KIT", "BATHROOM", "BATH", "B+W", "B", "TOILET", "WC", "W", "BALCONY",
    "GALL", "TERRACE", "LIVING", "LIVING_ROOM", "BED_ROOM", "POOJA", "PASS", "ATM", "GAB"
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


# ----------------- Multimodal AI Vision Extraction -----------------

VISION_PROMPT = """Analyze this architectural floor plan image.
Note: The image may be a clean digital CAD drawing, an architectural blueprint, or a photo captured by a mobile phone from a computer monitor screen (which may exhibit moire pattern, screen glare, green CAD text, or camera tilt).

Carefully identify the CAD floor plan area and extract all distinct rooms, spaces, and compartments (e.g. HALL, BEDROOM / BED, KITCHEN / KIT, BATH / B, TOILET / WC / W, BATH+WC / B+W, PASSAGE / PASS, BALCONY / GALLERY / GALL, TERRACE, OFFICE, ATM, GAB, GAS/MAS, etc.).

For each room/space:
1. Extract the room name/label as written in the CAD plan.
2. Extract the length and width dimensions (in meters or feet as indicated by the plan, e.g. from '(AREA IN MTR)' -> 'm').
3. If dimensions are shown in format 'Length X Width' (e.g. '3.0 X 5.0' or '2.8 X 2.0'):
   - length = max(dim1, dim2)
   - width = min(dim1, dim2)
   - area = round(length * width, 2)
   - detected_dimensions = 'Length*Width' (e.g. '5.0*3.0')
4. If a room has single wall dimension tags or irregular shape, extract whatever dimensions are visible. If dimensions are not listed, set length, width, area to null.
5. Identify the measurement unit: 'm' (if 'AREA IN MTR' or metric) or 'ft'. Default to 'm'.

Return ONLY valid JSON matching this schema:
{
  "rooms_detected": <total count of rooms/spaces found>,
  "measurement_unit": "m",
  "rooms": [
    {
      "room_number": 1,
      "room_name": "<exact label, e.g. HALL, BED, KIT, B, W, B+W, etc.>",
      "room_type": "<Hall|Bedroom|Kitchen|Bathroom|Toilet|Rooms|Terrace|Balcony>",
      "shape": "Rectangle",
      "length": <float or null>,
      "width": <float or null>,
      "detected_dimensions": "<string, e.g. 5.0*3.0 or null>",
      "area": <float or null>,
      "confidence": 0.95,
      "needs_review": false
    }
  ]
}
"""

def extract_rooms_with_vision(image_bytes: bytes, preferred_unit: Optional[str] = None) -> Optional[ExtractionResponse]:
    """
    Uses Gemini Multimodal Vision API to parse floor plans, especially phone-captured screen photos.
    Automatically rotates through primary and fallback API keys.
    """
    # Optimize image resolution (max 1600px) to ensure fast transmission and prompt response
    try:
        from PIL import Image as PILImage
        img = PILImage.open(io.BytesIO(image_bytes))
        max_dim = 1600
        if max(img.width, img.height) > max_dim:
            ratio = max_dim / float(max(img.width, img.height))
            new_w = int(img.width * ratio)
            new_h = int(img.height * ratio)
            img = img.resize((new_w, new_h), PILImage.Resampling.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=88)
            image_bytes = buf.getvalue()
    except Exception as ex:
        logger.debug(f"Image resize skipped: {ex}")

    # Base64 encode image
    b64_img = base64.b64encode(image_bytes).decode("utf-8")

    # Detect mime type from header
    mime_type = "image/jpeg"
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        mime_type = "image/png"
    elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
        mime_type = "image/webp"

    payload = {
        "contents": [{
            "parts": [
                {"text": VISION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": b64_img}}
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    for key_idx, key in enumerate(keys):
        if not key:
            continue
        url = f"{cfg['base_url']}{cfg['model']}:generateContent?key={key}"
        try:
            logger.info(f"Sending floor plan to Gemini Vision ({cfg['model']}, key #{key_idx + 1})...")
            resp = requests.post(url, json=payload, timeout=28)
            if resp.status_code == 200:
                resp_json = resp.json()
                candidates = resp_json.get("candidates", [])
                if candidates and candidates[0].get("content", {}).get("parts"):
                    raw_text = candidates[0]["content"]["parts"][0].get("text", "").strip()
                    parsed = json.loads(raw_text)

                    unit = preferred_unit or parsed.get("measurement_unit") or "m"
                    rooms_list = []
                    raw_rooms = parsed.get("rooms", [])

                    for idx, r in enumerate(raw_rooms, start=1):
                        r_name = str(r.get("room_name") or f"ROOM_{idx}").strip()
                        r_type = r.get("room_type") or normalize_room_type(r_name)

                        len_val = r.get("length")
                        wid_val = r.get("width")
                        area_val = r.get("area")
                        dim_str = r.get("detected_dimensions")

                        try:
                            l = float(len_val) if len_val is not None else None
                            w = float(wid_val) if wid_val is not None else None
                            if l is not None and w is not None:
                                length = max(l, w)
                                width = min(l, w)
                                area = round(length * width, 2)
                                shape = "Square" if math.isclose(length, width, rel_tol=1e-3) else "Rectangle"
                                dim_str = dim_str or f"{length}*{width}"
                            else:
                                length, width = l, w
                                area = float(area_val) if area_val is not None else None
                                shape = r.get("shape", "Rectangle")
                        except Exception:
                            length, width, area = None, None, None
                            shape = "Rectangle"

                        rooms_list.append(ExtractedRoom(
                            room_number=idx,
                            room_name=r_name,
                            room_type=r_type,
                            shape=shape,
                            length=length,
                            width=width,
                            detected_dimensions=dim_str,
                            measurement_unit=unit,
                            area=area,
                            area_source="ai_vision",
                            confidence=float(r.get("confidence", 0.95)),
                            needs_review=bool(r.get("needs_review", False))
                        ))

                    total_detected = len(rooms_list)
                    logger.info(f"Gemini Vision successfully extracted {total_detected} rooms.")
                    return ExtractionResponse(
                        success=True,
                        rooms_detected=total_detected,
                        measurement_unit=unit,
                        rooms=rooms_list,
                        message=f"AI Vision extracted {total_detected} rooms successfully from floor plan."
                    )
            else:
                logger.warning(f"Gemini Vision key #{key_idx + 1} returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"Error calling Gemini Vision with key #{key_idx + 1}: {e}")

    return None


# ----------------- Local RapidOCR Fallback Engine -----------------

_rapid_ocr = None

def get_rapid_ocr_engine():
    global _rapid_ocr
    if _rapid_ocr is not None:
        return _rapid_ocr
    try:
        from rapidocr_onnxruntime import RapidOCR
        _rapid_ocr = RapidOCR()
        logger.info("Initialized RapidOCR successfully.")
        return _rapid_ocr
    except Exception as e:
        logger.warning(f"RapidOCR not available: {e}")
        return None


def run_local_ocr(image_rgb: np.ndarray) -> List[Dict[str, Any]]:
    """
    Runs RapidOCR with image preprocessing for green CAD text.
    """
    engine = get_rapid_ocr_engine()
    if engine is None:
        return []

    results = []
    try:
        # Run 1: On standard RGB image
        ocr_res, _ = engine(image_rgb)
        if ocr_res:
            for item in ocr_res:
                box, text, conf = item[0], item[1], item[2]
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                results.append({
                    "text": text,
                    "confidence": float(conf),
                    "x": int(min(xs)),
                    "y": int(min(ys)),
                    "w": int(max(xs) - min(xs)),
                    "h": int(max(ys) - min(ys))
                })

        # Run 2: If few results, enhance green CAD text
        if len(results) < 2:
            hsv = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2HSV)
            # CAD green text mask
            lower_green = np.array([30, 40, 40])
            upper_green = np.array([90, 255, 255])
            mask = cv2.inRange(hsv, lower_green, upper_green)
            green_boosted = cv2.bitwise_and(image_rgb, image_rgb, mask=mask)
            green_ocr, _ = engine(green_boosted)
            if green_ocr:
                for item in green_ocr:
                    box, text, conf = item[0], item[1], item[2]
                    xs = [pt[0] for pt in box]
                    ys = [pt[1] for pt in box]
                    results.append({
                        "text": text,
                        "confidence": float(conf),
                        "x": int(min(xs)),
                        "y": int(min(ys)),
                        "w": int(max(xs) - min(xs)),
                        "h": int(max(ys) - min(ys))
                    })
    except Exception as err:
        logger.error(f"Error during RapidOCR execution: {err}")

    return results


def detect_contours_and_boxes(image_bgr: np.ndarray) -> List[Dict[str, Any]]:
    """
    Uses OpenCV to preprocess floor plan and detect enclosed room regions.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
    )

    kernel_len = max(w, h) // 40
    ver_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_len))
    hor_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_len, 1))

    vertical_lines = cv2.erode(thresh, ver_kernel, iterations=1)
    vertical_lines = cv2.dilate(vertical_lines, ver_kernel, iterations=2)

    horizontal_lines = cv2.erode(thresh, hor_kernel, iterations=1)
    horizontal_lines = cv2.dilate(horizontal_lines, hor_kernel, iterations=2)

    walls_mask = cv2.add(vertical_lines, horizontal_lines)
    close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    walls_closed = cv2.dilate(walls_mask, close_kernel, iterations=2)

    contours, _ = cv2.findContours(walls_closed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    room_boxes = []
    total_area = h * w

    for cnt in contours:
        x, y, rw, rh = cv2.boundingRect(cnt)
        box_area = rw * rh
        if (box_area > 0.01 * total_area) and (box_area < 0.85 * total_area) and (rw > 30 and rh > 30):
            room_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(rw),
                "height": int(rh),
                "area": float(box_area)
            })

    room_boxes = sorted(room_boxes, key=lambda b: (b["y"] // 50, b["x"]))
    return room_boxes


# ----------------- Pipeline Orchestrator -----------------

def process_floor_plan(
    image_bytes: Optional[bytes] = None,
    svg_string: Optional[str] = None,
    preferred_unit: Optional[str] = None
) -> ExtractionResponse:
    warnings = []
    extracted_rooms: List[ExtractedRoom] = []
    detected_unit = preferred_unit or "m"

    # 1. First priority: Direct SVG vector parsing
    if svg_string and ("<svg" in svg_string):
        svg_items, svg_unit = parse_svg_elements(svg_string)
        detected_unit = preferred_unit or svg_unit

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

    # 2. Image Pipeline (Raster/JPEG/PNG/phone photo)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="No valid image data or SVG provided for extraction.")

    # Check if raw bytes was actually an SVG
    try:
        potential_svg = image_bytes.decode('utf-8', errors='ignore')
        if "<svg" in potential_svg:
            return process_floor_plan(svg_string=potential_svg, preferred_unit=preferred_unit)
    except Exception:
        pass

    # A. PRIMARY: Try Multimodal AI Vision
    # Handles phone-captured photos, screen moire patterns, green CAD text, and angles
    vision_response = extract_rooms_with_vision(image_bytes, preferred_unit=preferred_unit)
    if vision_response and vision_response.rooms_detected > 0:
        return vision_response

    # B. SECONDARY FALLBACK: Local RapidOCR + OpenCV
    logger.info("Falling back to local RapidOCR + OpenCV extraction...")
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise HTTPException(status_code=400, detail="Unable to decode image file format.")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    contour_boxes = detect_contours_and_boxes(image_bgr)
    ocr_detections = run_local_ocr(image_rgb)
    logger.info(f"Local RapidOCR detected {len(ocr_detections)} text elements.")

    detected_texts = [d["text"].strip() for d in ocr_detections]
    full_text = " ".join(detected_texts)

    if not preferred_unit:
        if UNIT_PATTERN_FEET.search(full_text):
            detected_unit = "ft"
        elif UNIT_PATTERN_METER.search(full_text):
            detected_unit = "m"

    room_candidates: List[Dict[str, Any]] = []
    i = 0
    while i < len(ocr_detections):
        curr = ocr_detections[i]
        curr_text = curr["text"].strip()

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

        if name_match:
            next_dim = None
            dim_str = None
            if i + 1 < len(ocr_detections):
                next_text = ocr_detections[i + 1]["text"].strip()
                dm = DIMENSION_PATTERN.search(next_text)
                if dm:
                    next_dim = dm.groups()
                    dim_str = f"{dm.group(1)}*{dm.group(2)}"
                    i += 1

            room_candidates.append({
                "name": name_match,
                "dims": next_dim,
                "dim_str": dim_str,
                "x": curr["x"], "y": curr["y"], "conf": curr["confidence"]
            })
            i += 1
            continue

        if dim_match:
            room_candidates.append({
                "name": f"ROOM_{len(room_candidates) + 1}",
                "dims": dim_match.groups(),
                "dim_str": f"{dim_match.group(1)}*{dim_match.group(2)}",
                "x": curr["x"], "y": curr["y"], "conf": curr["confidence"]
            })

        i += 1

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

    if not extracted_rooms and contour_boxes:
        warnings.append("No explicit text dimensions found; detected room regions from image geometry.")
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
        message=f"Extracted {len(extracted_rooms)} rooms via local fallback engine."
    )


# ----------------- API Endpoints -----------------

@app.get("/")
def read_root():
    return {
        "service": "PTIS AI Floor-Plan Extraction Service",
        "status": "online",
        "version": "2.0.0",
        "engines": ["gemini-3.5-flash-lite", "rapidocr-onnxruntime", "opencv", "svg-vector"],
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    cfg = get_gemini_config()
    return {
        "status": "healthy",
        "vision_ai": "active" if bool(cfg.get("api_key")) else "unconfigured",
        "ocr_engine": "rapidocr"
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
