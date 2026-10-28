import React from 'react'
import {
  Camera,
  Cpu,
  CheckCircle2,
  Play,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react'
import { RubiksCube3D } from '../three/RubiksCube3D'
import type { CubeState, PageView } from '../types/cube'

interface LandingPageProps {
  onNavigate: (page: PageView) => void
  onTryDemo: () => void
  demoCubeState: CubeState
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onTryDemo,
  demoCubeState,
}) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Two-Phase Algorithm & Relative LAB Calibration
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Scan. Solve.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Master Your Cube.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Upload six photographs of any scrambled 3×3 Rubik’s Cube. Our
              OpenCV vision pipeline detects sticker contours, performs
              homography correction, and calculates a verified, optimal solution.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('upload')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:-translate-y-0.5"
              >
                Start Solving
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onTryDemo}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm border border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Try Demo Cube
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Physical Parity Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Kociemba Two-Phase</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Interactive 3D Guidance</span>
              </div>
            </div>
          </div>

          {/* Right 3D Visualizer */}
          <div className="lg:col-span-5 h-[380px] sm:h-[440px] rounded-2xl bg-slate-950/70 border border-slate-800/80 relative overflow-hidden shadow-2xl flex items-center justify-center">
            <RubiksCube3D cubeState={demoCubeState} autoRotate={true} />
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Interactive 3D Engine
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How CubeSolve Works
          </h2>
          <p className="text-sm text-slate-400">
            A complete pipeline combining computer vision, discrete mathematics,
            and real-time 3D graphics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">
              1. 6-Face Computer Vision
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects cube boundaries, applies perspective homography to square
              grids, samples the central core of each sticker, and classifies
              colors in perceptual CIELAB and HSV space.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">
              2. 2D Net & Physical Parity
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review all 54 stickers on a standard 2D net. Manually correct any
              uncertain stickers. The engine enforces 9 of each color, corner
              twist sums, edge flip parity, and total permutation parity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">
              3. Verified 3D Move Solver
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates the solution using Kociemba’s proven two-phase algorithm
              (sub-24 moves), simulates every move to mathematically verify
              solved state, and renders step-by-step 3D animations.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
