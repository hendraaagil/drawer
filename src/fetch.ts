import type { Images } from './type'
import { triggerConfetti } from './confetti'
import { drawingCache } from './cache'

const baseUrl = 'https://api.drawer.hndr.xyz'

export async function fetchAndAnimate(file: Images): Promise<void> {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  const statusText = document.getElementById('status') as HTMLDivElement

  // Clear canvas and reset transform
  ctx!.setTransform(1, 0, 0, 1, 0, 0)
  ctx!.clearRect(0, 0, canvas.width, canvas.height)

  statusText!.textContent = '🖌️ Drawing in progress...'

  // Try to get data from cache first
  let coordinates: number[][][]
  let colours: number[][]

  const cachedData = await drawingCache.get(file)
  if (cachedData) {
    statusText!.textContent = '📦 Loading from cache...'
    coordinates = cachedData.coordinates
    colours = cachedData.colours
  } else {
    statusText!.textContent = '🌐 Fetching from server...'
    const res = await fetch(`${baseUrl}/coordinates?file=${file}`)
    const data = await res.json()
    coordinates = data.coordinates
    colours = data.colours

    // Cache the response for future use
    await drawingCache.set(file, coordinates, colours)
  }

  statusText!.textContent = '🖌️ Drawing in progress...'

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
    const padding = 100

    canvas.width = maxX - minX + padding * 2
    canvas.height = maxY - minY + padding * 2
    ctx!.translate(-minX + padding, -minY + padding)

    let shapeIndex = 0
    let pointIndex = 1
    let path = coordinates[shapeIndex]
    let color = colours[shapeIndex].map((c: number) => Math.floor(c * 255))

    ctx!.beginPath()
    ctx!.moveTo(path[0][0], path[0][1])

    function drawNextSegment() {
      if (shapeIndex >= coordinates.length) {
        statusText!.textContent = '✅ Drawing complete!'
        triggerConfetti()
        resolve() // Resolve the Promise when drawing is actually complete
        return
      }

      let stepsPerFrame = 5

      for (let i = 0; i < stepsPerFrame; i++) {
        if (pointIndex < path.length) {
          const [x, y] = path[pointIndex]
          ctx!.lineTo(x, y)
          ctx!.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
          ctx!.stroke()
          pointIndex++
        } else {
          // Finish this shape
          ctx!.closePath()
          ctx!.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
          ctx!.fill()

          shapeIndex++
          if (shapeIndex < coordinates.length) {
            path = coordinates[shapeIndex]
            color = colours[shapeIndex].map((c: number) => Math.floor(c * 255))
            pointIndex = 1
            ctx!.beginPath()
            ctx!.moveTo(path[0][0], path[0][1])
          }
          break
        }
      }

      requestAnimationFrame(drawNextSegment)
    }

    drawNextSegment()
  })
}
