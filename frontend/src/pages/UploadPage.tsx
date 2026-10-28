import React, { useState, useRef } from 'react'
import {
  Camera,
  Upload,
  RotateCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { Face, PageView, ScanResponse } from '../types/cube'
import { FACES, FACE_INFO, COLOR_HEX } from '../constants/cubeConstants'
import { scanBase64Photos } from '../services/api'

interface UploadPageProps {
  onScanComplete: (scanData: ScanResponse) => void
  onNavigate: (page: PageView) => void
  onTryDemo: () => void
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onScanComplete,
  onNavigate,
  onTryDemo,
}) => {
  const [images, setImages] = useState<Record<Face, string>>({
    U: '',
    R: '',
    F: '',
    D: '',
    L: '',
    B: '',
  })
  const [rotations, setRotations] = useState<Record<Face, number>>({
    U: 0,
    R: 0,
    F: 0,
    D: 0,
    L: 0,
    B: 0,
  })
  const [isScanning, setIsScanning] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeCameraFace, setActiveCameraFace] = useState<Face | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRefs = useRef<Record<Face, HTMLInputElement | null>>({
    U: null,
    R: null,
    F: null,
    D: null,
    L: null,
    B: null,
  })

  const uploadedCount = FACES.filter((f) => !!images[f]).length

  // Handle file select
  const handleFileChange = (face: Face, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const b64 = event.target?.result as string
      setImages((prev) => ({ ...prev, [face]: b64 }))
      setRotations((prev) => ({ ...prev, [face]: 0 }))
      setErrorMsg(null)
    }
    reader.readAsDataURL(file)
  }

  // Rotate image by 90 degrees
  const handleRotate = (face: Face) => {
    setRotations((prev) => ({
      ...prev,
      [face]: (prev[face] + 90) % 360,
    }))
  }

  // Delete image
  const handleDelete = (face: Face) => {
    setImages((prev) => ({ ...prev, [face]: '' }))
    setRotations((prev) => ({ ...prev, [face]: 0 }))
    if (fileInputRefs.current[face]) {
      fileInputRefs.current[face]!.value = ''
    }
  }

  // Camera capture modal
  const openCamera = async (face: Face) => {
    setActiveCameraFace(face)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      setErrorMsg('Camera access denied or unavailable. Please upload an image file instead.')
      setActiveCameraFace(null)
    }
  }

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setActiveCameraFace(null)
  }

  const capturePhoto = (face: Face) => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setImages((prev) => ({ ...prev, [face]: dataUrl }))
      setRotations((prev) => ({ ...prev, [face]: 0 }))
    }
    closeCamera()
  }

  // Rotate base64 image on canvas if rotation applied
  const applyRotationToDataUrl = (
    dataUrl: string,
    deg: number
  ): Promise<string> => {
    if (deg === 0) return Promise.resolve(dataUrl)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }

        if (deg === 90 || deg === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((deg * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = dataUrl
    })
  }

  // Scan faces via CV pipeline
  const handleScan = async () => {
    if (uploadedCount < 6) {
      setErrorMsg('Please upload photographs for all 6 faces before scanning.')
      return
    }

    setIsScanning(true)
    setErrorMsg(null)

    try {
      // Process rotations if any
      const rotatedPayload: Record<Face, string> = { ...images }
      for (const face of FACES) {
        if (rotations[face] !== 0) {
          rotatedPayload[face] = await applyRotationToDataUrl(
            images[face],
            rotations[face]
          )
        }
      }

      const scanResult = await scanBase64Photos(rotatedPayload)
      onScanComplete(scanResult)
      onNavigate('review')
    } catch (err: any) {
      console.error('Scan failed:', err)
      setErrorMsg(
        err.message || 'Vision pipeline encountered an error. Please verify photos and try again.'
      )
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Top Banner & Orientation Guide */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              Upload 6 Cube Face Photographs
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Follow our consistent orientation convention below so all six faces map correctly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {uploadedCount} / 6 Uploaded
            </span>

            <button
              onClick={handleScan}
              disabled={uploadedCount < 6 || isScanning}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                uploadedCount === 6 && !isScanning
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Computer Vision...
                </>
              ) : (
                <>
                  Scan All Faces
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Orientation Convention Box */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400" />
            Standard Western Orientation Convention:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-slate-300">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-emerald-400">1. Front (Green):</span> Hold with White on top, Green facing you.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-rose-400">2. Right (Red):</span> Rotate 90° right. Red faces you, White stays top.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-blue-400">3. Back (Blue):</span> Rotate 90° right again. Blue faces you, White top.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-orange-400">4. Left (Orange):</span> Rotate 90° right again. Orange faces you, White top.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-slate-200">5. Up (White):</span> From Front, tilt downward 90°. White faces you, Blue top.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-amber-300">6. Down (Yellow):</span> From Front, tilt upward 90°. Yellow faces you, Green top.
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* 6 Upload Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FACES.map((face) => {
          const info = FACE_INFO[face]
          const imgUrl = images[face]
          const rotation = rotations[face]

          return (
            <div
              key={face}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                imgUrl
                  ? 'bg-slate-900/80 border-slate-700 shadow-md'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: COLOR_HEX[info.color] }}
                    />
                    <span className="font-bold text-sm text-white">
                      {face} — {info.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    Step {info.stepNumber}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 min-h-[32px] leading-relaxed">
                  {info.instruction}
                </p>

                {/* Preview or Upload Zone */}
                {imgUrl ? (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
                    <img
                      src={imgUrl}
                      alt={`${info.name} preview`}
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleRotate(face)}
                        title="Rotate 90° clockwise"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-600 transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => fileInputRefs.current[face]?.click()}
                        title="Replace photo"
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(face)}
                        title="Delete photo"
                        className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.current[face]?.click()}
                    className="aspect-square w-full rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-950/80 cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 group-hover:bg-indigo-500/10 border border-slate-800 group-hover:border-indigo-500/30 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      Upload or Capture Photo
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      PNG, JPG up to 10MB
                    </span>
                  </div>
                )}

                <input
                  ref={(el) => {
                    fileInputRefs.current[face] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(face, e)}
                />
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => openCamera(face)}
                  className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[11px] transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Live Camera
                </button>

                {imgUrl && (
                  <button
                    onClick={() => handleRotate(face)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate ({rotation}°)
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Want to test the full pipeline immediately without uploading 6 photos?
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onTryDemo}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Use Predefined Scrambled Demo
          </button>

          <button
            onClick={handleScan}
            disabled={uploadedCount < 6 || isScanning}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              uploadedCount === 6 && !isScanning
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                Scan All Faces
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Camera Modal */}
      {activeCameraFace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                Capture {FACE_INFO[activeCameraFace].name}
              </h3>
              <button
                onClick={closeCamera}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Center 3x3 alignment guide overlay */}
              <div className="absolute inset-12 border-2 border-dashed border-white/60 pointer-events-none rounded grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Align the cube face within the square frame and press Capture.
            </p>

            <button
              onClick={() => capturePhoto(activeCameraFace)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
