import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowLeft,
  RotateCw,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { RubiksCube3D } from '../three/RubiksCube3D'
import type { CubeState, PageView, SolveResponse } from '../types/cube'
import { simulateAllMoves } from '../utils/cubeEngine'
import { useKeyboardControls } from '../hooks/useKeyboardControls'

interface SolutionPageProps {
  initialCubeState: CubeState
  solution: SolveResponse
  onNavigate: (page: PageView) => void
  onTryAnother: () => void
}

export const SolutionPage: React.FC<SolutionPageProps> = ({
  initialCubeState,
  solution,
  onNavigate,
  onTryAnother,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1.0) // 0.5, 1.0, 2.0
  const [animatingInfo, setAnimatingInfo] = useState<{
    move: string
    direction: 1 | -1
  } | null>(null)

  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep

  const speedRef = useRef(speed)
  speedRef.current = speed

  // Precompute states at every move step: step 0 = initial, step N = solved!
  const stateHistory = useMemo(() => {
    return simulateAllMoves(initialCubeState, solution.moves)
  }, [initialCubeState, solution.moves])

  const totalMoves = solution.moves.length
  const isComplete = currentStep === totalMoves

  // Trigger celebration confetti when solved
  useEffect(() => {
    if (isComplete && totalMoves > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [isComplete, totalMoves])

  // Duration in seconds for face rotation animation
  const animationDuration = Math.max(0.12, 0.35 / speed)

  // Callback when a 3D layer rotation finishes
  const handleAnimationComplete = () => {
    if (!animatingInfo) return

    if (animatingInfo.direction === 1) {
      const nextStep = currentStepRef.current + 1
      setCurrentStep(nextStep)
      setAnimatingInfo(null)

      if (isPlayingRef.current) {
        if (nextStep < totalMoves) {
          const pauseDelay = Math.max(60, 150 / speedRef.current)
          setTimeout(() => {
            if (isPlayingRef.current) {
              setAnimatingInfo({
                move: solution.moves[nextStep],
                direction: 1,
              })
            }
          }, pauseDelay)
        } else {
          setIsPlaying(false)
        }
      }
    } else {
      const prevStep = currentStepRef.current - 1
      setCurrentStep(prevStep)
      setAnimatingInfo(null)
    }
  }

  // Next move button
  const handleNext = () => {
    if (animatingInfo || currentStep >= totalMoves) return
    setAnimatingInfo({
      move: solution.moves[currentStep],
      direction: 1,
    })
  }

  // Previous move button
  const handlePrev = () => {
    if (animatingInfo || currentStep <= 0) return
    setAnimatingInfo({
      move: solution.moves[currentStep - 1],
      direction: -1,
    })
  }

  // Restart button
  const handleRestart = () => {
    setIsPlaying(false)
    setAnimatingInfo(null)
    setCurrentStep(0)
  }

  // Toggle play/pause
  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      let startStep = currentStep
      if (isComplete) {
        setCurrentStep(0)
        startStep = 0
      }
      setIsPlaying(true)
      if (startStep < totalMoves && !animatingInfo) {
        setAnimatingInfo({
          move: solution.moves[startStep],
          direction: 1,
        })
      }
    }
  }

  // Keyboard shortcut navigation: Left/Right arrow, Space to play/pause, R to restart
  useKeyboardControls({
    onNext: handleNext,
    onPrev: handlePrev,
    onPlayToggle: handlePlayToggle,
    onRestart: handleRestart,
  })

  // The active move to display
  const activeMove = animatingInfo
    ? animatingInfo.move
    : currentStep > 0
    ? solution.moves[currentStep - 1]
    : null

  const activeMoveIndex = animatingInfo
    ? animatingInfo.direction === 1
      ? currentStep
      : currentStep - 1
    : currentStep > 0
    ? currentStep - 1
    : null

  const currentExplanation =
    activeMoveIndex !== null && solution.explanations[activeMoveIndex]
      ? solution.explanations[activeMoveIndex].description
      : currentStep === 0
      ? 'Scrambled initial cube state'
      : 'Solved state reached!'

  const nextMove =
    currentStep < totalMoves ? solution.moves[currentStep] : null

  // State to feed to 3D cube: during animation, display current step state while face rotates
  const displayedCubeState = stateHistory[currentStep] || initialCubeState

  return (
    <div className="space-y-6 py-4 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Interactive 3D Solution with Rotating Side Animations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculated via Kociemba Two-Phase algorithm ({totalMoves} moves).
            Watch the 3D cube faces physically rotate smoothly step by step.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('review')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Edit Net
          </button>

          <button
            onClick={onTryAnother}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            Solve Another Cube
          </button>
        </div>
      </div>

      {/* Main Solution Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* 3D Cube Canvas with Layer Rotation Animation (7 cols) */}
        <div className="lg:col-span-7 h-[420px] sm:h-[480px] rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden shadow-2xl flex items-center justify-center">
          <RubiksCube3D
            cubeState={displayedCubeState}
            interactive={true}
            animatingMove={animatingInfo?.move || null}
            animationDirection={animatingInfo?.direction || 1}
            animationDuration={animationDuration}
            onAnimationComplete={handleAnimationComplete}
          />

          {/* Solved celebration banner */}
          {isComplete && !animatingInfo && (
            <div className="absolute inset-x-6 top-6 p-4 rounded-2xl bg-emerald-500/90 backdrop-blur text-white flex items-center justify-between shadow-2xl animate-fade-in border border-emerald-400/50">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-300 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">Cube Fully Solved!</h4>
                  <p className="text-xs text-emerald-100">
                    All 54 stickers match their center color.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-xs font-semibold"
              >
                Replay Solution
              </button>
            </div>
          )}

          {/* Step badge overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <span className="font-bold text-white">
              Step {currentStep} / {totalMoves}
            </span>
            <span className="text-slate-500">•</span>
            {animatingInfo ? (
              <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Rotating: {animatingInfo.move}
              </span>
            ) : (
              <span className="text-indigo-300 font-semibold">
                {currentStep === 0
                  ? 'Start'
                  : isComplete
                  ? 'Solved'
                  : `Move: ${activeMove}`}
              </span>
            )}
          </div>
        </div>

        {/* Controls & Move Explanation Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Move Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Move Instruction
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {currentStep === 0 && !animatingInfo
                  ? 'Ready'
                  : isComplete && !animatingInfo
                  ? 'Complete'
                  : `Move ${
                      (activeMoveIndex !== null ? activeMoveIndex + 1 : currentStep)
                    } of ${totalMoves}`}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl font-black transition-all ${
                  animatingInfo
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-500/30 scale-105'
                    : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                }`}
              >
                {activeMove || '—'}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white">
                  {animatingInfo
                    ? `Rotating Face ${animatingInfo.move}...`
                    : currentStep === 0
                    ? 'Initial Scrambled Position'
                    : isComplete
                    ? 'Solved State Reached!'
                    : `Executed Move ${activeMove}`}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentExplanation}
                </p>
              </div>
            </div>

            {nextMove && !animatingInfo && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Next Move:</span>
                <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-md">
                  {nextMove}
                </span>
              </div>
            )}
          </div>

          {/* Playback Controls Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Solution Progress</span>
                <span className="font-bold text-indigo-400">
                  {Math.round((currentStep / (totalMoves || 1)) * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={totalMoves}
                value={currentStep}
                onChange={(e) => {
                  setIsPlaying(false)
                  setAnimatingInfo(null)
                  setCurrentStep(parseInt(e.target.value))
                }}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Play/Pause/Skip Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                title="Restart"
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || !!animatingInfo}
                title="Previous Move (Animated Rotation)"
                className={`p-3 rounded-xl border transition-colors ${
                  currentStep > 0 && !animatingInfo
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayToggle}
                title={isPlaying ? 'Pause' : 'Play Animated Solution'}
                className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 fill-white" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={isComplete || !!animatingInfo}
                title="Next Move (Animated Rotation)"
                className={`p-3 rounded-xl border transition-colors ${
                  !isComplete && !animatingInfo
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Speed Toggle */}
              <button
                onClick={() => {
                  if (speed === 1.0) setSpeed(2.0)
                  else if (speed === 2.0) setSpeed(0.5)
                  else setSpeed(1.0)
                }}
                title="Rotation Speed"
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                {speed}x
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Move Sequence List Strip */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Complete Move Sequence ({totalMoves} moves)
          </span>
          <span className="text-[11px] text-slate-500">
            Click any move to jump directly to that step
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {solution.moves.map((move, idx) => {
            const stepNum = idx + 1
            const isCurrent = currentStep === stepNum || (animatingInfo && activeMoveIndex === idx)
            const isPast = currentStep > stepNum

            return (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(false)
                  setAnimatingInfo(null)
                  setCurrentStep(stepNum)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105 z-10'
                    : isPast
                    ? 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[9px] text-slate-500 mr-1">#{stepNum}</span>
                {move}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
