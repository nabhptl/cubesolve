"""Perceptual color classification using CIELAB and HSV color spaces with relative calibration."""

import math
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
from app.cube.constants import COLORS

# Default reference values in OpenCV 8-bit LAB and HSV spaces
# OpenCV LAB: L in [0, 255], A in [0, 255], B in [0, 255] (128 is neutral 0)
# OpenCV HSV: H in [0, 180], S in [0, 255], V in [0, 255]
DEFAULT_COLOR_PROFILES: Dict[str, Dict[str, Tuple[float, float, float]]] = {
    "white": {
        "lab": (230.0, 128.0, 128.0),
        "hsv": (0.0, 15.0, 230.0),
    },
    "yellow": {
        "lab": (215.0, 115.0, 195.0),
        "hsv": (28.0, 210.0, 240.0),
    },
    "green": {
        "lab": (145.0, 75.0, 160.0),
        "hsv": (65.0, 215.0, 175.0),
    },
    "blue": {
        "lab": (95.0, 140.0, 70.0),
        "hsv": (110.0, 220.0, 160.0),
    },
    "red": {
        "lab": (120.0, 190.0, 165.0),
        "hsv": (2.0, 215.0, 185.0),
    },
    "orange": {
        "lab": (160.0, 165.0, 185.0),
        "hsv": (13.0, 225.0, 230.0),
    },
}


def circular_hue_diff(h1: float, h2: float) -> float:
    """Computes minimum angular difference between two hues in [0, 180]."""
    diff = abs(h1 - h2)
    return min(diff, 180.0 - diff)


def color_distance(
    sample_lab: Tuple[float, float, float],
    sample_hsv: Tuple[float, float, float],
    ref_lab: Tuple[float, float, float],
    ref_hsv: Tuple[float, float, float],
    target_color: str,
) -> float:
    """
    Computes a hybrid perceptual distance between a sample and a reference color.
    Balances CIELAB Euclidean distance with HSV hue/saturation constraints.
    """
    # 1. CIELAB Euclidean distance (Delta E)
    dL = sample_lab[0] - ref_lab[0]
    da = sample_lab[1] - ref_lab[1]
    db = sample_lab[2] - ref_lab[2]
    delta_e = math.sqrt(dL * dL + da * da + db * db)

    # 2. HSV checks
    sample_h, sample_s, sample_v = sample_hsv
    ref_h, ref_s, ref_v = ref_hsv

    penalty = 0.0

    if target_color == "white":
        # White should have low saturation
        if sample_s > 60:
            penalty += (sample_s - 60) * 1.5
        # And reasonably high lightness
        if sample_lab[0] < 140:
            penalty += (140 - sample_lab[0]) * 1.2
    else:
        # Non-white colors should have sufficient saturation
        if sample_s < 45:
            penalty += (45 - sample_s) * 2.0

        # Saturated colors rely heavily on hue distinction
        hue_diff = circular_hue_diff(sample_h, ref_h)

        if target_color in ["red", "orange", "yellow"]:
            # Red vs Orange vs Yellow are critical near each other on the hue circle
            penalty += hue_diff * 1.8
        elif target_color in ["green", "blue"]:
            penalty += hue_diff * 1.2

    return delta_e + penalty


class ColorClassifier:
    """
    Classifies sticker colors using perceptual color space comparisons.
    Supports dynamic relative calibration based on the 6 center stickers.
    """

    def __init__(
        self,
        calibrated_centers: Optional[Dict[str, Dict[str, Tuple[float, float, float]]]] = None,
    ):
        """
        calibrated_centers: optional dict mapping color_name -> {'lab': (l,a,b), 'hsv': (h,s,v)}
        """
        self.profiles = dict(DEFAULT_COLOR_PROFILES)
        if calibrated_centers:
            for color_name, profile in calibrated_centers.items():
                if color_name in self.profiles:
                    self.profiles[color_name] = profile

    @classmethod
    def from_center_samples(
        cls,
        center_samples: Dict[str, Tuple[Tuple[float, float, float], Tuple[float, float, float]]],
    ) -> "ColorClassifier":
        """
        Construct classifier calibrated to measured center stickers.
        center_samples maps color_name -> (lab_tuple, hsv_tuple).
        """
        profiles = {}
        for color_name, (lab, hsv) in center_samples.items():
            profiles[color_name] = {"lab": lab, "hsv": hsv}
        return cls(profiles)

    def classify(
        self,
        sample_lab: Tuple[float, float, float],
        sample_hsv: Tuple[float, float, float],
    ) -> Tuple[str, float, bool, List[Tuple[str, float]]]:
        """
        Classifies a sticker sample.
        Returns:
            best_color: str ("white", "yellow", "green", "blue", "red", "orange")
            confidence: float (0.0 to 1.0)
            uncertain: bool (True if ambiguous)
            scores: list of (color, distance) sorted ascending
        """
        distances: List[Tuple[str, float]] = []

        for color_name in COLORS:
            ref = self.profiles[color_name]
            dist = color_distance(
                sample_lab, sample_hsv, ref["lab"], ref["hsv"], color_name
            )
            distances.append((color_name, dist))

        distances.sort(key=lambda x: x[1])
        best_color, best_dist = distances[0]
        second_color, second_dist = distances[1]

        # Calculate confidence
        # Margin ratio: how much closer best is compared to second best
        gap = second_dist - best_dist
        ratio = best_dist / (second_dist + 1e-5)

        # Scale confidence between 0.40 and 0.98
        if best_dist < 25.0 and gap > 25.0:
            confidence = 0.96
        elif best_dist < 45.0 and gap > 20.0:
            confidence = 0.88
        elif gap > 15.0:
            confidence = 0.80
        else:
            raw_conf = 1.0 - (ratio * 0.5)
            confidence = max(0.40, min(0.78, raw_conf))

        # Flag as uncertain if margin is thin or absolute distance is large
        uncertain = (gap < 14.0) or (best_dist > 55.0) or (confidence < 0.70)

        return best_color, round(confidence, 2), uncertain, distances
