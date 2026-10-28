"""Cube face detection, perspective correction, and sticker grid sampling."""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np


@dataclass
class StickerSample:
    index: int
    row: int
    col: int
    bgr: Tuple[int, int, int]
    rgb: Tuple[int, int, int]
    lab: Tuple[float, float, float]
    hsv: Tuple[float, float, float]
    sample_box: Tuple[int, int, int, int]  # x1, y1, x2, y2


@dataclass
class FaceDetectionResult:
    warped_image: np.ndarray  # 300x300 BGR
    homography_applied: bool
    contour_points: Optional[List[Tuple[int, int]]]
    stickers: List[StickerSample]
    detection_method: str


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Order coordinates as: [top-left, top-right, bottom-right, bottom-left].
    pts shape: (4, 2)
    """
    rect = np.zeros((4, 2), dtype="float32")

    # Top-left has the smallest sum (x + y), bottom-right has the largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Top-right has the smallest difference (y - x), bottom-left has the largest difference
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect


def four_point_transform(
    image: np.ndarray,
    pts: np.ndarray,
    target_size: int = 300,
) -> np.ndarray:
    """Warp quadrilateral region in image to a target_size x target_size square."""
    rect = order_points(pts)
    dst = np.array(
        [
            [0, 0],
            [target_size - 1, 0],
            [target_size - 1, target_size - 1],
            [0, target_size - 1],
        ],
        dtype="float32",
    )

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (target_size, target_size))
    return warped


def find_cube_face_quadrilateral(
    image_bgr: np.ndarray,
) -> Optional[np.ndarray]:
    """
    Searches for a 4-point convex polygon bounding the cube face.
    Returns array of 4 points (4, 2) or None if not found.
    """
    h, w = image_bgr.shape[:2]
    total_area = w * h

    # Preprocessing
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    candidates = []

    # Try multiple thresholding strategies
    # 1. Canny edges
    edges = cv2.Canny(blurred, 30, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges_closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # 2. Adaptive threshold
    adaptive = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
    )

    for edge_img in [edges_closed, adaptive]:
        contours, _ = cv2.findContours(
            edge_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Area must be between 10% and 95% of the image
            if area < (0.10 * total_area) or area > (0.95 * total_area):
                continue

            peri = cv2.arcLength(cnt, True)
            # Approximate polygon with progressive epsilon
            for eps in [0.02, 0.03, 0.04]:
                approx = cv2.approxPolyDP(cnt, eps * peri, True)
                if len(approx) == 4 and cv2.isContourConvex(approx):
                    pts = approx.reshape(4, 2).astype("float32")
                    rect = order_points(pts)

                    # Compute widths and heights
                    width_a = np.linalg.norm(rect[2] - rect[3])
                    width_b = np.linalg.norm(rect[1] - rect[0])
                    height_a = np.linalg.norm(rect[1] - rect[2])
                    height_b = np.linalg.norm(rect[0] - rect[3])

                    avg_w = (width_a + width_b) / 2.0
                    avg_h = (height_a + height_b) / 2.0

                    if avg_w > 0 and avg_h > 0:
                        aspect_ratio = avg_w / avg_h
                        if 0.7 <= aspect_ratio <= 1.4:
                            # Score higher for larger area and near-1.0 aspect ratio
                            score = area * (1.0 - abs(1.0 - aspect_ratio))
                            candidates.append((score, pts))
                    break

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return None


def extract_grid_stickers(
    warped_300: np.ndarray,
) -> List[StickerSample]:
    """
    Extracts 9 sticker samples from a normalized 300x300 warped cube face.
    Samples the central 50% of each 100x100 cell to avoid black borders and reflections.
    """
    cell_size = 100
    stickers: List[StickerSample] = []
    idx = 0

    for r in range(3):
        for c in range(3):
            # Cell bounds
            x0 = c * cell_size
            y0 = r * cell_size
            x1 = (c + 1) * cell_size
            y1 = (r + 1) * cell_size

            # Sample central 50% region (25px inset on all sides)
            sample_margin = 25
            sx0 = x0 + sample_margin
            sy0 = y0 + sample_margin
            sx1 = x1 - sample_margin
            sy1 = y1 - sample_margin

            cell_roi = warped_300[sy0:sy1, sx0:sx1]

            # Use median for robustness against specular reflections
            median_b = int(np.median(cell_roi[:, :, 0]))
            median_g = int(np.median(cell_roi[:, :, 1]))
            median_r = int(np.median(cell_roi[:, :, 2]))
            bgr = (median_b, median_g, median_r)
            rgb = (median_r, median_g, median_b)

            # Convert 1x1 pixel to LAB and HSV
            pixel_bgr = np.uint8([[[median_b, median_g, median_r]]])
            pixel_lab = cv2.cvtColor(pixel_bgr, cv2.COLOR_BGR2LAB)[0, 0]
            pixel_hsv = cv2.cvtColor(pixel_bgr, cv2.COLOR_BGR2HSV)[0, 0]

            lab = (float(pixel_lab[0]), float(pixel_lab[1]), float(pixel_lab[2]))
            hsv = (float(pixel_hsv[0]), float(pixel_hsv[1]), float(pixel_hsv[2]))

            stickers.append(
                StickerSample(
                    index=idx,
                    row=r,
                    col=c,
                    bgr=bgr,
                    rgb=rgb,
                    lab=lab,
                    hsv=hsv,
                    sample_box=(sx0, sy0, sx1, sy1),
                )
            )
            idx += 1

    return stickers


def process_cube_face_image(
    image_bgr: np.ndarray,
    target_size: int = 300,
) -> FaceDetectionResult:
    """
    Detects cube face in image, corrects perspective, and samples the 3x3 sticker grid.
    Falls back cleanly to center-framing if no distinct quadrilateral contour is found.
    """
    quad = find_cube_face_quadrilateral(image_bgr)

    if quad is not None:
        warped = four_point_transform(image_bgr, quad, target_size)
        homography_applied = True
        method = "quadrilateral_homography"
        contour_pts = [(int(pt[0]), int(pt[1])) for pt in quad]
    else:
        # Fallback: center crop 70% of image
        h, w = image_bgr.shape[:2]
        crop_pct = 0.70
        ch = int(h * crop_pct)
        cw = int(w * crop_pct)
        # Make crop square
        c_size = min(ch, cw)
        y0 = max(0, (h - c_size) // 2)
        x0 = max(0, (w - c_size) // 2)
        crop = image_bgr[y0 : y0 + c_size, x0 : x0 + c_size]
        warped = cv2.resize(crop, (target_size, target_size), interpolation=cv2.INTER_AREA)
        homography_applied = False
        method = "center_framing_fallback"
        contour_pts = [
            (x0, y0),
            (x0 + c_size, y0),
            (x0 + c_size, y0 + c_size),
            (x0, y0 + c_size),
        ]

    stickers = extract_grid_stickers(warped)

    return FaceDetectionResult(
        warped_image=warped,
        homography_applied=homography_applied,
        contour_points=contour_pts,
        stickers=stickers,
        detection_method=method,
    )
