import { useState, useCallback, useEffect } from 'react'
import { Canvas } from './canvas'
import { SvgDrawing } from './svg-drawing'
import { apiBaseUrl } from '../libs/constant'

interface ImageOption {
  value: string
  label: string
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const drawingMethod = 'svg' // 'canvas'

export function App() {
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingStatus, setDrawingStatus] = useState<string>('')
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchImageOptions = async () => {
      try {
        setIsLoadingOptions(true)
        setOptionsError(null)

        const response = await fetch(`${apiBaseUrl}/images`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const options = data.images.map((image: string) => ({
          value: image,
          label: toTitleCase(image),
        }))

        setImageOptions(options)

        // Set the first option as default if current selection is not available
        if (
          options.length > 0 &&
          !options.find((opt: ImageOption) => opt.value === selectedImage)
        ) {
          setSelectedImage(options[0].value as string)
        }
      } catch (error) {
        console.error('Failed to fetch image options:', error)
        setOptionsError('Failed to load image options')
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchImageOptions()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-5xl pt-8 pb-4">
        <div className="sticky top-0 left-0 z-10 mb-4 bg-slate-100 px-4 pb-4 text-center">
          {!isDrawing ? (
            <div className="mb-2">
              <label
                htmlFor="imageSelect"
                className="mb-2 block text-lg font-medium"
              >
                Choose an image:
              </label>
              {optionsError ? (
                <div className="mb-2 text-sm text-red-500">{optionsError}</div>
              ) : null}
              <select
                id="imageSelect"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value as string)}
                disabled={isLoadingOptions}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {isLoadingOptions ? (
                  <option value="">Loading...</option>
                ) : (
                  imageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={handleStartDrawing}
                disabled={isLoadingOptions || imageOptions.length === 0}
                className="ml-2 rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoadingOptions ? 'Loading...' : 'Start Drawing'}
              </button>
            </div>
          ) : (
            <div className="text-center text-xl font-semibold">
              {drawingStatus}
            </div>
          )}
        </div>
        {drawingMethod === 'svg' ? (
          <SvgDrawing
            selectedImage={selectedImage}
            isDrawing={isDrawing}
            onDrawingComplete={handleDrawingComplete}
            onDrawingProgress={handleDrawingProgress}
          />
        ) : (
          <Canvas
            selectedImage={selectedImage}
            isDrawing={isDrawing}
            onDrawingComplete={handleDrawingComplete}
            onDrawingProgress={handleDrawingProgress}
          />
        )}
      </main>

      <footer className="mx-auto flex max-w-5xl justify-center space-x-2 p-4 text-center text-sm font-medium text-slate-500">
        <p>
          Images by{' '}
          <a
            href="https://www.youtube.com/@artbycode"
            className="text-blue-600 underline"
            target="_blank"
          >
            Art by Code
          </a>
        </p>
        <span>|</span>
        <p>
          Source code on{' '}
          <a
            href="https://github.com/hendraaagil/drawer"
            className="text-blue-600 underline"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
