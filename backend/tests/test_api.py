"""API endpoint unit tests for CubeSolve."""

import base64
import cv2
import numpy as np
import pytest
from app.api.endpoints import (
    get_health,
    validate_cube,
    solve_cube,
    get_demo_cube,
    scan_faces_base64,
    Base64ImagesPayload,
)
from app.models.schemas import CubeStatePayload
from app.cube.constants import FACES, DEFAULT_FACE_TO_COLOR
from app.cube.state import CubeState
from tests.test_vision import create_synthetic_cube_face_image


def test_api_health():
    res = get_health()
    assert res.status == "ok"
    assert res.solver_ready is True
    assert res.vision_ready is True


def test_api_validate_solved():
    solved = CubeState.solved().to_dict()
    res = validate_cube(CubeStatePayload(cube_state=solved))
    assert res["is_valid"] is True
    assert len(res["errors"]) == 0


def test_api_validate_invalid_colors():
    broken = CubeState.solved().to_dict()
    broken["U"][0] = "yellow"  # invalid color count
    res = validate_cube(CubeStatePayload(cube_state=broken))
    assert res["is_valid"] is False
    assert len(res["errors"]) > 0


def test_api_demo_endpoint():
    res = get_demo_cube(scramble_length=15)
    assert len(res.scramble_moves) == 15
    assert res.solution.success is True
    assert res.solution.verified is True
    assert len(res.solution.moves) > 0


def test_api_solve_endpoint():
    demo_res = get_demo_cube(scramble_length=12)
    cube_state = demo_res.cube_state

    res = solve_cube(CubeStatePayload(cube_state=cube_state))
    assert res["success"] is True
    assert res["verified"] is True
    assert len(res["moves"]) > 0
    assert len(res["explanations"]) == len(res["moves"])


def test_api_scan_base64_endpoint():
    # Generate synthetic images for all 6 faces
    images_b64 = {}
    for face in FACES:
        color = DEFAULT_FACE_TO_COLOR[face]
        img = create_synthetic_cube_face_image([color] * 9)
        _, buf = cv2.imencode(".jpg", img)
        images_b64[face] = base64.b64encode(buf).decode("utf-8")

    res = scan_faces_base64(Base64ImagesPayload(images=images_b64))
    assert res["calibration_used"] is True
    assert res["validation"]["is_valid"] is True
    assert len(res["faces"]) == 6
