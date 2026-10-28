export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'

export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange'

export type CubeState = Record<Face, CubeColor[]>

export interface StickerData {
  index: number
  row: number
  col: number
  color: CubeColor
  confidence: number
  uncertain: boolean
  rgb_sample?: number[]
  rgb_hex?: string
  sample_box?: number[]
}

export interface FaceScanData {
  face: Face
  detected_colors: CubeColor[]
  stickers: StickerData[]
  quality: {
    is_acceptable: boolean
    blur_score: number
    brightness: number
    contrast: number
    resolution: [number, number]
    issues: string[]
  }
  homography_applied: boolean
  detection_method: string
  warped_preview?: string
}

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  color_counts: Record<CubeColor, number>
  center_mapping: Record<string, string>
}

export interface ScanResponse {
  faces: Record<Face, FaceScanData>
  cube_state: CubeState
  validation: ValidationResult
  uncertain_count: number
  calibration_used: boolean
}

export interface MoveExplanation {
  move: string
  description: string
}

export interface SolveResponse {
  success: boolean
  moves: string[]
  move_count: number
  explanations: MoveExplanation[]
  verified: boolean
  error?: string
}

export interface DemoResponse {
  scramble_moves: string[]
  cube_state: CubeState
  solution: SolveResponse
}

export type PageView = 'landing' | 'upload' | 'review' | 'solution'
