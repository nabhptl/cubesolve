"""Unit tests for computer vision pipeline using synthetic images."""

import cv2
import numpy as np
import pytest
from app.cube.constants import FACES, COLORS, COLOR_RGB_REF, DEFAULT_FACE_TO_COLOR
from app.vision.quality import check_image_quality
from app.vision.detector import process_cube_face_image
from app.vision.color_classifier import ColorClassifier
from app.vision.pipeline import VisionPipeline


def create_synthetic_cube_face_image(
    colors_9: list,
    img_size: int = 400,
    border_px: int = 6,
    add_noise: bool = False,
) -> np.ndarray:
    """
    Renders a synthetic 3x3 Rubik's cube face image with black plastic borders.
    colors_9 is a list of 9 color names.
    """
    img = np.zeros((img_size, img_size, 3), dtype=np.uint8)
    # Background (dark table)
    img[:] = (35, 35, 35)

    cube_size = int(img_size * 0.75)
    offset_x = (img_size - cube_size) // 2
    offset_y = (img_size - cube_size) // 2

    # Draw black cube body
    cv2.rectangle(
        img,
        (offset_x, offset_y),
        (offset_x + cube_size, offset_y + cube_size),
        (15, 15, 15),
        -1,
    )

    cell_size = cube_size // 3

    for r in range(3):
        for c in range(3):
            color_name = colors_9[r * 3 + c]
            rgb = COLOR_RGB_REF.get(color_name, (200, 200, 200))
            bgr = (rgb[2], rgb[1], rgb[0])

            x0 = offset_x + c * cell_size + border_px
            y0 = offset_y + r * cell_size + border_px
            x1 = offset_x + (c + 1) * cell_size - border_px
            y1 = offset_y + (r + 1) * cell_size - border_px

            # Draw rounded sticker
            cv2.rectangle(img, (x0, y0), (x1, y1), bgr, -1)

    if add_noise:
        noise = np.random.normal(0, 5, img.shape).astype(np.int16)
        noisy = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return noisy

    return img


def test_quality_check_sharp_vs_blurry():
    # Sharp image
    sharp_img = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.rectangle(sharp_img, (50, 50), (350, 350), (255, 255, 255), -1)
    q_sharp = check_image_quality(sharp_img)
    assert q_sharp.is_acceptable
    assert q_sharp.blur_score > 40.0

    # Blurry image
    blurry_img = cv2.GaussianBlur(sharp_img, (55, 55), 0)
    q_blurry = check_image_quality(blurry_img, blur_threshold=100.0)
    assert q_blurry.blur_score < q_sharp.blur_score


def test_quality_check_brightness():
    # Too dark
    dark_img = np.ones((300, 300, 3), dtype=np.uint8) * 15
    q_dark = check_image_quality(dark_img)
    assert not q_dark.is_acceptable
    assert any("too dark" in issue.lower() for issue in q_dark.issues)

    # Overexposed
    bright_img = np.ones((300, 300, 3), dtype=np.uint8) * 245
    q_bright = check_image_quality(bright_img)
    assert not q_bright.is_acceptable
    assert any("overexposed" in issue.lower() for issue in q_bright.issues)


def test_color_classifier_canonical_colors():
    clf = ColorClassifier()

    for expected_color in COLORS:
        rgb = COLOR_RGB_REF[expected_color]
        bgr = np.uint8([[[rgb[2], rgb[1], rgb[0]]]])
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)[0, 0]
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[0, 0]

        lab_tuple = (float(lab[0]), float(lab[1]), float(lab[2]))
        hsv_tuple = (float(hsv[0]), float(hsv[1]), float(hsv[2]))

        classified_color, confidence, uncertain, _ = clf.classify(lab_tuple, hsv_tuple)
        assert classified_color == expected_color, f"Expected {expected_color}, got {classified_color}"
        assert confidence >= 0.70
        assert not uncertain


def test_single_face_detection_and_classification():
    face_colors = ["white", "yellow", "green", "blue", "red", "orange", "white", "green", "blue"]
    synth_img = create_synthetic_cube_face_image(face_colors)

    result = VisionPipeline.process_single_face(synth_img, face_label="F")
    assert result["face"] == "F"
    assert len(result["stickers"]) == 9
    assert result["quality"]["is_acceptable"]

    detected = result["detected_colors"]
    assert len(detected) == 9
    # Center sticker (index 4) should match face_colors[4]
    assert detected[4] == face_colors[4]


def test_six_face_pipeline_solved_cube():
    # Create 6 synthetic images corresponding to a solved cube
    images = {}
    for face in FACES:
        color = DEFAULT_FACE_TO_COLOR[face]
        images[face] = create_synthetic_cube_face_image([color] * 9)

    pipeline_result = VisionPipeline.process_six_faces(images)
    assert pipeline_result["calibration_used"]
    assert pipeline_result["validation"]["is_valid"]
    assert pipeline_result["uncertain_count"] == 0

    cube_state = pipeline_result["cube_state"]
    for face in FACES:
        expected_color = DEFAULT_FACE_TO_COLOR[face]
        assert all(c == expected_color for c in cube_state[face])
