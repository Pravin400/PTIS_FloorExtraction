import os
import sys
import unittest

# Add parent directory to path so we can import main
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

from main import process_floor_plan

class TestFloorPlanExtraction(unittest.TestCase):
    def setUp(self):
        self.tests_dir = os.path.dirname(os.path.abspath(__file__))
        self.svg_path = os.path.join(self.tests_dir, "test_plan.svg")
        self.png_path = os.path.join(self.tests_dir, "test_plan.png")

    def test_extract_from_svg(self):
        """Test extraction directly from floor plan vector SVG data."""
        self.assertTrue(os.path.exists(self.svg_path), "test_plan.svg must exist")
        with open(self.svg_path, "r", encoding="utf-8") as f:
            svg_content = f.read()

        result = process_floor_plan(svg_string=svg_content)
        self.assertTrue(result.success)
        self.assertEqual(result.rooms_detected, 4)
        self.assertEqual(result.measurement_unit, "m")

        room_names = [r.room_name for r in result.rooms]
        self.assertIn("HALL", room_names)
        self.assertIn("DINING", room_names)
        self.assertIn("BEDROOM", room_names)
        self.assertIn("STORE_ROOM", room_names)

        # Check dimensions & areas
        hall = next(r for r in result.rooms if r.room_name == "HALL")
        self.assertEqual(hall.shape, "Square")
        self.assertEqual(hall.length, 10.0)
        self.assertEqual(hall.width, 10.0)
        self.assertEqual(hall.area, 100.0)

        dining = next(r for r in result.rooms if r.room_name == "DINING")
        self.assertEqual(dining.shape, "Rectangle")
        self.assertEqual(dining.length, 15.0)
        self.assertEqual(dining.width, 10.0)
        self.assertEqual(dining.area, 150.0)

        bedroom = next(r for r in result.rooms if r.room_name == "BEDROOM")
        self.assertEqual(bedroom.shape, "Rectangle")
        self.assertEqual(bedroom.length, 13.0)
        self.assertEqual(bedroom.width, 12.0)
        self.assertEqual(bedroom.area, 156.0)

        store = next(r for r in result.rooms if r.room_name == "STORE_ROOM")
        self.assertEqual(store.shape, "Rectangle")
        self.assertEqual(store.length, 7.0)
        self.assertEqual(store.width, 5.0)
        self.assertEqual(store.area, 35.0)

        print("\n[SUCCESS] Vector SVG extraction test passed with all 4 rooms identified correctly!")

    def test_extract_from_png(self):
        """Test extraction from floor plan raster image with OpenCV & contour detection."""
        self.assertTrue(os.path.exists(self.png_path), "test_plan.png must exist")
        with open(self.png_path, "rb") as f:
            img_bytes = f.read()

        result = process_floor_plan(image_bytes=img_bytes)
        self.assertTrue(result.success)
        self.assertGreaterEqual(result.rooms_detected, 1)
        print(f"\n[SUCCESS] Raster image extraction test returned {result.rooms_detected} rooms.")

if __name__ == "__main__":
    unittest.main()
