"""Image quality checks: resolution, brightness, contrast, and blur detection."""

from dataclasses import dataclass, asdict
from typing import List, Tuple
import cv2
import numpy as np


@dataclass
class QualityReport:
    is_acceptable: bool
    blur_score: float
    brightness: float
    contrast: float
    resolution: Tuple[int, int]  # (width, height)
    issues: List[str]

    def to_dict(self):
        d = asdict(self)
        d["resolution"] = list(self.resolution)
        return d


def check_image_quality(
    image_bgr: np.ndarray,
    min_res: int = 200,
    blur_threshold: float = 40.0,
    min_brightness: float = 35.0,
    max_brightness: float = 230.0,
    min_contrast: float = 20.0,
) -> QualityReport:
    """
    Evaluates image quality for Rubik's cube sticker detection.
    - Blur: Variance of the Laplacian.
    - Brightness: Mean luminance in grayscale.
    - Contrast: Standard deviation of luminance.
    - Resolution: Min dimensions.
    """
    if image_bgr is None or image_bgr.size == 0:
        return QualityReport(
            is_acceptable=False,
            blur_score=0.0,
            brightness=0.0,
            contrast=0.0,
            resolution=(0, 0),
            issues=["Empty or corrupted image"],
        )

    height, width = image_bgr.shape[:2]
    issues: List[str] = []

    # 1. Resolution check
    if width < min_res or height < min_res:
        issues.append(f"Low resolution: {width}x{height} (minimum {min_res}x{min_res})")

    # Convert to grayscale for metric calculations
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # 2. Blur score (Laplacian variance)
    # Higher variance = sharper edges
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < blur_threshold:
        issues.append(
            f"Image may be blurry (sharpness score {laplacian_var:.1f} < threshold {blur_threshold:.1f})"
        )

    # 3. Brightness check (mean gray level)
    mean_brightness = float(np.mean(gray))
    if mean_brightness < min_brightness:
        issues.append(f"Image is too dark (brightness {mean_brightness:.1f} < {min_brightness:.1f})")
    elif mean_brightness > max_brightness:
        issues.append(f"Image is overexposed (brightness {mean_brightness:.1f} > {max_brightness:.1f})")

    # 4. Contrast check (standard deviation of gray values)
    contrast = float(np.std(gray))
    if contrast < min_contrast:
        issues.append(f"Low contrast ({contrast:.1f} < {min_contrast:.1f})")

    is_acceptable = len(issues) == 0

    return QualityReport(
        is_acceptable=is_acceptable,
        blur_score=round(laplacian_var, 2),
        brightness=round(mean_brightness, 2),
        contrast=round(contrast, 2),
        resolution=(width, height),
        issues=issues,
    )
