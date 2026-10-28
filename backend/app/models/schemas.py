"""Pydantic schemas for API requests and responses."""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    solver_ready: bool = True
    vision_ready: bool = True


class StickerInfo(BaseModel):
    index: int
    row: int
    col: int
    color: str
    confidence: float
    uncertain: bool
    rgb_sample: Optional[List[int]] = None
    rgb_hex: Optional[str] = None
    sample_box: Optional[List[int]] = None


class FaceResult(BaseModel):
    face: str
    detected_colors: List[str]
    stickers: List[StickerInfo]
    quality: Dict[str, Any]
    homography_applied: bool
    detection_method: str
    warped_preview: Optional[str] = None


class ValidationDetails(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    color_counts: Dict[str, int] = Field(default_factory=dict)
    center_mapping: Dict[str, str] = Field(default_factory=dict)


class ScanResponse(BaseModel):
    faces: Dict[str, FaceResult]
    cube_state: Dict[str, List[str]]
    validation: ValidationDetails
    uncertain_count: int
    calibration_used: bool


class CubeStatePayload(BaseModel):
    cube_state: Dict[str, List[str]]


class MoveItem(BaseModel):
    move: str
    description: str


class SolveResponse(BaseModel):
    success: bool
    moves: List[str] = Field(default_factory=list)
    move_count: int = 0
    explanations: List[MoveItem] = Field(default_factory=list)
    verified: bool = False
    error: Optional[str] = None


class DemoResponse(BaseModel):
    scramble_moves: List[str]
    cube_state: Dict[str, List[str]]
    solution: SolveResponse
