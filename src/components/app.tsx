import { useState, useCallback } from 'react'
import type { Images } from '../libs/types'
import { Canvas } from './canvas'

const imageOptions: { value: Images; label: string }[] = [
  { value: 'naruto', label: 'Naruto' },
  { value: 'tulips', label: 'Tulips' },
]

export function App() {
  const [selectedImage, setSelectedImage] = useState<Images>('naruto')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingStatus, setDrawingStatus] = useState<string>('')

  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true)
    setDrawingStatus('Drawing in progress...')
  }, [])

  const handleDrawingComplete = useCallback(() => {
    setIsDrawing(false)
    setDrawingStatus('')
  }, [])

  const handleDrawingProgress = useCallback((status: string) => {
    setDrawingStatus(status)
  }, [])

  return (
    <div className="bg-slate-100 min-h-screen">
      <main className="mx-auto max-w-5xl py-8 px-4 overflow-x-auto">
        <div className="text-center mb-4 sticky top-0 left-0 z-10 bg-slate-100 pb-4">
          {!isDrawing ? (
            <div className="mb-2">
              <label
                htmlFor="fileSelect"
                className="block text-lg font-medium mb-2"
              >
                Choose an image:
              </label>
              <select
                id="fileSelect"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value as Images)}
                className="px-4 py-2 border border-slate-300 rounded-md bg-white"
              >
                {imageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartDrawing}
                className="ml-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Start Drawing
              </button>
            </div>
          ) : (
            <div className="text-xl font-semibold text-center">
              {drawingStatus}
            </div>
          )}
        </div>
        <Canvas
          selectedImage={selectedImage}
          isDrawing={isDrawing}
          onDrawingComplete={handleDrawingComplete}
          onDrawingProgress={handleDrawingProgress}
        />
      </main>
    </div>
  )
}
