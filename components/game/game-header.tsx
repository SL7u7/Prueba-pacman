"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, ArrowLeft, Pause, Play, RotateCcw } from "lucide-react"
import type { GameState, GameConfig } from "@/lib/game/types"

interface GameHeaderProps {
  lives: number
  score: number
  level: number
  gameState: GameState
  config: GameConfig
  fps?: number
  onPause: () => void
  onReset: () => void
  onOpenConfig: () => void
  onBackToMenu: () => void
}

export function GameHeader({
  lives,
  score,
  level,
  gameState,
  config,
  fps = 60,
  onPause,
  onReset,
  onOpenConfig,
  onBackToMenu,
}: GameHeaderProps) {
  return (
    <div className="w-full bg-card/80 backdrop-blur-sm border-b border-border p-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left - Game Stats */}
        <div className="flex items-center gap-6">
          {/* Lives */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Vidas:</span>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`w-5 h-5 rounded-full ${i < lives ? "bg-primary" : "bg-muted/30"}`} />
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Puntuación:</span>
            <span className="font-bold text-lg">{score.toLocaleString()}</span>
          </div>

          {/* Level */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nivel:</span>
            <Badge variant="secondary">{level}</Badge>
          </div>
        </div>

        {/* Center - Game Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={gameState === "MENU" || gameState === "GAMEOVER" || gameState === "VICTORY"}
          >
            {gameState === "PAUSED" ? (
              <>
                <Play className="w-4 h-4 mr-1" /> Reanudar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" /> Pausar
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenConfig}>
            <Settings className="w-4 h-4 mr-1" /> Configuración
          </Button>
          <Button variant="outline" size="sm" onClick={onBackToMenu}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Menú
          </Button>
        </div>

        {/* Right - FPS & Algorithm */}
        <div className="flex items-center gap-4">
          <Badge variant="outline">Algoritmo: {config.defaultAlgorithm.toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground">FPS: {fps}</span>
        </div>
      </div>
    </div>
  )
}
