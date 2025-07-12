import { useRef, useEffect, useCallback } from 'react'
import { SVG } from '@svgdotjs/svg.js'

import { drawingCache } from '../libs/cache'
import { triggerConfetti } from '../libs/confetti'
import { apiBaseUrl } from '../libs/constant'

interface SvgDrawingProps {
  selectedImage: string
  isDrawing: boolean
  onDrawingComplete: () => void
  onDrawingProgress: (status: string) => void
}

export function SvgDrawing({
  selectedImage,
  isDrawing,
  onDrawingComplete,
  onDrawingProgress,
}: SvgDrawingProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const downloadSVG = useCallback(() => {
    const container = svgContainerRef.current
    if (!container) return

    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    const svgData = svgElement.outerHTML
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedImage.split('.')[0]}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [selectedImage])

  const downloadPNG = useCallback(() => {
    const container = svgContainerRef.current
    if (!container) return

    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match SVG
    canvas.width = svgRect.width * 2 // Higher resolution
    canvas.height = svgRect.height * 2
    ctx.scale(2, 2)

    // Convert SVG to image
    const svgData = svgElement.outerHTML
    const img = new Image()

    img.onload = () => {
      // Fill background white
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the SVG
      ctx.drawImage(img, 0, 0)

      // Download as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${selectedImage.split('.')[0]}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    img.src = url
  }, [selectedImage])

  const fetchAndAnimate = useCallback(
    async (image: string) => {
      const container = svgContainerRef.current
      if (!container) return

      // Clear previous drawing
      container.innerHTML = ''
      onDrawingProgress('🖌️ Drawing in progress...')

      let coordinates: number[][][]
      let colours: number[][]

      const cachedData = await drawingCache.get(image)
      if (cachedData) {
        onDrawingProgress('📦 Loading from cache...')
        coordinates = cachedData.coordinates
        colours = cachedData.colours
      } else {
        onDrawingProgress('🌐 Fetching from server...')
        const res = await fetch(`${apiBaseUrl}/coordinates?image=${image}`)
        const data = await res.json()
        coordinates = data.coordinates
        colours = data.colours
        await drawingCache.set(image, coordinates, colours)
      }

      onDrawingProgress('🖌️ Drawing in progress...')

      // Get bounding box
      const allPoints = coordinates.flat()
      const xs = allPoints.map(([x]) => x)
      const ys = allPoints.map(([, y]) => y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const padding = 80

      const width = maxX - minX + padding * 2
      const height = maxY - minY + padding * 2

      const draw = SVG().addTo(container).size(width, height)
      draw.viewbox(minX - padding, minY - padding, width, height)

      // Return a Promise that resolves when drawing is complete
      return new Promise<void>((resolve) => {
        let shapeIndex = 0
        let pointIndex = 1
        let path = coordinates[shapeIndex]
        let color = colours[shapeIndex].map((c) => Math.floor(c * 255))
        let hex = `rgb(${color[0]}, ${color[1]}, ${color[2]})`

        // Create initial path for the first shape
        let currentPath = draw
          .path(`M${path[0][0]},${path[0][1]}`)
          .fill('none')
          .stroke({ width: 1.2, color: hex })

        function drawNextSegment() {
          if (shapeIndex >= coordinates.length) {
            onDrawingProgress('✅ Drawing complete!')
            triggerConfetti()
            resolve()
            return
          }

          const stepsPerFrame = 10 // Animation speed

          for (let i = 0; i < stepsPerFrame; i++) {
            if (pointIndex < path.length) {
              const [x, y] = path[pointIndex]
              // Extend the current path
              const currentD = currentPath.attr('d')
              currentPath.attr('d', `${currentD}L${x},${y}`)
              pointIndex++
            } else {
              // Finish this shape by closing the path and filling it
              const currentD = currentPath.attr('d')
              currentPath.attr('d', `${currentD}Z`)
              currentPath.fill(hex)

              shapeIndex++
              if (shapeIndex < coordinates.length) {
                // Start next shape
                path = coordinates[shapeIndex]
                color = colours[shapeIndex].map((c) => Math.floor(c * 255))
                hex = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                pointIndex = 1

                // Create new path for next shape
                currentPath = draw
                  .path(`M${path[0][0]},${path[0][1]}`)
                  .fill('none')
                  .stroke({ width: 1.2, color: hex })
              }
              break
            }
          }

          animationRef.current = requestAnimationFrame(drawNextSegment)
        }

        drawNextSegment()
      })
    },
    [onDrawingProgress],
  )

  useEffect(() => {
    if (isDrawing) {
      fetchAndAnimate(selectedImage).then(() => {
        onDrawingComplete()
      })
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isDrawing, selectedImage, fetchAndAnimate, onDrawingComplete])

  return (
    <div className="flex flex-col items-center overflow-auto px-4">
      <div
        ref={svgContainerRef}
        className="mb-4 flex min-h-64 w-full justify-center overflow-x-auto border border-slate-300 bg-white"
      />

      {svgContainerRef.current?.querySelector('svg') && !isDrawing && (
        <div className="sticky top-0 left-0 z-10 w-full bg-slate-100 pb-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={downloadSVG}
              className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              📥 Download SVG
            </button>
            <button
              onClick={downloadPNG}
              className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
            >
              📥 Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
