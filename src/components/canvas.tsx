import { useRef, useEffect, useCallback } from 'react'
import { drawingCache } from '../libs/cache'
import { triggerConfetti } from '../libs/confetti'
import { apiBaseUrl } from '../libs/constant'

interface CanvasProps {
  selectedImage: string
  isDrawing: boolean
  onDrawingComplete: () => void
  onDrawingProgress: (status: string) => void
}

export function Canvas({
  selectedImage,
  isDrawing,
  onDrawingComplete,
  onDrawingProgress,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const fetchAndAnimate = useCallback(
    async (image: string): Promise<void> => {
      const canvas = canvasRef.current as HTMLCanvasElement
      if (!canvas) return

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      if (!ctx) return

      // Clear canvas and reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      onDrawingProgress('🖌️ Drawing in progress...')

      // Try to get data from cache first
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

        // Cache the response for future use
        await drawingCache.set(image, coordinates, colours)
      }

      onDrawingProgress('🖌️ Drawing in progress...')

      // Return a Promise that resolves when drawing is complete
      return new Promise<void>((resolve) => {
        // Bounding box logic
        const allPoints = coordinates.flat()
        const xs = allPoints.map((point: number[]) => point[0])
        const ys = allPoints.map((point: number[]) => point[1])
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const padding = 80

        canvas.width = maxX - minX + padding * 2
        canvas.height = maxY - minY + padding * 2
        ctx.translate(-minX + padding, -minY + padding)

        let shapeIndex = 0
        let pointIndex = 1
        let path = coordinates[shapeIndex]
        let color = colours[shapeIndex].map((c: number) => Math.floor(c * 255))

        ctx.beginPath()
        ctx.moveTo(path[0][0], path[0][1])

        function drawNextSegment() {
          if (shapeIndex >= coordinates.length) {
            onDrawingProgress('✅ Drawing complete!')
            triggerConfetti()
            resolve()
            return
          }

          let stepsPerFrame = 5

          for (let i = 0; i < stepsPerFrame; i++) {
            if (pointIndex < path.length) {
              const [x, y] = path[pointIndex]
              ctx.lineTo(x, y)
              ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
              ctx.stroke()
              pointIndex++
            } else {
              // Finish this shape
              ctx.closePath()
              ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
              ctx.fill()

              shapeIndex++
              if (shapeIndex < coordinates.length) {
                path = coordinates[shapeIndex]
                color = colours[shapeIndex].map((c: number) =>
                  Math.floor(c * 255),
                )
                pointIndex = 1
                ctx.beginPath()
                ctx.moveTo(path[0][0], path[0][1])
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
    <canvas
      ref={canvasRef}
      width={512}
      height={512}
      className="border border-slate-400 px-4 mb-4 mx-auto bg-white"
    />
  )
}
