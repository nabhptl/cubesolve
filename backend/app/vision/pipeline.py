"""End-to-end computer vision processing pipeline for Rubik's Cube photos."""

import base64
from typing import Dict, List, Optional, Tuple, Union
import cv2
import numpy as np

from app.cube.constants import FACES, DEFAULT_FACE_TO_COLOR
from app.cube.state import CubeState
from app.validation.validator import CubeValidator, ValidationResult
from app.vision.quality import check_image_quality, QualityReport
from app.vision.detector import process_cube_face_image, FaceDetectionResult
from app.vision.color_classifier import ColorClassifier


def decode_image_bytes(data: bytes) -> np.ndarray:
    """Decodes raw image bytes (JPEG, PNG, etc.) to BGR numpy array."""
    nparr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image from provided bytes")
    return img


def encode_image_to_base64_jpeg(img_bgr: np.ndarray, quality: int = 85) -> str:
    """Encodes BGR image to base64 JPEG data URL."""
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode(".jpg", img_bgr, encode_params)
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


class VisionPipeline:
    """Orchestrates image quality checks, face detection, color sampling, and calibration."""

    @staticmethod
    def process_single_face(
        image_bgr: np.ndarray,
        face_label: str = "F",
        classifier: Optional[ColorClassifier] = None,
    ) -> Dict:
        """
        Processes a single face photo:
        1. Checks image quality.
        2. Detects cube face and corrects perspective.
        3. Extracts sticker samples.
        4. Classifies sticker colors.
        Returns detailed results including warped preview and confidence scores.
        """
        # Quality check
        quality = check_image_quality(image_bgr)

        # Detect face & sample stickers
        detection = process_cube_face_image(image_bgr)

        clf = classifier or ColorClassifier()

        stickers_data = []
        detected_colors = []

        for s in detection.stickers:
            color, conf, uncertain, all_scores = clf.classify(s.lab, s.hsv)
            detected_colors.append(color)

            # Convert RGB sample to hex for UI display
            rgb_hex = f"#{s.rgb[0]:02x}{s.rgb[1]:02x}{s.rgb[2]:02x}"

            stickers_data.append(
                {
                    "index": s.index,
                    "row": s.row,
                    "col": s.col,
                    "color": color,
                    "confidence": conf,
                    "uncertain": uncertain,
                    "rgb_sample": list(s.rgb),
                    "rgb_hex": rgb_hex,
                    "sample_box": list(s.sample_box),
                }
            )

        # Generate base64 thumbnail of warped face
        warped_preview = encode_image_to_base64_jpeg(detection.warped_image)

        return {
            "face": face_label,
            "detected_colors": detected_colors,
            "stickers": stickers_data,
            "quality": quality.to_dict(),
            "homography_applied": detection.homography_applied,
            "detection_method": detection.detection_method,
            "warped_preview": warped_preview,
        }

    @staticmethod
    def process_six_faces(
        face_images: Dict[str, np.ndarray],
    ) -> Dict:
        """
        Processes all six face photos using two-pass relative color calibration:
        Pass 1: Detect all faces and extract center stickers (index 4) as reference colors.
        Pass 2: Build a calibrated ColorClassifier from centers and classify all 54 stickers.
        Pass 3: Validate the reconstructed 54-sticker state.
        """
        # 1. Quality and initial extraction for each face
        pass1_results: Dict[str, FaceDetectionResult] = {}
        quality_reports: Dict[str, Dict] = {}

        for face in FACES:
            if face in face_images:
                img = face_images[face]
                q = check_image_quality(img)
                quality_reports[face] = q.to_dict()
                det = process_cube_face_image(img)
                pass1_results[face] = det
            else:
                quality_reports[face] = {
                    "is_acceptable": False,
                    "issues": [f"Missing image for face {face}"],
                }

        # 2. Extract center stickers to form relative calibration references
        center_samples: Dict[str, Tuple[Tuple[float, float, float], Tuple[float, float, float]]] = {}
        for face in FACES:
            if face in pass1_results:
                det = pass1_results[face]
                center_sticker = det.stickers[4]  # center sticker
                expected_color = DEFAULT_FACE_TO_COLOR.get(face, "white")
                center_samples[expected_color] = (center_sticker.lab, center_sticker.hsv)

        # Build calibrated classifier if centers found
        calibrated_clf = ColorClassifier.from_center_samples(center_samples)

        # 3. Classify all stickers with calibrated classifier
        faces_output = {}
        cube_faces_colors = {}
        all_stickers_flat = []

        for face in FACES:
            if face in pass1_results:
                det = pass1_results[face]
                stickers_data = []
                face_colors = []

                for s in det.stickers:
                    color, conf, uncertain, _ = calibrated_clf.classify(s.lab, s.hsv)
                    face_colors.append(color)

                    rgb_hex = f"#{s.rgb[0]:02x}{s.rgb[1]:02x}{s.rgb[2]:02x}"
                    s_dict = {
                        "face": face,
                        "index": s.index,
                        "row": s.row,
                        "col": s.col,
                        "color": color,
                        "confidence": conf,
                        "uncertain": uncertain,
                        "rgb_sample": list(s.rgb),
                        "rgb_hex": rgb_hex,
                        "sample_box": list(s.sample_box),
                    }
                    stickers_data.append(s_dict)
                    all_stickers_flat.append(s_dict)

                warped_b64 = encode_image_to_base64_jpeg(det.warped_image)
                faces_output[face] = {
                    "face": face,
                    "detected_colors": face_colors,
                    "stickers": stickers_data,
                    "quality": quality_reports.get(face, {}),
                    "homography_applied": det.homography_applied,
                    "detection_method": det.detection_method,
                    "warped_preview": warped_b64,
                }
                cube_faces_colors[face] = face_colors
            else:
                # Default fallback colors if face image is missing
                fallback_color = DEFAULT_FACE_TO_COLOR[face]
                cube_faces_colors[face] = [fallback_color] * 9

        # 4. Construct CubeState and validate
        cube_state = CubeState(cube_faces_colors)
        validation_result = CubeValidator.validate(cube_state)

        # Count uncertain stickers
        uncertain_count = sum(1 for s in all_stickers_flat if s["uncertain"])

        return {
            "faces": faces_output,
            "cube_state": cube_state.to_dict(),
            "validation": validation_result.to_dict(),
            "uncertain_count": uncertain_count,
            "calibration_used": len(center_samples) == 6,
        }
