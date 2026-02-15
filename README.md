# 🎉 Punta Cana Bachelor Party Dashboard

An interactive 3D bachelor party dashboard featuring a cigarette with realistic smoke effects built with React Three Fiber and custom GLSL shaders.

## Features

- 🚬 **Interactive 3D Cigarette**: Click to light it up with a glowing ember effect
- 💨 **Realistic Smoke Effect**: Custom fragment shader creates organic, rising smoke
- 🎲 **Random Dares**: Get wild bachelor party dares after lighting the cigarette
- 🌴 **Punta Cana Theme**: Beach-inspired color scheme and tropical vibes
- 🎨 **Modern UI**: Built with Tailwind CSS for a beautiful, responsive design

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **Three.js** - 3D graphics library
- **Tailwind CSS** - Utility-first CSS framework
- **GLSL Shaders** - Custom vertex and fragment shaders for smoke effect

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd punta-cana-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## How to Use

1. **View the Cigarette**: The 3D cigarette is rendered in the center of the screen
2. **Rotate & Zoom**: Click and drag to rotate the view, scroll to zoom in/out
3. **Light It Up**: Click on the cigarette to light it
4. **Watch the Smoke**: See the realistic smoke effect rise from the tip
5. **Get Your Dare**: A random bachelor party dare will appear at the bottom
6. **Get More Dares**: Click the button to get additional dares

## Project Structure

```
punta-cana-dashboard/
├── src/
│   ├── components/
│   │   ├── Cigarette.tsx      # 3D cigarette component
│   │   └── DareDisplay.tsx    # Dare display component
│   ├── shaders/
│   │   ├── smokeVertex.glsl   # Vertex shader for smoke
│   │   └── smokeFragment.glsl # Fragment shader for smoke
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles
│   └── vite-env.d.ts          # Type definitions
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Shader Details

The smoke effect uses custom GLSL shaders:

- **Vertex Shader**: Creates turbulent rising motion with expansion as smoke rises
- **Fragment Shader**: Uses noise functions to create organic smoke patterns with wispy edges

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## License

MIT

## Party Responsibly! 🍻

Remember: This is for entertainment purposes. Always drink responsibly and look out for your friends!
