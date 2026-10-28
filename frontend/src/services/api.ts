import type {
  CubeState,
  Face,
  ScanResponse,
  SolveResponse,
  ValidationResult,
  DemoResponse,
} from '../types/cube'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

export async function fetchHealth(): Promise<{
  status: string
  solver_ready: boolean
  vision_ready: boolean
}> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`)
  }
  return res.json()
}

export async function scanFacePhotos(
  files: Partial<Record<Face, File>>
): Promise<ScanResponse> {
  const formData = new FormData()
  for (const [face, file] of Object.entries(files)) {
    if (file) {
      formData.append(`face_${face}`, file)
    }
  }

  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Scan failed: ${res.statusText}`)
  }

  return res.json()
}

export async function scanBase64Photos(
  images: Record<Face, string>
): Promise<ScanResponse> {
  const res = await fetch(`${API_BASE}/scan/base64`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Scan failed: ${res.statusText}`)
  }

  return res.json()
}

export async function validateCubeState(
  cubeState: CubeState
): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cube_state: cubeState }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Validation failed: ${res.statusText}`)
  }

  return res.json()
}

export async function solveCubeState(
  cubeState: CubeState
): Promise<SolveResponse> {
  const res = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cube_state: cubeState }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Solving failed: ${res.statusText}`)
  }

  return res.json()
}

export async function fetchDemoCube(
  scrambleLength: number = 18
): Promise<DemoResponse> {
  const res = await fetch(
    `${API_BASE}/demo?scramble_length=${scrambleLength}`,
    {
      method: 'POST',
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Demo failed: ${res.statusText}`)
  }

  return res.json()
}
