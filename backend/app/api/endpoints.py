"""FastAPI route endpoints for CubeSolve."""

import base64
import logging
from typing import Dict, List, Optional
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.cube.constants import FACES
from app.cube.state import CubeState
from app.cube.simulator import CubeSimulator
from app.validation.validator import CubeValidator
from app.solver.kociemba_solver import KociembaSolver
from app.vision.pipeline import VisionPipeline, decode_image_bytes
from app.models.schemas import (
    HealthResponse,
    ScanResponse,
    ValidationDetails,
    CubeStatePayload,
    SolveResponse,
    DemoResponse,
    FaceResult,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


class Base64ImagesPayload(BaseModel):
    # Maps face name ("U", "R", etc.) -> base64 string
    images: Dict[str, str]


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint to verify backend operational readiness."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        solver_ready=True,
        vision_ready=True,
    )


@router.post("/scan", response_model=ScanResponse)
async def scan_faces_multipart(
    face_U: Optional[UploadFile] = File(None),
    face_R: Optional[UploadFile] = File(None),
    face_F: Optional[UploadFile] = File(None),
    face_D: Optional[UploadFile] = File(None),
    face_L: Optional[UploadFile] = File(None),
    face_B: Optional[UploadFile] = File(None),
):
    """
    Process uploaded photographs of the 6 cube faces via multipart form upload.
    Extracts stickers, applies relative color calibration, and validates solvability.
    """
    uploads = {
        "U": face_U,
        "R": face_R,
        "F": face_F,
        "D": face_D,
        "L": face_L,
        "B": face_B,
    }

    face_images: Dict[str, np.ndarray] = {}

    for face, upload in uploads.items():
        if upload and upload.filename:
            content = await upload.read()
            if len(content) > 0:
                try:
                    img = decode_image_bytes(content)
                    face_images[face] = img
                except Exception as e:
                    logger.warning(f"Could not decode image for face {face}: {e}")

    if not face_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid face photographs provided in request",
        )

    try:
        pipeline_res = VisionPipeline.process_six_faces(face_images)
        return pipeline_res
    except Exception as e:
        logger.exception("Error processing cube photos")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}",
        )


@router.post("/scan/base64", response_model=ScanResponse)
def scan_faces_base64(payload: Base64ImagesPayload):
    """
    Alternative endpoint to accept base64-encoded face photographs.
    Convenient for browser canvas snapshots and camera capture.
    """
    face_images: Dict[str, np.ndarray] = {}

    for face, b64_str in payload.images.items():
        if not b64_str:
            continue
        try:
            # Strip data URI header if present
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64_str)
            img = decode_image_bytes(raw_bytes)
            face_images[face] = img
        except Exception as e:
            logger.warning(f"Failed to decode base64 for face {face}: {e}")

    if not face_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid base64 face photographs provided",
        )

    try:
        return VisionPipeline.process_six_faces(face_images)
    except Exception as e:
        logger.exception("Error processing base64 cube photos")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}",
        )


@router.post("/scan/single", response_model=FaceResult)
async def scan_single_face(
    face: str = Form("F"),
    image: UploadFile = File(...),
):
    """Scan an individual face photograph and return 9 detected stickers with confidence."""
    content = await image.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image file received",
        )

    try:
        img = decode_image_bytes(content)
        result = VisionPipeline.process_single_face(img, face_label=face)
        return result
    except Exception as e:
        logger.exception(f"Error processing single face {face}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not process face image: {str(e)}",
        )


@router.post("/validate", response_model=ValidationDetails)
def validate_cube(payload: CubeStatePayload):
    """
    Validates physical reachability and mathematical solvability of the 54-sticker configuration.
    Never sends an invalid state to the solver.
    """
    try:
        state = CubeState(payload.cube_state)
        val = CubeValidator.validate(state)
        return val.to_dict()
    except Exception as e:
        logger.exception("Validation exception")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed cube state: {str(e)}",
        )


@router.post("/solve", response_model=SolveResponse)
def solve_cube(payload: CubeStatePayload):
    """
    Calculates Rubik's Cube solution using Kociemba two-phase algorithm.
    Validates state, generates moves, simulates them, and verifies reached solved state.
    """
    try:
        state = CubeState(payload.cube_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid cube state format: {str(e)}",
        )

    solver = KociembaSolver()
    result = solver.solve(state)

    if not result.success:
        return SolveResponse(
            success=False,
            moves=[],
            move_count=0,
            explanations=[],
            verified=False,
            error=result.error or "Unknown solving error",
        )

    return result.to_dict()


@router.post("/demo", response_model=DemoResponse)
def get_demo_cube(scramble_length: int = 18):
    """
    Generates a valid, verified demo scramble and its solution using the real solver.
    Does not use simulated mockups.
    """
    try:
        # Generate valid scramble moves and apply to solved cube
        scramble_moves, scrambled_state = CubeSimulator.generate_scramble(scramble_length)

        # Solve the scramble using the real Kociemba solver
        solver = KociembaSolver()
        solve_result = solver.solve(scrambled_state)

        if not solve_result.success:
            raise RuntimeError(f"Demo solve failed: {solve_result.error}")

        return DemoResponse(
            scramble_moves=scramble_moves,
            cube_state=scrambled_state.to_dict(),
            solution=solve_result.to_dict(),
        )
    except Exception as e:
        logger.exception("Error generating demo cube")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate demo cube: {str(e)}",
        )
