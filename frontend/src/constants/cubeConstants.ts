import type { CubeColor, CubeState, Face } from '../types/cube'

export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

export const COLORS: CubeColor[] = [
  'white',
  'yellow',
  'green',
  'blue',
  'red',
  'orange',
]

export const COLOR_HEX: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFD500',
  green: '#009B48',
  blue: '#0045AD',
  red: '#B71234',
  orange: '#FF5800',
}

export const COLOR_NAMES: Record<CubeColor, string> = {
  white: 'White',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  red: 'Red',
  orange: 'Orange',
}

export const DEFAULT_FACE_TO_COLOR: Record<Face, CubeColor> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
}

export const FACE_INFO: Record<
  Face,
  {
    name: string
    color: CubeColor
    instruction: string
    stepNumber: number
  }
> = {
  F: {
    name: 'Front Face',
    color: 'green',
    instruction:
      'Hold the cube with Green facing you and White on top. Take photo straight on.',
    stepNumber: 1,
  },
  R: {
    name: 'Right Face',
    color: 'red',
    instruction:
      'From Front, rotate cube 90° to the right. Red is facing you, White remains on top.',
    stepNumber: 2,
  },
  B: {
    name: 'Back Face',
    color: 'blue',
    instruction:
      'Rotate cube 90° to the right again. Blue is facing you, White remains on top.',
    stepNumber: 3,
  },
  L: {
    name: 'Left Face',
    color: 'orange',
    instruction:
      'Rotate cube 90° to the right again. Orange is facing you, White remains on top.',
    stepNumber: 4,
  },
  U: {
    name: 'Up Face (Top)',
    color: 'white',
    instruction:
      'From original Front (Green), tilt the cube downward 90°. White faces camera, Blue is on top.',
    stepNumber: 5,
  },
  D: {
    name: 'Down Face (Bottom)',
    color: 'yellow',
    instruction:
      'From original Front (Green), tilt the cube upward 90°. Yellow faces camera, Green is on top.',
    stepNumber: 6,
  },
}

export function createSolvedCubeState(): CubeState {
  return {
    U: Array(9).fill('white'),
    D: Array(9).fill('yellow'),
    F: Array(9).fill('green'),
    B: Array(9).fill('blue'),
    R: Array(9).fill('red'),
    L: Array(9).fill('orange'),
  }
}
