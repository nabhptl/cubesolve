"""Rubik's Cube turn simulation, solution verification, and scramble generation."""

import random
from typing import Dict, List, Tuple
from app.cube.constants import FACES, MOVE_EXPLANATIONS
from app.cube.state import CubeState
from app.solver.pykociemba.cubiecube import CubieCube, moveCube
from app.solver.pykociemba.facecube import FaceCube

MOVE_INDEX = {
    "U": 0,
    "R": 1,
    "F": 2,
    "D": 3,
    "L": 4,
    "B": 5,
}


def apply_move_to_facelet_string(facelet_str: str, move: str) -> str:
    """
    Apply a single move (e.g. "R", "U'", "F2") to a 54-char Kociemba facelet string.
    Returns the new 54-char facelet string.
    """
    if len(facelet_str) != 54:
        raise ValueError(f"Expected 54 characters, got {len(facelet_str)}")

    face = move[0]
    if face not in MOVE_INDEX:
        raise ValueError(f"Invalid move face: {face}")

    m_idx = MOVE_INDEX[face]
    turns = 1
    if len(move) > 1:
        if move[1] == "2":
            turns = 2
        elif move[1] == "'":
            turns = 3

    fc = FaceCube(facelet_str)
    cc = fc.toCubieCube()
    for _ in range(turns):
        cc.cornerMultiply(moveCube[m_idx])
        cc.edgeMultiply(moveCube[m_idx])

    return cc.toFaceCube().to_String()


class CubeSimulator:
    """Simulates moves on CubeState objects, verifies solutions, and generates scrambles."""

    @staticmethod
    def apply_move(state: CubeState, move: str) -> CubeState:
        """Apply a single move to state, returning a new CubeState."""
        # Convert state colors to facelet notation using its centers
        color_to_face = state.get_center_color_mapping()
        face_to_color = {f: c for c, f in color_to_face.items()}

        facelet_str = state.to_facelet_string()
        new_facelet_str = apply_move_to_facelet_string(facelet_str, move)

        return CubeState.from_facelet_string(new_facelet_str, face_to_color)

    @staticmethod
    def apply_moves(
        initial_state: CubeState,
        moves: List[str],
    ) -> Tuple[CubeState, List[CubeState]]:
        """
        Apply a sequence of moves to initial_state.
        Returns (final_state, list_of_all_intermediate_states_including_start).
        """
        history = [initial_state.clone()]
        current = initial_state.clone()

        for move in moves:
            clean_move = move.strip()
            if not clean_move:
                continue
            current = CubeSimulator.apply_move(current, clean_move)
            history.append(current.clone())

        return current, history

    @staticmethod
    def verify_solution(initial_state: CubeState, moves: List[str]) -> bool:
        """
        Verify that applying moves to initial_state reaches the solved state.
        """
        final_state, _ = CubeSimulator.apply_moves(initial_state, moves)
        return final_state.is_solved()

    @staticmethod
    def generate_scramble(num_moves: int = 20) -> Tuple[List[str], CubeState]:
        """
        Generate a valid pseudo-random scramble of given length.
        Avoids redundant immediate cancellations (e.g. R followed by R', or R R R).
        Returns (moves_list, resulting_scrambled_cube_state).
        """
        faces = ["U", "R", "F", "D", "L", "B"]
        modifiers = ["", "'", "2"]
        scramble_moves: List[str] = []

        last_face = ""
        second_last_face = ""

        # Opposite faces map (don't do R L R)
        opposites = {"U": "D", "D": "U", "R": "L", "L": "R", "F": "B", "B": "F"}

        while len(scramble_moves) < num_moves:
            face = random.choice(faces)
            if face == last_face:
                continue
            if face == second_last_face and opposites.get(face) == last_face:
                continue

            mod = random.choice(modifiers)
            scramble_moves.append(f"{face}{mod}")
            second_last_face = last_face
            last_face = face

        state = CubeState.solved()
        scrambled_state, _ = CubeSimulator.apply_moves(state, scramble_moves)
        return scramble_moves, scrambled_state
