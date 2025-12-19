"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GameCanvas } from "@/components/game/game-canvas"
import { FSMVisualizer } from "@/components/game/fsm-visualizer"
import { AlgorithmPanel } from "@/components/game/algorithm-panel"
import { EducationalPanel } from "@/components/game/educational-panel"
import { LevelSelectScreen } from "@/components/game/level-select-screen"
import { IAConfigModal } from "@/components/game/ia-config-modal"
import { GameHeader } from "@/components/game/game-header"
import { FSMPanel } from "@/components/game/fsm-panel"
import { PathfindingMetrics } from "@/components/game/pathfinding-metrics"
import { TransitionTimeline } from "@/components/game/transition-timeline"
import { StepByStepControls } from "@/components/game/step-by-step-controls"
import {
  type GameEngineState,
  createInitialState,
  startGame,
  pauseGame,
  setDirection,
  updateGame,
  resetGame,
} from "@/lib/game/game-engine"
import type { GameConfig, AlgorithmType, Direction, GhostName, AppView } from "@/lib/game/types"
import {
  loadConfig,
  saveConfig,
  saveHighScore,
  isHighScore,
  incrementGameStats,
  markAlgorithmExplored,
  markLevelCompleted,
} from "@/lib/game/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PacManLab() {
  const [appView, setAppView] = useState<AppView>("menu")
  const [config, setConfig] = useState<GameConfig>(() => loadConfig())
  const [gameState, setGameState] = useState<GameEngineState>(() => createInitialState(config))
  const [selectedGhost, setSelectedGhost] = useState<GhostName | "all">("all")
  const [activeTab, setActiveTab] = useState("fsm")
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [fps, setFps] = useState(60)
  const gameLoopRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const gameStartTimeRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const fpsTimeRef = useRef(0)

  // Game loop
  useEffect(() => {
    const targetFPS = 10 * config.gameSpeed * config.globalAI.agentSpeed
    const frameTime = 1000 / targetFPS

    const gameLoop = (timestamp: number) => {
      // FPS calculation
      frameCountRef.current++
      if (timestamp - fpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        fpsTimeRef.current = timestamp
      }

      if (timestamp - lastUpdateRef.current >= frameTime) {
        setGameState((prevState) => updateGame(prevState, config))
        lastUpdateRef.current = timestamp
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    if (gameState.gameState === "PLAYING" && !gameState.isStepByStepMode) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState.gameState, config, gameState.isStepByStepMode, gameState.playbackSpeed])

  // Step-by-step playback loop
  useEffect(() => {
    if (!gameState.isStepByStepMode || gameState.isPaused) {
      return
    }

    // Calculate playback interval based on speed
    const baseInterval = 100 // 100ms base interval
    const interval = baseInterval / gameState.playbackSpeed

    const playbackInterval = setInterval(() => {
      setGameState((prev) => {
        if (prev.currentFrameIndex >= prev.frameHistory.length - 1) {
          // Reached the end, pause
          return { ...prev, isPaused: true }
        }
        return { ...prev, currentFrameIndex: prev.currentFrameIndex + 1 }
      })
    }, interval)

    return () => clearInterval(playbackInterval)
  }, [gameState.isStepByStepMode, gameState.isPaused, gameState.playbackSpeed])

  // Handle game end
  useEffect(() => {
    if (gameState.gameState === "GAMEOVER" || gameState.gameState === "VICTORY") {
      const gameTime = Date.now() - gameStartTimeRef.current
      incrementGameStats(gameTime)

      if (isHighScore(gameState.pacman.score)) {
        saveHighScore(gameState.pacman.score, selectedLevel, gameTime)
      }

      if (gameState.gameState === "VICTORY") {
        markLevelCompleted(selectedLevel, gameState.pacman.score)
      }
    }
  }, [gameState.gameState, gameState.pacman.score, selectedLevel])

  // Keyboard input
  useEffect(() => {
    if (appView !== "game") return

    const handleKeyDown = (e: KeyboardEvent) => {
      let direction: Direction | null = null

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "up"
          break
        case "ArrowDown":
        case "s":
        case "S":
          direction = "down"
          break
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "left"
          break
        case "ArrowRight":
        case "d":
        case "D":
          direction = "right"
          break
        case " ":
          e.preventDefault()
          if (gameState.gameState === "VICTORY") {
            // Victory - advance to next level or restart
            const currentLevel = gameState.session.level
            const nextLevel = currentLevel < 5 ? currentLevel + 1 : 1
            setSelectedLevel(nextLevel)
            const newState = createInitialState(config, nextLevel)
            newState.session.level = nextLevel
            gameStartTimeRef.current = Date.now()
            setGameState(startGame(newState))
          } else if (
            gameState.gameState === "MENU" ||
            gameState.gameState === "GAMEOVER"
          ) {
            gameStartTimeRef.current = Date.now()
            setGameState(startGame(resetGame(config, selectedLevel)))
          } else {
            setGameState((prev) => pauseGame(prev))
          }
          return
        case "r":
        case "R":
          setGameState(resetGame(config))
          return
        case "Escape":
          if (gameState.gameState === "PLAYING") {
            setGameState((prev) => pauseGame(prev))
          }
          return
      }

      if (direction) {
        e.preventDefault()
        setGameState((prev) => setDirection(prev, direction))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [appView, gameState.gameState, config])

  const handleSelectLevel = useCallback(
    (level: number) => {
      setSelectedLevel(level)
      const newState = createInitialState(config, level)
      newState.session.level = level
      setGameState(newState)
      setAppView("game")
      gameStartTimeRef.current = Date.now()
      setGameState(startGame(newState))
    },
    [config],
  )

  const handleStart = useCallback(() => {
    gameStartTimeRef.current = Date.now()
    if (gameState.gameState === "MENU" || gameState.gameState === "GAMEOVER" || gameState.gameState === "VICTORY") {
      setGameState(startGame(resetGame(config)))
    } else {
      setGameState(startGame(gameState))
    }
  }, [gameState, config])

  const handlePause = useCallback(() => {
    setGameState((prev) => pauseGame(prev))
  }, [])

  const handleReset = useCallback(() => {
    const newState = resetGame(config, selectedLevel)
    newState.session.level = selectedLevel
    setGameState(newState)
    gameStartTimeRef.current = Date.now()
    setGameState(startGame(newState))
  }, [config, selectedLevel])

  const handleBackToMenu = useCallback(() => {
    if (gameState.gameState === "PLAYING") {
      setGameState((prev) => pauseGame(prev))
    }
    setAppView("menu")
  }, [gameState.gameState])

  const handleConfigChange = useCallback((newConfig: GameConfig) => {
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [])

  const handleAlgorithmChange = useCallback((algorithm: AlgorithmType) => {
    markAlgorithmExplored(algorithm)
    setConfig((prev) => {
      const updated = { ...prev, defaultAlgorithm: algorithm }
      saveConfig(updated)
      return updated
    })
  }, [])

  // Step-by-step mode handlers
  const handleToggleStepByStep = useCallback(() => {
    setGameState((prev) => {
      if (!prev.isStepByStepMode) {
        return {
          ...prev,
          isStepByStepMode: true,
          isPaused: true,
          currentFrameIndex: 0,
        }
      }

      return {
        ...prev,
        isStepByStepMode: false,
        isPaused: false,
        currentFrameIndex: Math.max(prev.frameHistory.length - 1, 0),
      }
    })
  }, [])

  const handleStepPlayPause = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  const handleNextFrame = useCallback(() => {
    setGameState((prev) => {
      const nextIndex = Math.min(prev.currentFrameIndex + 1, prev.frameHistory.length - 1)
      return { ...prev, currentFrameIndex: nextIndex }
    })
  }, [])

  const handlePrevFrame = useCallback(() => {
    setGameState((prev) => {
      const prevIndex = Math.max(prev.currentFrameIndex - 1, 0)
      return { ...prev, currentFrameIndex: prevIndex }
    })
  }, [])

  const handleGoToStart = useCallback(() => {
    setGameState((prev) => ({ ...prev, currentFrameIndex: 0 }))
  }, [])

  const handleGoToEnd = useCallback(() => {
    setGameState((prev) => ({ ...prev, currentFrameIndex: prev.frameHistory.length - 1 }))
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    setGameState((prev) => ({ ...prev, playbackSpeed: speed }))
  }, [])

  const handleFrameSeek = useCallback((frame: number) => {
    setGameState((prev) => ({ ...prev, currentFrameIndex: frame }))
  }, [])

  // Menu View
  if (appView === "menu") {
    return (
      <>
        <LevelSelectScreen
          onSelectLevel={handleSelectLevel}
          onOpenConfig={() => setConfigModalOpen(true)}
          onOpenTutorial={() => { }}
        />
        <IAConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          config={config}
          onConfigChange={handleConfigChange}
        />
      </>
    )
  }

  // Game View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with controls */}
      <GameHeader
        lives={gameState.pacman.lives}
        score={gameState.pacman.score}
        level={selectedLevel}
        gameState={gameState.gameState}
        config={config}
        fps={fps}
        onPause={handlePause}
        onReset={handleReset}
        onOpenConfig={() => setConfigModalOpen(true)}
        onBackToMenu={handleBackToMenu}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Game Canvas */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <GameCanvas gameState={gameState} showPath={config.showPathVisualization} cellSize={16} />

            {/* Step-by-Step Controls */}
            <StepByStepControls
              isActive={gameState.isStepByStepMode}
              currentFrame={gameState.currentFrameIndex}
              totalFrames={gameState.frameHistory.length}
              isPlaying={!gameState.isPaused}
              playbackSpeed={gameState.playbackSpeed}
              frameData={gameState.frameHistory[gameState.currentFrameIndex]}
              onToggleMode={handleToggleStepByStep}
              onPlayPause={handleStepPlayPause}
              onNextFrame={handleNextFrame}
              onPrevFrame={handlePrevFrame}
              onGoToStart={handleGoToStart}
              onGoToEnd={handleGoToEnd}
              onSpeedChange={handleSpeedChange}
              onFrameSeek={handleFrameSeek}
            />
          </div>

          {/* Right Panel - AI Visualization */}
          <div className="lg:col-span-5 space-y-4">
            {/* Pathfinding Metrics */}
            <PathfindingMetrics
              currentAlgorithm={config.defaultAlgorithm}
              metrics={gameState.session.algorithmMetrics}
            />

            {/* FSM Panel */}
            <FSMPanel
              visualizations={gameState.fsmVisualizations}
              ghostTargets={gameState.ghosts.map((g) => ({
                name: g.name,
                target: g.targetPosition,
              }))}
            />

            {/* Transition Timeline */}
            <TransitionTimeline visualizations={gameState.fsmVisualizations} gameTime={gameState.session.elapsedTime} />

            {/* Tabs for more options */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fsm">FSM Detalle</TabsTrigger>
                <TabsTrigger value="algorithms">Algoritmos</TabsTrigger>
                <TabsTrigger value="learn">Aprender</TabsTrigger>
              </TabsList>

              <TabsContent value="fsm" className="mt-4">
                {config.showFSMVisualization && (
                  <FSMVisualizer visualizations={gameState.fsmVisualizations} selectedGhost={selectedGhost} />
                )}
              </TabsContent>

              <TabsContent value="algorithms" className="mt-4">
                <AlgorithmPanel
                  maze={gameState.maze}
                  pacmanPosition={gameState.pacman.position}
                  ghostPosition={gameState.ghosts[0]?.position || { x: 14, y: 14 }}
                  currentAlgorithm={config.defaultAlgorithm}
                  onAlgorithmChange={handleAlgorithmChange}
                />
              </TabsContent>

              <TabsContent value="learn" className="mt-4">
                <EducationalPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Config Modal */}
      <IAConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        config={config}
        onConfigChange={handleConfigChange}
      />
    </div>
  )
}
