"""Tests for cube representation, simulator, validator, and Kociemba solver."""

import pytest
from app.cube.constants import FACES, COLORS, DEFAULT_FACE_TO_COLOR
from app.cube.state import CubeState
from app.cube.simulator import CubeSimulator
from app.validation.validator import CubeValidator
from app.solver.kociemba_solver import KociembaSolver


def test_solved_cube():
    cube = CubeState.solved()
    assert cube.is_solved()
    for face in FACES:
        assert len(cube.faces[face]) == 9
        assert cube.faces[face][4] == DEFAULT_FACE_TO_COLOR[face]

    val = CubeValidator.validate(cube)
    assert val.is_valid
    assert len(val.errors) == 0

    solver = KociembaSolver()
    result = solver.solve(cube)
    assert result.success
    assert result.move_count == 0
    assert result.verified


def test_known_scramble():
    # Known test scramble from Kociemba documentation
    facelet_str = "BBURUDBFUFFFRRFUUFLULUFUDLRRDBBDBDBLUDDFLLRRBRLLLBRDDF"
    state = CubeState.from_facelet_string(facelet_str)
    assert not state.is_solved()

    val = CubeValidator.validate(state)
    assert val.is_valid

    solver = KociembaSolver()
    result = solver.solve(state)
    assert result.success
    assert result.verified
    assert len(result.moves) > 0
    assert result.move_count == len(result.moves)

    # Verify simulation explicitly
    final_state, history = CubeSimulator.apply_moves(state, result.moves)
    assert final_state.is_solved()
    assert len(history) == len(result.moves) + 1


def test_random_scramble_solve():
    # Generate 15-move scramble from solved cube
    scramble_moves, scrambled_state = CubeSimulator.generate_scramble(15)
    assert len(scramble_moves) == 15
    assert not scrambled_state.is_solved()

    val = CubeValidator.validate(scrambled_state)
    assert val.is_valid

    solver = KociembaSolver()
    result = solver.solve(scrambled_state)
    assert result.success
    assert result.verified

    # Double check verify_solution
    assert CubeSimulator.verify_solution(scrambled_state, result.moves)


def test_invalid_color_counts():
    cube = CubeState.solved()
    # Change one white sticker to yellow
    cube.faces["U"][0] = "yellow"
    val = CubeValidator.validate(cube)
    assert not val.is_valid
    assert any("has 8 stickers" in err or "has 10 stickers" in err for err in val.errors)

    solver = KociembaSolver()
    res = solver.solve(cube)
    assert not res.success
    assert "validation failed" in res.error.lower()


def test_corner_twist_error():
    # Take a solved cube, twist one corner without changing color counts:
    # URF corner has stickers at U[8], R[0], F[2]
    # In solved cube: U[8]='white', R[0]='red', F[2]='green'
    # Twist it clockwise: U[8]='green', R[0]='white', F[2]='red'
    # Color counts are still exactly 9 of each color, but corner twist sum != 0!
    cube = CubeState.solved()
    cube.faces["U"][8] = "green"
    cube.faces["R"][0] = "white"
    cube.faces["F"][2] = "red"

    val = CubeValidator.validate(cube)
    assert not val.is_valid
    assert any("corner" in err.lower() or "twist" in err.lower() for err in val.errors)


def test_duplicate_centers():
    cube = CubeState.solved()
    cube.faces["U"][4] = "red"  # Center of U changed to red (duplicate with R)
    val = CubeValidator.validate(cube)
    assert not val.is_valid
    assert any("center" in err.lower() for err in val.errors)
