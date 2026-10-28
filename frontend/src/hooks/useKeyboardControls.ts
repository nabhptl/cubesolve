import { useEffect } from 'react'

interface KeyboardControlActions {
  onNext?: () => void
  onPrev?: () => void
  onPlayToggle?: () => void
  onRestart?: () => void
}

export function useKeyboardControls({
  onNext,
  onPrev,
  onPlayToggle,
  onRestart,
}: KeyboardControlActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext?.()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        onPlayToggle?.()
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        onRestart?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onPlayToggle, onRestart])
}
