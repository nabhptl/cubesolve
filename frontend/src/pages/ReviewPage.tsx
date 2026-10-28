import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Paintbrush,
  Loader2,
} from 'lucide-react'
import type {
  CubeColor,
  CubeState,
  Face,
  PageView,
  ScanResponse,
  SolveResponse,
  ValidationResult,
} from '../types/cube'
import {
  FACES,
  COLORS,
  COLOR_HEX,
  COLOR_NAMES,
  createSolvedCubeState,
} from '../constants/cubeConstants'
import { validateCubeState, solveCubeState } from '../services/api'

interface ReviewPageProps {
  cubeState: CubeState
  scanResponse: ScanResponse | null
  onCubeStateChange: (newState: CubeState) => void
  onSolveComplete: (solution: SolveResponse) => void
  onNavigate: (page: PageView) => void
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  cubeState,
  scanResponse,
  onCubeStateChange,
  onSolveComplete,
  onNavigate,
}) => {
  const [selectedColor, setSelectedColor] = useState<CubeColor>('white')
  const [validation, setValidation] = useState<ValidationResult | null>(
    scanResponse?.validation || null
  )
  const [isValidating, setIsValidating] = useState(false)
  const [isSolving, setIsSolving] = useState(false)
  const [solveError, setSolveError] = useState<string | null>(null)

  // Recalculate color counts dynamically
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  }

  for (const face of FACES) {
    for (const color of cubeState[face]) {
      if (color in colorCounts) {
        colorCounts[color]++
      }
    }
  }

  // Run validation whenever cube state changes
  const runValidation = async (stateToValidate: CubeState) => {
    setIsValidating(true)
    setSolveError(null)
    try {
      const res = await validateCubeState(stateToValidate)
      setValidation(res)
    } catch (err: any) {
      console.error('Validation error:', err)
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    runValidation(cubeState)
  }, [cubeState])

  // Handle clicking a sticker
  const handleStickerClick = (face: Face, index: number) => {
    const nextState = {
      ...cubeState,
      [face]: [...cubeState[face]],
    }
    nextState[face][index] = selectedColor
    onCubeStateChange(nextState)
  }

  // Solve cube
  const handleSolve = async () => {
    if (!validation?.is_valid) return

    setIsSolving(true)
    setSolveError(null)

    try {
      const solution = await solveCubeState(cubeState)
      if (solution.success) {
        onSolveComplete(solution)
        onNavigate('solution')
      } else {
        setSolveError(solution.error || 'Failed to solve cube')
      }
    } catch (err: any) {
      console.error('Solving error:', err)
      setSolveError(err.message || 'Solving failed. Please revalidate.')
    } finally {
      setIsSolving(false)
    }
  }

  // Check if a sticker is uncertain from scan data
  const isStickerUncertain = (face: Face, index: number): boolean => {
    if (!scanResponse?.faces[face]?.stickers) return false
    return !!scanResponse.faces[face].stickers[index]?.uncertain
  }

  // Render a 3x3 face grid
  const renderFaceGrid = (face: Face, label: string) => {
    const stickers = cubeState[face]

    return (
      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <span>{label}</span>
          <span className="text-[9px] text-slate-500">({face})</span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
          {stickers.map((color, idx) => {
            const isCenter = idx === 4
            const isUncertain = isStickerUncertain(face, idx)

            return (
              <button
                key={`${face}_${idx}`}
                onClick={() => handleStickerClick(face, idx)}
                title={`${face}[${idx}]: ${color}${isCenter ? ' (Center)' : ''}${
                  isUncertain ? ' - Low Confidence' : ''
                }`}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md transition-all relative flex items-center justify-center border-2 ${
                  isUncertain
                    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 animate-pulse border-amber-300'
                    : 'border-black/40 hover:scale-105 hover:z-10'
                }`}
                style={{ backgroundColor: COLOR_HEX[color] }}
              >
                {isCenter && (
                  <span className="w-2.5 h-2.5 rounded-full bg-black/30 pointer-events-none" />
                )}
                {isUncertain && (
                  <AlertTriangle className="w-3.5 h-3.5 text-black drop-shadow pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            Review & Correct Cube State
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click any sticker to apply the selected paint color. Review and fix
            any highlighted uncertain stickers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scanResponse && (
            <button
              onClick={() => onCubeStateChange(scanResponse.cube_state)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Scanned
            </button>
          )}

          <button
            onClick={() => onCubeStateChange(createSolvedCubeState())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            Reset Solved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 2D Net Arrangement (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Standard 2D Cube Net
            </span>
            <span className="text-[11px] text-slate-500">
              U on top • L-F-R-B row • D on bottom
            </span>
          </div>

          {/* Net Grid */}
          <div className="flex flex-col items-center gap-2 select-none">
            {/* Top Row: U */}
            <div className="flex justify-center w-full">
              {renderFaceGrid('U', 'Up (White)')}
            </div>

            {/* Middle Row: L, F, R, B */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full justify-center">
              {renderFaceGrid('L', 'Left (Orange)')}
              {renderFaceGrid('F', 'Front (Green)')}
              {renderFaceGrid('R', 'Right (Red)')}
              {renderFaceGrid('B', 'Back (Blue)')}
            </div>

            {/* Bottom Row: D */}
            <div className="flex justify-center w-full">
              {renderFaceGrid('D', 'Down (Yellow)')}
            </div>
          </div>
        </div>

        {/* Sidebar Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Color Brush Palette */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Paintbrush className="w-4 h-4 text-indigo-400" />
              Select Paint Color
            </div>
            <p className="text-[11px] text-slate-400">
              Select an active color, then click stickers on the net to correct them.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => {
                const isSelected = selectedColor === color
                const count = colorCounts[color]
                const isCountValid = count === 9

                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-md border border-black/40 shadow-sm mb-1"
                      style={{ backgroundColor: COLOR_HEX[color] }}
                    />
                    <span className="text-[11px] font-semibold text-slate-200">
                      {COLOR_NAMES[color]}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isCountValid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {count}/9
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Validation Status Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {validation?.is_valid ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                )}
                Solvability Status
              </span>

              {isValidating && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              )}
            </div>

            {validation?.is_valid ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Configuration Solvable!
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  All 54 stickers, color counts, edge/corner orientations, and permutation parity are valid.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Not Yet Solvable ({validation?.errors.length || 0} issues)
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-200/90">
                  {validation?.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {solveError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {solveError}
              </div>
            )}

            {/* Solve Button */}
            <button
              onClick={handleSolve}
              disabled={!validation?.is_valid || isSolving}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                validation?.is_valid && !isSolving
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isSolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Optimal Solution...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate 3D Solution
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
