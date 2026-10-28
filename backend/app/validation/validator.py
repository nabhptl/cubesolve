"""Cube state validation for physical reachability and mathematical solvability."""

from typing import Dict, List, Optional, Tuple
from app.cube.constants import FACES, COLORS, DEFAULT_FACE_TO_COLOR
from app.cube.state import CubeState
from app.solver.pykociemba.facecube import FaceCube
from app.solver.pykociemba.cubiecube import CubieCube


class ValidationResult:
    """Detailed result of cube state validation."""

    def __init__(
        self,
        is_valid: bool,
        errors: Optional[List[str]] = None,
        warnings: Optional[List[str]] = None,
        color_counts: Optional[Dict[str, int]] = None,
        center_mapping: Optional[Dict[str, str]] = None,
    ):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
        self.color_counts = color_counts or {}
        self.center_mapping = center_mapping or {}

    def to_dict(self) -> Dict:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "color_counts": self.color_counts,
            "center_mapping": self.center_mapping,
        }


class CubeValidator:
    """Validates physical solvability of a 3x3 Rubik's Cube state."""

    @staticmethod
    def validate(state: CubeState) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Check all 6 faces exist and each has 9 stickers
        for face in FACES:
            if face not in state.faces:
                errors.append(f"Missing face: {face}")
            elif len(state.faces[face]) != 9:
                errors.append(
                    f"Face {face} has {len(state.faces[face])} stickers, expected 9"
                )

        if errors:
            return ValidationResult(is_valid=False, errors=errors)

        # 2. Check center stickers (index 4 of each face)
        centers = {face: state.faces[face][4] for face in FACES}
        center_colors = list(centers.values())
        unique_centers = set(center_colors)
        if len(unique_centers) != 6:
            duplicate_centers = [c for c in unique_centers if center_colors.count(c) > 1]
            errors.append(
                f"Centers must have 6 unique colors. Duplicates found: {', '.join(duplicate_centers)}"
            )

        # 3. Check color counts (exactly 9 of each color)
        color_counts = state.get_color_counts()
        for color in COLORS:
            count = color_counts.get(color, 0)
            if count != 9:
                errors.append(
                    f"Color '{color}' has {count} stickers (expected 9: {count - 9:+d})"
                )

        # If basic sticker count or centers failed, return early
        if errors:
            return ValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                color_counts=color_counts,
                center_mapping=centers,
            )

        # 4. Convert to Kociemba facelet string and check piece-level consistency
        facelet_str = state.to_facelet_string()
        try:
            fc = FaceCube(facelet_str)
            cc = fc.toCubieCube()
            status = cc.verify()
            if status != 0:
                error_messages = {
                    -1: "Invalid facelet configuration",
                    -2: "Edge piece error: Not all 12 unique edge pieces exist",
                    -3: "Edge flip error: One edge has to be flipped (orientation parity violation)",
                    -4: "Corner piece error: Not all 8 unique corner pieces exist",
                    -5: "Corner twist error: One corner has to be twisted (twist parity violation)",
                    -6: "Permutation parity error: Two corners or two edges must be swapped (overall parity mismatch)",
                }
                msg = error_messages.get(status, f"Solvability error code: {status}")
                errors.append(msg)
        except Exception as e:
            errors.append(f"Internal cube model error: {str(e)}")

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            color_counts=color_counts,
            center_mapping=centers,
        )
