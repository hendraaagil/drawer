import { useState, useCallback, useEffect } from 'react'
import { Canvas } from './canvas'
import { apiBaseUrl } from '../libs/constant'

interface ImageOption {
  value: string
  label: string
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

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
    <div className="bg-slate-100 min-h-screen">
      <main className="mx-auto max-w-5xl py-8 px-4 overflow-x-auto">
        <div className="text-center mb-4 sticky top-0 left-0 z-10 bg-slate-100 pb-4">
          {!isDrawing ? (
            <div className="mb-2">
              <label
                htmlFor="imageSelect"
                className="block text-lg font-medium mb-2"
              >
                Choose an image:
              </label>
              {optionsError ? (
                <div className="text-red-500 mb-2 text-sm">{optionsError}</div>
              ) : null}
              <select
                id="imageSelect"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value as string)}
                disabled={isLoadingOptions}
                className="px-4 py-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-100 disabled:text-slate-500"
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
                className="ml-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isLoadingOptions ? 'Loading...' : 'Start Drawing'}
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

      <footer className="flex max-w-5xl p-4 mx-auto justify-center space-x-2 text-sm font-medium text-slate-500">
        <p>
          Art by{' '}
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
