"use client"

import { useEffect, useRef, useCallback } from "react"
import type { GameEngineState } from "@/lib/game/game-engine"

interface GameCanvasProps {
  gameState: GameEngineState
  showPath: boolean
  cellSize?: number
}

const COLORS = {
  background: "#0a0a0f",
  wall: "#1e3a8a",
  wallBorder: "#3b82f6",
  path: "#000000",
  pellet: "#fbbf24",
  powerPellet: "#fbbf24",
  pacman: "#fbbf24",
  ghostFrightened: "#3b82f6",
  ghostDead: "#ffffff",
  pathVisualization: "rgba(59, 130, 246, 0.3)",
  text: "#ffffff",
}

const GHOST_COLORS: Record<string, string> = {
  blinky: "#ef4444",
  pinky: "#f472b6",
  inky: "#22d3ee",
  clyde: "#fb923c",
}

export function GameCanvas({ gameState, showPath, cellSize = 16 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = gameState.isStepByStepMode
    ? gameState.frameHistory[gameState.currentFrameIndex]
    : undefined
  const pacmanPosition = frame?.pacmanPosition ?? gameState.pacman.position
  const pacmanDirection = frame?.pacmanDirection ?? gameState.pacman.direction
  const ghostsToRender = frame?.ghostStates ?? gameState.ghosts

  const drawMaze = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { maze } = gameState

      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          const cell = maze.cells[y][x]
          const px = x * cellSize
          const py = y * cellSize

          if (cell.type === "wall") {
            // Dibujar pared con borde
            ctx.fillStyle = COLORS.wall
            ctx.fillRect(px, py, cellSize, cellSize)

            ctx.strokeStyle = COLORS.wallBorder
            ctx.lineWidth = 1
            ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2)
          } else {
            ctx.fillStyle = COLORS.path
            ctx.fillRect(px, py, cellSize, cellSize)

            // Dibujar pellet
            if (cell.hasPellet) {
              ctx.fillStyle = COLORS.pellet
              ctx.beginPath()
              ctx.arc(px + cellSize / 2, py + cellSize / 2, 2, 0, Math.PI * 2)
              ctx.fill()
            }

            // Dibujar power pellet
            if (cell.hasPowerPellet) {
              ctx.fillStyle = COLORS.powerPellet
              ctx.beginPath()
              ctx.arc(px + cellSize / 2, py + cellSize / 2, 6, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
    },
    [gameState, cellSize],
  )

  const drawPathVisualization = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!showPath || gameState.pathVisualization.length === 0) return

      ctx.fillStyle = COLORS.pathVisualization
      for (const pos of gameState.pathVisualization) {
        ctx.fillRect(pos.x * cellSize + 2, pos.y * cellSize + 2, cellSize - 4, cellSize - 4)
      }

      // Dibujar línea del path
      if (gameState.pathVisualization.length > 1) {
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(
          gameState.pathVisualization[0].x * cellSize + cellSize / 2,
          gameState.pathVisualization[0].y * cellSize + cellSize / 2,
        )
        for (let i = 1; i < gameState.pathVisualization.length; i++) {
          ctx.lineTo(
            gameState.pathVisualization[i].x * cellSize + cellSize / 2,
            gameState.pathVisualization[i].y * cellSize + cellSize / 2,
          )
        }
        ctx.stroke()
      }
    },
    [gameState.pathVisualization, showPath, cellSize],
  )

  const drawPacman = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const px = pacmanPosition.x * cellSize + cellSize / 2
      const py = pacmanPosition.y * cellSize + cellSize / 2
      const radius = cellSize / 2 - 2

      // Ángulo de la boca según dirección
      let startAngle = 0.2
      let endAngle = Math.PI * 2 - 0.2

      switch (pacmanDirection) {
        case "right":
          startAngle = 0.2
          endAngle = Math.PI * 2 - 0.2
          break
        case "left":
          startAngle = Math.PI + 0.2
          endAngle = Math.PI - 0.2
          break
        case "up":
          startAngle = Math.PI * 1.5 + 0.2
          endAngle = Math.PI * 1.5 - 0.2
          break
        case "down":
          startAngle = Math.PI * 0.5 + 0.2
          endAngle = Math.PI * 0.5 - 0.2
          break
        default:
          // Círculo completo cuando está quieto
          startAngle = 0
          endAngle = Math.PI * 2
      }

      ctx.fillStyle = COLORS.pacman
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.arc(px, py, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fill()
    },
    [pacmanPosition, pacmanDirection, cellSize],
  )

  const drawGhost = useCallback(
    (ctx: CanvasRenderingContext2D, ghost: (typeof ghostsToRender)[0]) => {
      const px = ghost.position.x * cellSize + cellSize / 2
      const py = ghost.position.y * cellSize + cellSize / 2
      const radius = cellSize / 2 - 2

      // Color según estado
      let color = GHOST_COLORS[ghost.name]
      if (ghost.state === "FRIGHTENED") {
        color = COLORS.ghostFrightened
      } else if (ghost.state === "DEAD") {
        color = "transparent"
      }

      if (ghost.state !== "DEAD") {
        // Cuerpo del fantasma
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(px, py - 2, radius, Math.PI, 0)
        ctx.lineTo(px + radius, py + radius - 2)

        // Ondas en la parte inferior
        const waves = 3
        const waveWidth = (radius * 2) / waves
        for (let i = 0; i < waves; i++) {
          const x1 = px + radius - i * waveWidth - waveWidth / 2
          const x2 = px + radius - (i + 1) * waveWidth
          ctx.quadraticCurveTo(x1, py + radius - 6, x2, py + radius - 2)
        }

        ctx.closePath()
        ctx.fill()
      }

      // Ojos (siempre visibles)
      const eyeRadius = 3
      const eyeOffsetX = 4
      const eyeOffsetY = -2

      // Ojo izquierdo
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(px - eyeOffsetX, py + eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Ojo derecho
      ctx.beginPath()
      ctx.arc(px + eyeOffsetX, py + eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Pupilas
      ctx.fillStyle = "#000000"
      const pupilOffset = 1
      let pupilX = 0,
        pupilY = 0
      switch (ghost.direction) {
        case "right":
          pupilX = pupilOffset
          break
        case "left":
          pupilX = -pupilOffset
          break
        case "up":
          pupilY = -pupilOffset
          break
        case "down":
          pupilY = pupilOffset
          break
      }

      ctx.beginPath()
      ctx.arc(px - eyeOffsetX + pupilX, py + eyeOffsetY + pupilY, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(px + eyeOffsetX + pupilX, py + eyeOffsetY + pupilY, 1.5, 0, Math.PI * 2)
      ctx.fill()
    },
    [cellSize, ghostsToRender],
  )

  const drawGhosts = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (const ghost of ghostsToRender) {
        drawGhost(ctx, ghost)
      }
    },
    [ghostsToRender, drawGhost],
  )

  const drawUI = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { pacman, session } = gameState
      const canvasWidth = gameState.maze.width * cellSize

      ctx.fillStyle = COLORS.text
      ctx.font = 'bold 14px "Geist Mono", monospace'

      // Score
      ctx.textAlign = "left"
      ctx.fillText(`SCORE: ${pacman.score}`, 10, 20)

      // Lives
      ctx.textAlign = "center"
      ctx.fillText(`LIVES: ${pacman.lives}`, canvasWidth / 2, 20)

      // Level and Time
      ctx.textAlign = "right"
      ctx.fillText(`LEVEL: ${session.level}`, canvasWidth - 10, 20)

      // Real-time counter (below level)
      ctx.fillText(`TIME: ${gameState.elapsedSeconds}s`, canvasWidth - 10, 40)
    },
    [gameState, cellSize],
  )

  const drawGameOver = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvasWidth = gameState.maze.width * cellSize
      const canvasHeight = gameState.maze.height * cellSize

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      ctx.fillStyle = "#ef4444"
      ctx.font = 'bold 32px "Geist", sans-serif'
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2 - 20)

      ctx.fillStyle = "#ffffff"
      ctx.font = '18px "Geist", sans-serif'
      ctx.fillText(`Final Score: ${gameState.pacman.score}`, canvasWidth / 2, canvasHeight / 2 + 20)
      ctx.fillText("Press SPACE to restart", canvasWidth / 2, canvasHeight / 2 + 50)
    },
    [gameState, cellSize],
  )

  const drawVictory = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvasWidth = gameState.maze.width * cellSize
      const canvasHeight = gameState.maze.height * cellSize

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      ctx.fillStyle = "#22c55e"
      ctx.font = 'bold 32px "Geist", sans-serif'
      ctx.textAlign = "center"
      ctx.fillText("¡GANASTE!", canvasWidth / 2, canvasHeight / 2 - 40)

      ctx.fillStyle = "#ffffff"
      ctx.font = '18px "Geist", sans-serif'
      ctx.fillText(`Puntuación Final: ${gameState.pacman.score}`, canvasWidth / 2, canvasHeight / 2)
      ctx.fillText(`Tiempo: ${gameState.elapsedSeconds}s`, canvasWidth / 2, canvasHeight / 2 + 30)

      // Next level instruction
      const currentLevel = gameState.session.level
      if (currentLevel < 5) {
        ctx.fillStyle = "#fbbf24"
        ctx.fillText(`Presiona ESPACIO para Nivel ${currentLevel + 1}`, canvasWidth / 2, canvasHeight / 2 + 70)
      } else {
        ctx.fillStyle = "#fbbf24"
        ctx.fillText("¡Completaste todos los niveles!", canvasWidth / 2, canvasHeight / 2 + 70)
        ctx.fillText("Presiona ESPACIO para reiniciar", canvasWidth / 2, canvasHeight / 2 + 100)
      }
    },
    [gameState, cellSize],
  )

  const drawMenu = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvasWidth = gameState.maze.width * cellSize
      const canvasHeight = gameState.maze.height * cellSize

      ctx.fillStyle = "rgba(0, 0, 0, 0.85)"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Título
      ctx.fillStyle = "#fbbf24"
      ctx.font = 'bold 28px "Geist", sans-serif'
      ctx.textAlign = "center"
      ctx.fillText("PACMAN", canvasWidth / 2, canvasHeight / 2 - 60)

      ctx.fillStyle = "#3b82f6"
      ctx.font = 'bold 20px "Geist", sans-serif'
      ctx.fillText("INTELLIGENCE LAB", canvasWidth / 2, canvasHeight / 2 - 30)

      ctx.fillStyle = "#ffffff"
      ctx.font = '14px "Geist", sans-serif'
      ctx.fillText("Plataforma Educativa de IA", canvasWidth / 2, canvasHeight / 2 + 10)

      ctx.fillStyle = "#94a3b8"
      ctx.font = '16px "Geist", sans-serif'
      ctx.fillText("Press SPACE to start", canvasWidth / 2, canvasHeight / 2 + 50)
      ctx.fillText("Use Arrow Keys to move", canvasWidth / 2, canvasHeight / 2 + 75)
    },
    [gameState, cellSize],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar elementos
    drawMaze(ctx)
    drawPathVisualization(ctx)
    drawPacman(ctx)
    drawGhosts(ctx)

    // UI según estado
    switch (gameState.gameState) {
      case "MENU":
        drawMenu(ctx)
        break
      case "PLAYING":
      case "PAUSED":
        drawUI(ctx)
        if (gameState.gameState === "PAUSED") {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#ffffff"
          ctx.font = 'bold 24px "Geist", sans-serif'
          ctx.textAlign = "center"
          ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
        }
        break
      case "GAMEOVER":
        drawGameOver(ctx)
        break
      case "VICTORY":
        drawVictory(ctx)
        break
    }
  }, [gameState, drawMaze, drawPathVisualization, drawPacman, drawGhosts, drawUI, drawMenu, drawGameOver, drawVictory])

  return (
    <canvas
      ref={canvasRef}
      width={gameState.maze.width * cellSize}
      height={gameState.maze.height * cellSize}
      className="rounded-lg border border-border"
      style={{ imageRendering: "pixelated" }}
    />
  )
}
