import React from 'react'
import { Box, Play, Upload, CheckCircle2, Sparkles } from 'lucide-react'
import type { PageView } from '../types/cube'

interface NavbarProps {
  currentPage: PageView
  onNavigate: (page: PageView) => void
  onTryDemo: () => void
  hasCubeState: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onTryDemo,
  hasCubeState,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              CubeSolve
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                AI Vision
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Step Pills */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'landing'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentPage === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            1. Scan Faces
          </button>
          <button
            onClick={() => onNavigate('review')}
            disabled={!hasCubeState}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentPage === 'review'
                ? 'bg-indigo-600 text-white shadow-sm'
                : hasCubeState
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            2. Review Net
          </button>
          <button
            onClick={() => onNavigate('solution')}
            disabled={!hasCubeState}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentPage === 'solution'
                ? 'bg-indigo-600 text-white shadow-sm'
                : hasCubeState
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            3. 3D Solution
          </button>
        </div>

        {/* Demo button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTryDemo}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:border-indigo-500/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Try Demo Cube
          </button>
        </div>
      </div>
    </header>
  )
}
