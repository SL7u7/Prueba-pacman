"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  GameConfig,
  GhostName,
  GhostConfig,
  DifficultyPreset,
  TargetingStrategy,
  GhostPersonality,
} from "@/lib/game/types"
import { getDifficultyPreset, getDefaultGhostConfig, getDefaultConfig } from "@/lib/game/storage"
import { GHOST_COLORS } from "@/lib/game/ghost-fsm"

interface IAConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: GameConfig
  onConfigChange: (config: GameConfig) => void
}

const GHOST_NAMES: GhostName[] = ["blinky", "pinky", "inky", "clyde"]

const GHOST_LABELS: Record<GhostName, string> = {
  blinky: "Blinky",
  pinky: "Pinky",
  inky: "Inky",
  clyde: "Clyde",
}

const STRATEGY_LABELS: Record<TargetingStrategy, { label: string; description: string }> = {
  direct: { label: "Perseguir directamente a Pac-Man", description: "Targeting directo" },
  ambush: { label: "Anticipar la posición de Pac-Man", description: "Emboscador" },
  proximity: { label: "Basado en proximidad", description: "Errático" },
  random: { label: "Aleatorio", description: "Tímido" },
}

const PERSONALITY_LABELS: Record<GhostPersonality, string> = {
  cautious: "Cauteloso",
  brave: "Valiente",
  unpredictable: "Impredecible",
  evasive: "Evasivo",
}

function ensureValidConfig(config: GameConfig): GameConfig {
  const defaultConfig = getDefaultConfig()
  const defaultGhostConfigs = getDefaultGhostConfig()

  return {
    ...defaultConfig,
    ...config,
    globalAI: {
      agentSpeed: config.globalAI?.agentSpeed ?? defaultConfig.globalAI.agentSpeed,
      scatterTime: config.globalAI?.scatterTime ?? defaultConfig.globalAI.scatterTime,
      chaseTime: config.globalAI?.chaseTime ?? defaultConfig.globalAI.chaseTime,
      frightenedDuration: config.globalAI?.frightenedDuration ?? defaultConfig.globalAI.frightenedDuration,
    },
    ghostConfigs: {
      blinky: { ...defaultGhostConfigs.blinky, ...(config.ghostConfigs?.blinky || {}) },
      pinky: { ...defaultGhostConfigs.pinky, ...(config.ghostConfigs?.pinky || {}) },
      inky: { ...defaultGhostConfigs.inky, ...(config.ghostConfigs?.inky || {}) },
      clyde: { ...defaultGhostConfigs.clyde, ...(config.ghostConfigs?.clyde || {}) },
    },
  }
}

export function IAConfigModal({ open, onOpenChange, config, onConfigChange }: IAConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<GameConfig>(() => ensureValidConfig(config))
  const [selectedGhost, setSelectedGhost] = useState<GhostName>("blinky")

  useEffect(() => {
    setLocalConfig(ensureValidConfig(config))
  }, [config])

  const handlePresetChange = (preset: DifficultyPreset) => {
    const presetConfig = getDifficultyPreset(preset)
    setLocalConfig((prev) => ({
      ...prev,
      ...presetConfig,
      globalAI: {
        ...prev.globalAI,
        ...(presetConfig.globalAI || {}),
      },
    }))
  }

  const handleGlobalAIChange = (key: keyof GameConfig["globalAI"], value: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      difficultyPreset: "custom",
      globalAI: { ...prev.globalAI, [key]: value },
    }))
  }

  const handleGhostConfigChange = (ghost: GhostName, key: keyof GhostConfig, value: unknown) => {
    setLocalConfig((prev) => ({
      ...prev,
      difficultyPreset: "custom",
      ghostConfigs: {
        ...prev.ghostConfigs,
        [ghost]: { ...prev.ghostConfigs[ghost], [key]: value },
      },
    }))
  }

  const handlePersonalityToggle = (ghost: GhostName, personality: GhostPersonality) => {
    const current = localConfig.ghostConfigs[ghost].personality
    const updated = current.includes(personality) ? current.filter((p) => p !== personality) : [...current, personality]
    handleGhostConfigChange(ghost, "personality", updated)
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultGhostConfigs = getDefaultGhostConfig()
    setLocalConfig((prev) => ({
      ...prev,
      difficultyPreset: "medium",
      globalAI: {
        agentSpeed: 1.0,
        scatterTime: 7,
        chaseTime: 20,
        frightenedDuration: 6,
      },
      ghostConfigs: defaultGhostConfigs,
    }))
  }

  const handleResetGhost = (ghost: GhostName) => {
    const defaultConfigs = getDefaultGhostConfig()
    handleGhostConfigChange(ghost, "targetingStrategy", defaultConfigs[ghost].targetingStrategy)
    handleGhostConfigChange(ghost, "aggressiveness", defaultConfigs[ghost].aggressiveness)
    handleGhostConfigChange(ghost, "relativeSpeed", defaultConfigs[ghost].relativeSpeed)
    handleGhostConfigChange(ghost, "algorithm", defaultConfigs[ghost].algorithm)
    handleGhostConfigChange(ghost, "personality", defaultConfigs[ghost].personality)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Configuración de Parámetros de IA Global</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global AI Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Parámetros de Agentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent Speed */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Velocidad de agentes</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.globalAI.agentSpeed.toFixed(2)}x</span>
                </div>
                <Slider
                  value={[localConfig.globalAI.agentSpeed]}
                  onValueChange={([v]) => handleGlobalAIChange("agentSpeed", v)}
                  min={0.5}
                  max={2}
                  step={0.05}
                />
              </div>

              {/* Scatter Time */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tiempo de dispersión</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.globalAI.scatterTime}s</span>
                </div>
                <Slider
                  value={[localConfig.globalAI.scatterTime]}
                  onValueChange={([v]) => handleGlobalAIChange("scatterTime", v)}
                  min={3}
                  max={15}
                  step={1}
                />
              </div>

              {/* Chase Time */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tiempo de persecución</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.globalAI.chaseTime}s</span>
                </div>
                <Slider
                  value={[localConfig.globalAI.chaseTime]}
                  onValueChange={([v]) => handleGlobalAIChange("chaseTime", v)}
                  min={10}
                  max={30}
                  step={1}
                />
              </div>

              {/* Frightened Duration */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duración de modo asustado</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.globalAI.frightenedDuration}s</span>
                </div>
                <Slider
                  value={[localConfig.globalAI.frightenedDuration]}
                  onValueChange={([v]) => handleGlobalAIChange("frightenedDuration", v)}
                  min={2}
                  max={12}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Presets de Dificultad</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={localConfig.difficultyPreset}
                onValueChange={(v) => handlePresetChange(v as DifficultyPreset)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy">Fácil</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard">Difícil</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Personalizado</Label>
                </div>
              </RadioGroup>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleReset}>
                  Restablecer valores predeterminados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Ghost Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Configuración Individual de Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedGhost} onValueChange={(v) => setSelectedGhost(v as GhostName)}>
                <TabsList className="grid grid-cols-4 w-full">
                  {GHOST_NAMES.map((ghost) => (
                    <TabsTrigger key={ghost} value={ghost} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GHOST_COLORS[ghost] }} />
                      {GHOST_LABELS[ghost]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {GHOST_NAMES.map((ghost) => (
                  <TabsContent key={ghost} value={ghost} className="space-y-4 pt-4">
                    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                      <h4 className="font-medium">Configuración de {GHOST_LABELS[ghost]}</h4>

                      {/* Targeting Strategy */}
                      <div className="space-y-2">
                        <Label>Estrategia de Targeting</Label>
                        <RadioGroup
                          value={localConfig.ghostConfigs[ghost].targetingStrategy}
                          onValueChange={(v) => handleGhostConfigChange(ghost, "targetingStrategy", v)}
                          className="space-y-1"
                        >
                          {(Object.keys(STRATEGY_LABELS) as TargetingStrategy[]).map((strategy) => (
                            <div key={strategy} className="flex items-center space-x-2">
                              <RadioGroupItem value={strategy} id={`${ghost}-${strategy}`} />
                              <Label htmlFor={`${ghost}-${strategy}`} className="text-sm">
                                {STRATEGY_LABELS[strategy].label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Aggressiveness */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Nivel de agresividad</Label>
                          <span className="text-sm text-muted-foreground">
                            {localConfig.ghostConfigs[ghost].aggressiveness}
                          </span>
                        </div>
                        <Slider
                          value={[localConfig.ghostConfigs[ghost].aggressiveness]}
                          onValueChange={([v]) => handleGhostConfigChange(ghost, "aggressiveness", v)}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>

                      {/* Relative Speed */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Velocidad relativa</Label>
                          <span className="text-sm text-muted-foreground">
                            {localConfig.ghostConfigs[ghost].relativeSpeed.toFixed(2)}x
                          </span>
                        </div>
                        <Slider
                          value={[localConfig.ghostConfigs[ghost].relativeSpeed]}
                          onValueChange={([v]) => handleGhostConfigChange(ghost, "relativeSpeed", v)}
                          min={0.5}
                          max={1.5}
                          step={0.05}
                        />
                      </div>

                      {/* Pathfinding Algorithm */}
                      <div className="space-y-2">
                        <Label>Algoritmo de Pathfinding</Label>
                        <RadioGroup
                          value={localConfig.ghostConfigs[ghost].algorithm}
                          onValueChange={(v) => handleGhostConfigChange(ghost, "algorithm", v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="astar" id={`${ghost}-astar`} />
                            <Label htmlFor={`${ghost}-astar`}>A* (A-star)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bfs" id={`${ghost}-bfs`} />
                            <Label htmlFor={`${ghost}-bfs`}>BFS (Breadth-First Search)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dijkstra" id={`${ghost}-dijkstra`} />
                            <Label htmlFor={`${ghost}-dijkstra`}>Dijkstra</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Personality */}
                      <div className="space-y-2">
                        <Label>Personalidad</Label>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(PERSONALITY_LABELS) as GhostPersonality[]).map((personality) => (
                            <div key={personality} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${ghost}-${personality}`}
                                checked={localConfig.ghostConfigs[ghost].personality.includes(personality)}
                                onCheckedChange={() => handlePersonalityToggle(ghost, personality)}
                              />
                              <Label htmlFor={`${ghost}-${personality}`} className="text-sm">
                                {PERSONALITY_LABELS[personality]}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleResetGhost(ghost)}>
                          Restablecer {GHOST_LABELS[ghost]}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
