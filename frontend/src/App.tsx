import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { LandingPage } from './pages/LandingPage'
import { UploadPage } from './pages/UploadPage'
import { ReviewPage } from './pages/ReviewPage'
import { SolutionPage } from './pages/SolutionPage'
import type {
  CubeState,
  PageView,
  ScanResponse,
  SolveResponse,
} from './types/cube'
import { createSolvedCubeState } from './constants/cubeConstants'
import { fetchDemoCube } from './services/api'
import { Box } from 'lucide-react'

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('landing')
  const [cubeState, setCubeState] = useState<CubeState>(createSolvedCubeState())
  const [initialScrambledState, setInitialScrambledState] = useState<CubeState>(
    createSolvedCubeState()
  )
  const [scanResponse, setScanResponse] = useState<ScanResponse | null>(null)
  const [solution, setSolution] = useState<SolveResponse | null>(null)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)

  // Handle Scan complete from OpenCV pipeline
  const handleScanComplete = (scanData: ScanResponse) => {
    setScanResponse(scanData)
    setCubeState(scanData.cube_state)
    setInitialScrambledState(scanData.cube_state)
    setCurrentPage('review')
  }

  // Handle Demo Mode
  const handleTryDemo = async () => {
    setIsLoadingDemo(true)
    try {
      const demo = await fetchDemoCube(18)
      setCubeState(demo.cube_state)
      setInitialScrambledState(demo.cube_state)
      setSolution(demo.solution)
      setScanResponse(null)
      setCurrentPage('solution')
    } catch (err) {
      console.error('Failed to load demo cube:', err)
      alert('Could not fetch demo cube from backend. Is the backend server running?')
    } finally {
      setIsLoadingDemo(false)
    }
  }

  // Handle Solve complete
  const handleSolveComplete = (sol: SolveResponse) => {
    setSolution(sol)
    setInitialScrambledState(cubeState)
    setCurrentPage('solution')
  }

  const handleTryAnother = () => {
    setCubeState(createSolvedCubeState())
    setScanResponse(null)
    setSolution(null)
    setCurrentPage('upload')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onTryDemo={handleTryDemo}
        hasCubeState={!!cubeState}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoadingDemo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
              <span className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span className="text-sm font-semibold text-white">
                Generating Verified Scramble & Solving...
              </span>
            </div>
          </div>
        )}

        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={setCurrentPage}
            onTryDemo={handleTryDemo}
            demoCubeState={cubeState}
          />
        )}

        {currentPage === 'upload' && (
          <UploadPage
            onScanComplete={handleScanComplete}
            onNavigate={setCurrentPage}
            onTryDemo={handleTryDemo}
          />
        )}

        {currentPage === 'review' && (
          <ReviewPage
            cubeState={cubeState}
            scanResponse={scanResponse}
            onCubeStateChange={setCubeState}
            onSolveComplete={handleSolveComplete}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'solution' && solution && (
          <SolutionPage
            initialCubeState={initialScrambledState}
            solution={solution}
            onNavigate={setCurrentPage}
            onTryAnother={handleTryAnother}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Box className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">CubeSolve</span> —
            AI-Powered 3×3 Rubik’s Cube Solver
          </div>
          <div>
            Built with OpenCV, CIELAB Calibration, Kociemba Two-Phase & React Three Fiber.
          </div>
        </div>
      </footer>
    </div>
  )
}
export default App
