# Image Drawer

A beautiful animated drawing application that brings images to life with smooth line animations. Watch as complex drawings are created step by step with realistic drawing motion.

![Image Drawer Preview](/public/open-graph.png)

## ✨ Features

- **Animated Drawing**: Watch images being drawn line by line with smooth animations
- **Multiple Images**: Choose from various pre-made images to draw
- **SVG & Canvas Support**: Dual rendering engines for optimal performance
- **Smart Caching**: Drawings are cached locally for faster subsequent loads
- **Download Options**: Save your drawings as SVG or PNG files
- **Confetti Celebration**: Enjoy a fun celebration when drawings complete
- **Responsive Design**: Works beautifully on desktop and mobile devices

## 🚀 Live Demo

Visit the live application at: [https://drawer.hndr.xyz/](https://drawer.hndr.xyz/)

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Drawing**: SVG.js for vector graphics, HTML5 Canvas
- **Animation**: RequestAnimationFrame for smooth 60fps animations
- **Caching**: IndexedDB for local storage
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 🏃‍♂️ Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/hendraaagil/drawer.git
   cd drawer
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the development server**:

   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

## 🎯 How It Works

1. Select an image from the dropdown menu
2. Click "Start Drawing" to begin the animation
3. Watch as the drawing unfolds with realistic line-by-line animation
4. Download your completed drawing as SVG or PNG

The app fetches coordinate data from a backend API and uses smart caching to improve performance on subsequent loads.

## 🎨 Credits

- Images provided by [Art by Code](https://www.youtube.com/@artbycode)
- Built by [Hendra Agil](https://github.com/hendraaagil)
