import type { CubeColor, CubeState, Face } from '../types/cube'
import { FACES } from '../constants/cubeConstants'

function rotateFaceClockwise(face: CubeColor[]): CubeColor[] {
  return [
    face[6],
    face[3],
    face[0],
    face[7],
    face[4],
    face[1],
    face[8],
    face[5],
    face[2],
  ]
}

function cloneState(state: CubeState): CubeState {
  const next = {} as CubeState
  for (const f of FACES) {
    next[f] = [...state[f]]
  }
  return next
}

/**
 * Applies a single 90-degree clockwise move for a given face.
 */
function applySingleClockwise(state: CubeState, face: Face): CubeState {
  const next = cloneState(state)
  next[face] = rotateFaceClockwise(state[face])

  if (face === 'U') {
    // U affects top row of F, L, B, R
    // F(0,1,2) -> L(0,1,2) -> B(0,1,2) -> R(0,1,2) -> F(0,1,2)
    next.F[0] = state.R[0]
    next.F[1] = state.R[1]
    next.F[2] = state.R[2]

    next.L[0] = state.F[0]
    next.L[1] = state.F[1]
    next.L[2] = state.F[2]

    next.B[0] = state.L[0]
    next.B[1] = state.L[1]
    next.B[2] = state.L[2]

    next.R[0] = state.B[0]
    next.R[1] = state.B[1]
    next.R[2] = state.B[2]
  } else if (face === 'D') {
    // D affects bottom row of F, R, B, L
    // F(6,7,8) -> R(6,7,8) -> B(6,7,8) -> L(6,7,8) -> F(6,7,8)
    next.R[6] = state.F[6]
    next.R[7] = state.F[7]
    next.R[8] = state.F[8]

    next.B[6] = state.R[6]
    next.B[7] = state.R[7]
    next.B[8] = state.R[8]

    next.L[6] = state.B[6]
    next.L[7] = state.B[7]
    next.L[8] = state.B[8]

    next.F[6] = state.L[6]
    next.F[7] = state.L[7]
    next.F[8] = state.L[8]
  } else if (face === 'R') {
    // R affects right column of F, U, D and left column of B
    // F(2,5,8) -> U(2,5,8)
    // U(2,5,8) -> B(6,3,0)
    // B(6,3,0) -> D(2,5,8)
    // D(2,5,8) -> F(2,5,8)
    next.U[2] = state.F[2]
    next.U[5] = state.F[5]
    next.U[8] = state.F[8]

    next.B[6] = state.U[2]
    next.B[3] = state.U[5]
    next.B[0] = state.U[8]

    next.D[2] = state.B[6]
    next.D[5] = state.B[3]
    next.D[8] = state.B[0]

    next.F[2] = state.D[2]
    next.F[5] = state.D[5]
    next.F[8] = state.D[8]
  } else if (face === 'L') {
    // L affects left column of F, D, U and right column of B
    // U(0,3,6) -> F(0,3,6)
    // F(0,3,6) -> D(0,3,6)
    // D(0,3,6) -> B(8,5,2)
    // B(8,5,2) -> U(0,3,6)
    next.F[0] = state.U[0]
    next.F[3] = state.U[3]
    next.F[6] = state.U[6]

    next.D[0] = state.F[0]
    next.D[3] = state.F[3]
    next.D[6] = state.F[6]

    next.B[8] = state.D[0]
    next.B[5] = state.D[3]
    next.B[2] = state.D[6]

    next.U[0] = state.B[8]
    next.U[3] = state.B[5]
    next.U[6] = state.B[2]
  } else if (face === 'F') {
    // F affects bottom of U, left of R, top of D, right of L
    // U(6,7,8) -> R(0,3,6)
    // R(0,3,6) -> D(2,1,0)
    // D(0,1,2) -> L(6,3,0) (D0->L2, D1->L5, D2->L8)
    // L(2,5,8) -> U(8,7,6) (L2->U8, L5->U7, L8->U6)
    next.R[0] = state.U[6]
    next.R[3] = state.U[7]
    next.R[6] = state.U[8]

    next.D[2] = state.R[0]
    next.D[1] = state.R[3]
    next.D[0] = state.R[6]

    next.L[2] = state.D[0]
    next.L[5] = state.D[1]
    next.L[8] = state.D[2]

    next.U[8] = state.L[2]
    next.U[7] = state.L[5]
    next.U[6] = state.L[8]
  } else if (face === 'B') {
    // B affects top of U, left of L, bottom of D, right of R
    // U(0,1,2) -> L(6,3,0)
    // L(0,3,6) -> D(8,7,6)
    // D(6,7,8) -> R(8,5,2)
    // R(2,5,8) -> U(2,1,0)
    next.L[6] = state.U[0]
    next.L[3] = state.U[1]
    next.L[0] = state.U[2]

    next.D[8] = state.L[0]
    next.D[7] = state.L[3]
    next.D[6] = state.L[6]

    next.R[2] = state.D[6]
    next.R[5] = state.D[7]
    next.R[8] = state.D[8]

    next.U[0] = state.R[2]
    next.U[1] = state.R[5]
    next.U[2] = state.R[8]
  }

  return next
}

/**
 * Apply any move (e.g., "R", "R'", "R2") to a CubeState.
 */
export function simulateMove(state: CubeState, move: string): CubeState {
  const clean = move.trim()
  if (!clean) return state

  const face = clean[0] as Face
  if (!FACES.includes(face)) return state

  let turns = 1
  if (clean.includes('2')) {
    turns = 2
  } else if (clean.includes("'")) {
    turns = 3
  }

  let current = state
  for (let i = 0; i < turns; i++) {
    current = applySingleClockwise(current, face)
  }
  return current
}

/**
 * Simulates a sequence of moves, returning an array of states
 * from step 0 (initial) to step N (after all moves).
 */
export function simulateAllMoves(
  initialState: CubeState,
  moves: string[]
): CubeState[] {
  const history: CubeState[] = [cloneState(initialState)]
  let current = cloneState(initialState)

  for (const move of moves) {
    if (!move.trim()) continue
    current = simulateMove(current, move)
    history.push(cloneState(current))
  }

  return history
}

/**
 * Returns true if all 6 faces have all 9 stickers matching their center sticker.
 */
export function isCubeSolved(state: CubeState): boolean {
  for (const f of FACES) {
    const center = state[f][4]
    if (state[f].some((c) => c !== center)) {
      return false
    }
  }
  return true
}
