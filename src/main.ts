import type { Images } from './type'
import { fetchAndAnimate } from './fetch'

const fileSelect = document.getElementById('fileSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement
const controlsDiv = document.getElementById('controls') as HTMLDivElement
const statusDiv = document.getElementById('status') as HTMLDivElement

function showControls() {
  controlsDiv.classList.remove('hidden')
  statusDiv.classList.add('hidden')
}

function showStatus() {
  controlsDiv.classList.add('hidden')
  statusDiv.classList.remove('hidden')
}

startButton.addEventListener('click', () => {
  const selectedFile = fileSelect.value as Images

  // Show status and hide controls
  showStatus()

  fetchAndAnimate(selectedFile).then(() => {
    // Show controls and hide status after drawing is complete
    showControls()
  })
})
