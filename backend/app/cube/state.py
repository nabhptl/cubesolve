"""Cube state representation for the 54 stickers."""

from typing import Dict, List, Optional
from app.cube.constants import (
    FACES,
    COLORS,
    DEFAULT_FACE_TO_COLOR,
    COLOR_TO_DEFAULT_FACE,
)


class CubeState:
    """
    Represents the full 54-sticker Rubik's cube state across 6 faces:
    U (Up), R (Right), F (Front), D (Down), L (Left), B (Back).
    Each face is a list of 9 color names in row-major order:
    0 1 2
    3 4 5
    6 7 8
    Index 4 is the center sticker.
    """

    def __init__(self, faces: Optional[Dict[str, List[str]]] = None):
        if faces is not None:
            self.faces = {f: list(faces[f]) for f in FACES if f in faces}
        else:
            # Default to solved cube
            self.faces = {
                face: [DEFAULT_FACE_TO_COLOR[face]] * 9 for face in FACES
            }

    @classmethod
    def solved(cls) -> "CubeState":
        """Return a pristine solved cube state."""
        return cls()

    @classmethod
    def from_facelet_string(
        cls,
        facelet_str: str,
        face_to_color: Optional[Dict[str, str]] = None,
    ) -> "CubeState":
        """
        Create a CubeState from a 54-character Kociemba facelet string.
        facelet_str order: U(9), R(9), F(9), D(9), L(9), B(9).
        """
        if len(facelet_str) != 54:
            raise ValueError(f"Facelet string must be exactly 54 characters, got {len(facelet_str)}")

        mapping = face_to_color or DEFAULT_FACE_TO_COLOR
        faces = {}
        for idx, face in enumerate(FACES):
            face_chars = facelet_str[idx * 9 : (idx + 1) * 9]
            faces[face] = [mapping.get(c, DEFAULT_FACE_TO_COLOR.get(c, "white")) for c in face_chars]
        return cls(faces)

    def get_center_color_mapping(self) -> Dict[str, str]:
        """
        Maps sticker color name -> Kociemba face letter based on center stickers (index 4).
        Returns dict like {'white': 'U', 'red': 'R', 'green': 'F', ...}
        """
        color_to_face: Dict[str, str] = {}
        for face in FACES:
            center_color = self.faces[face][4]
            color_to_face[center_color] = face
        return color_to_face

    def to_facelet_string(self) -> str:
        """
        Convert to 54-character Kociemba string:
        U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9.
        Uses center stickers to map color -> face letter.
        """
        color_to_face = self.get_center_color_mapping()

        # If centers aren't 6 unique colors, fall back to default color mapping
        if len(color_to_face) != 6:
            color_to_face = COLOR_TO_DEFAULT_FACE

        chars = []
        for face in FACES:
            for color in self.faces[face]:
                chars.append(color_to_face.get(color, "U"))
        return "".join(chars)

    def is_solved(self) -> bool:
        """Check if all faces are monochromatic matching their center."""
        for face in FACES:
            center = self.faces[face][4]
            if any(sticker != center for sticker in self.faces[face]):
                return False
        return True

    def clone(self) -> "CubeState":
        """Create a deep copy of this state."""
        return CubeState({f: list(stickers) for f, stickers in self.faces.items()})

    def to_dict(self) -> Dict[str, List[str]]:
        """Return dict representation."""
        return {f: list(self.faces[f]) for f in FACES}

    def get_color_counts(self) -> Dict[str, int]:
        """Count stickers of each color."""
        counts: Dict[str, int] = {}
        for face in FACES:
            for c in self.faces[face]:
                counts[c] = counts.get(c, 0) + 1
        return counts
