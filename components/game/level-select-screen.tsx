"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Check, Star, Settings, Trophy, BookOpen } from "lucide-react"
import { loadLevelProgress, type LevelProgress } from "@/lib/game/storage"
import { cn } from "@/lib/utils"

interface LevelSelectScreenProps {
  onSelectLevel: (level: number) => void
  onOpenConfig: () => void
  onOpenTutorial: () => void
}

export function LevelSelectScreen({ onSelectLevel, onOpenConfig, onOpenTutorial }: LevelSelectScreenProps) {
  const [progress, setProgress] = useState<LevelProgress | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number>(1)

  useEffect(() => {
    setProgress(loadLevelProgress())
  }, [])

  const levels = Array.from({ length: 5 }, (_, i) => i + 1)

  const isUnlocked = (level: number) => progress?.unlockedLevels.includes(level) ?? level === 1
  const isCompleted = (level: number) => progress?.completedLevels.includes(level) ?? false
  const getHighScore = (level: number) => progress?.highScoreByLevel[level] ?? 0

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">
            <span className="text-primary">PacMan</span>
          </h1>
          <h2 className="text-4xl font-bold text-foreground">Intelligence Lab</h2>
          <p className="text-muted-foreground">Plataforma Educativa de IA</p>
        </div>

        {/* Level Selection */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-center">Seleccionar Nivel</h3>

            {/* Level Radio Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => isUnlocked(level) && setSelectedLevel(level)}
                  disabled={!isUnlocked(level)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all",
                    selectedLevel === level
                      ? "bg-primary text-primary-foreground"
                      : isUnlocked(level)
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-muted/30 text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {!isUnlocked(level) && <Lock className="w-3 h-3" />}
                  {isCompleted(level) && <Check className="w-3 h-3" />}
                  Nivel {level}
                </button>
              ))}
            </div>

            {/* Level Grid */}
            <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
              {levels.map((level) => {
                const unlocked = isUnlocked(level)
                const completed = isCompleted(level)
                const highScore = getHighScore(level)

                return (
                  <button
                    key={level}
                    onClick={() => unlocked && setSelectedLevel(level)}
                    disabled={!unlocked}
                    className={cn(
                      "relative aspect-square rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all",
                      selectedLevel === level
                        ? "border-primary bg-primary/20 text-primary scale-110"
                        : unlocked
                          ? completed
                            ? "border-green-500/50 bg-green-500/10 text-green-500 hover:scale-105"
                            : "border-border bg-card hover:border-primary/50 hover:scale-105"
                          : "border-muted bg-muted/20 text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {unlocked ? (
                      <>
                        {level}
                        {completed && (
                          <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </>
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected Level Info */}
            {isUnlocked(selectedLevel) && (
              <div className="text-center space-y-1 p-4 bg-muted/30 rounded-lg">
                <p className="font-medium">Nivel {selectedLevel}</p>
                {getHighScore(selectedLevel) > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Mejor puntuación: {getHighScore(selectedLevel).toLocaleString()}
                  </p>
                )}
                {isCompleted(selectedLevel) && (
                  <p className="text-sm text-green-500 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Completado
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => onSelectLevel(selectedLevel)}
                disabled={!isUnlocked(selectedLevel)}
                className="w-full h-12 text-lg"
                size="lg"
              >
                INICIAR JUEGO
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={onOpenConfig} variant="outline" className="h-11 bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  CONFIGURACIÓN IA
                </Button>
                <Button onClick={onOpenTutorial} variant="outline" className="h-11 bg-transparent">
                  <BookOpen className="w-4 h-4 mr-2" />
                  TUTORIAL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">Universidad Nacional de Ingeniería</p>
      </div>
    </div>
  )
}
