"""Constants for Rubik's Cube representation, colors, moves, and notation."""

from typing import Dict, List, Tuple

# Six faces in standard Kociemba order
FACES: List[str] = ["U", "R", "F", "D", "L", "B"]

FACE_NAMES: Dict[str, str] = {
    "U": "Up",
    "R": "Right",
    "F": "Front",
    "D": "Down",
    "L": "Left",
    "B": "Back",
}

# The 6 canonical sticker colors
COLORS: List[str] = ["white", "yellow", "green", "blue", "red", "orange"]

# Default Western color scheme mapped to faces
DEFAULT_FACE_TO_COLOR: Dict[str, str] = {
    "U": "white",
    "D": "yellow",
    "F": "green",
    "B": "blue",
    "R": "red",
    "L": "orange",
}

COLOR_TO_DEFAULT_FACE: Dict[str, str] = {
    v: k for k, v in DEFAULT_FACE_TO_COLOR.items()
}

# Standard hex colors for UI and 3D rendering
COLOR_HEX: Dict[str, str] = {
    "white": "#FFFFFF",
    "yellow": "#FFD500",
    "green": "#009B48",
    "blue": "#0045AD",
    "red": "#B71234",
    "orange": "#FF5800",
}

# RGB integer tuples (0-255) for vision calibration & reference
COLOR_RGB_REF: Dict[str, Tuple[int, int, int]] = {
    "white": (245, 245, 245),
    "yellow": (255, 215, 0),
    "green": (0, 155, 72),
    "blue": (0, 70, 173),
    "red": (183, 18, 52),
    "orange": (255, 88, 0),
}

# Plain-English descriptions for all 18 standard moves
MOVE_EXPLANATIONS: Dict[str, str] = {
    "U": "Rotate Up (top) face 90° clockwise",
    "U'": "Rotate Up (top) face 90° counter-clockwise",
    "U2": "Rotate Up (top) face 180°",
    "D": "Rotate Down (bottom) face 90° clockwise",
    "D'": "Rotate Down (bottom) face 90° counter-clockwise",
    "D2": "Rotate Down (bottom) face 180°",
    "R": "Rotate Right face 90° clockwise",
    "R'": "Rotate Right face 90° counter-clockwise",
    "R2": "Rotate Right face 180°",
    "L": "Rotate Left face 90° clockwise",
    "L'": "Rotate Left face 90° counter-clockwise",
    "L2": "Rotate Left face 180°",
    "F": "Rotate Front face 90° clockwise",
    "F'": "Rotate Front face 90° counter-clockwise",
    "F2": "Rotate Front face 180°",
    "B": "Rotate Back face 90° clockwise",
    "B'": "Rotate Back face 90° counter-clockwise",
    "B2": "Rotate Back face 180°",
}

# 2D Net layout positions
# Net:
#       [U]
#   [L] [F] [R] [B]
#       [D]
NET_LAYOUT: Dict[str, Tuple[int, int]] = {
    "U": (0, 1),
    "L": (1, 0),
    "F": (1, 1),
    "R": (1, 2),
    "B": (1, 3),
    "D": (2, 1),
}
