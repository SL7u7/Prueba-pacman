"use client"

import type { GameState, GameConfig } from "@/lib/game/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"

interface ControlsPanelProps {
  gameState: GameState
  config: GameConfig
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onConfigChange: (config: Partial<GameConfig>) => void
}

export function ControlsPanel({ gameState, config, onStart, onPause, onReset, onConfigChange }: ControlsPanelProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <span>Controles</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botones de control */}
        <div className="flex gap-2">
          {gameState === "MENU" || gameState === "GAMEOVER" || gameState === "VICTORY" ? (
            <Button onClick={onStart} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          ) : (
            <Button onClick={onPause} variant="secondary" className="flex-1">
              {gameState === "PAUSED" ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          )}
          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Configuración */}
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Mostrar Path */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-path" className="text-sm">
              Mostrar Path
            </Label>
            <Switch
              id="show-path"
              checked={config.showPathVisualization}
              onCheckedChange={(checked) => onConfigChange({ showPathVisualization: checked })}
            />
          </div>

          {/* Mostrar FSM */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-fsm" className="text-sm">
              Mostrar FSM
            </Label>
            <Switch
              id="show-fsm"
              checked={config.showFSMVisualization}
              onCheckedChange={(checked) => onConfigChange({ showFSMVisualization: checked })}
            />
          </div>

          {/* Velocidad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Velocidad</Label>
              <span className="text-xs text-muted-foreground">{config.gameSpeed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[config.gameSpeed]}
              onValueChange={([value]) => onConfigChange({ gameSpeed: value })}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Dificultad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Dificultad</Label>
              <span className="text-xs text-muted-foreground">{config.difficulty}</span>
            </div>
            <Slider
              value={[config.difficulty]}
              onValueChange={([value]) => onConfigChange({ difficulty: value })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="pt-2 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Controles</h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>↑ ↓ ← →</span>
            <span>Mover</span>
            <span>SPACE</span>
            <span>Pausar</span>
            <span>R</span>
            <span>Reiniciar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
