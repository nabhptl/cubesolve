"""Kociemba Two-Phase Rubik's Cube Solver wrapper and verification."""

import logging
from typing import Dict, List, Optional
from app.cube.constants import MOVE_EXPLANATIONS
from app.cube.state import CubeState
from app.cube.simulator import CubeSimulator
from app.validation.validator import CubeValidator
from app.solver.pykociemba.search import Search

logger = logging.getLogger(__name__)


class SolverResult:
    """Encapsulates the result of solving a cube."""

    def __init__(
        self,
        success: bool,
        moves: List[str],
        move_count: int,
        explanations: List[Dict[str, str]],
        verified: bool,
        error: Optional[str] = None,
    ):
        self.success = success
        self.moves = moves
        self.move_count = move_count
        self.explanations = explanations
        self.verified = verified
        self.error = error

    def to_dict(self) -> Dict:
        return {
            "success": self.success,
            "moves": self.moves,
            "move_count": self.move_count,
            "explanations": self.explanations,
            "verified": self.verified,
            "error": self.error,
        }


class KociembaSolver:
    """Wraps Kociemba two-phase algorithm with validation and solution verification."""

    def __init__(self, max_depth: int = 24, timeout_sec: int = 5):
        self.max_depth = max_depth
        self.timeout_sec = timeout_sec
        self._search = Search()

    def solve(self, state: CubeState) -> SolverResult:
        # 1. Validate the cube state first
        val = CubeValidator.validate(state)
        if not val.is_valid:
            error_msg = "; ".join(val.errors)
            return SolverResult(
                success=False,
                moves=[],
                move_count=0,
                explanations=[],
                verified=False,
                error=f"Cube validation failed: {error_msg}",
            )

        # 2. Check if already solved
        if state.is_solved():
            return SolverResult(
                success=True,
                moves=[],
                move_count=0,
                explanations=[],
                verified=True,
            )

        facelet_str = state.to_facelet_string()

        # 3. Solve using Kociemba two-phase search
        try:
            raw_solution = self._search.solution(
                facelet_str,
                self.max_depth,
                self.timeout_sec,
                False,
            ).strip()

            error_codes = {
                "Error 1": "There is not exactly one facelet of each colour",
                "Error 2": "Not all 12 edges exist exactly once",
                "Error 3": "Flip error: One edge has to be flipped",
                "Error 4": "Not all corners exist exactly once",
                "Error 5": "Twist error: One corner has to be twisted",
                "Error 6": "Parity error: Two corners or two edges have to be exchanged",
                "Error 7": "No solution exists for the given maxDepth",
                "Error 8": "Timeout: No solution found within time limit",
            }

            if raw_solution in error_codes:
                return SolverResult(
                    success=False,
                    moves=[],
                    move_count=0,
                    explanations=[],
                    verified=False,
                    error=f"Solver error: {error_codes[raw_solution]}",
                )

            moves = [m.strip() for m in raw_solution.split() if m.strip()]
        except Exception as e:
            logger.exception("Kociemba solver exception")
            return SolverResult(
                success=False,
                moves=[],
                move_count=0,
                explanations=[],
                verified=False,
                error=f"Solving failed: {str(e)}",
            )

        # 4. Verify solution by applying it to simulated cube
        verified = CubeSimulator.verify_solution(state, moves)
        if not verified:
            return SolverResult(
                success=False,
                moves=moves,
                move_count=len(moves),
                explanations=[],
                verified=False,
                error="Solution verification failed: applying moves did not reach the solved state",
            )

        # 5. Format human-readable explanations
        explanations = [
            {
                "move": m,
                "description": MOVE_EXPLANATIONS.get(m, f"Turn face {m}"),
            }
            for m in moves
        ]

        return SolverResult(
            success=True,
            moves=moves,
            move_count=len(moves),
            explanations=explanations,
            verified=True,
        )
