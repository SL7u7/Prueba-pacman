"use client"

import type { GameSession, AlgorithmMetrics } from "@/lib/game/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, Zap, Target } from "lucide-react"

interface StatsPanelProps {
  session: GameSession
  metrics: AlgorithmMetrics[]
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function StatsPanel({ session, metrics }: StatsPanelProps) {
  const avgNodesExpanded =
    metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.nodesExpanded, 0) / metrics.length) : 0

  const avgExecutionTime =
    metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / metrics.length).toFixed(2) : "0.00"

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span>Estadísticas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span className="text-xs">Puntuación</span>
            </div>
            <p className="text-2xl font-bold text-primary">{session.score}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Tiempo</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(session.elapsedTime)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-3 h-3" />
              <span className="text-xs">Pellets</span>
            </div>
            <p className="text-lg font-medium">
              {session.totalPellets - session.pelletsRemaining}/{session.totalPellets}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-3 h-3" />
              <span className="text-xs">Nivel</span>
            </div>
            <p className="text-lg font-medium">{session.level}</p>
          </div>
        </div>

        {/* Métricas de IA */}
        {metrics.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">Métricas de IA</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary/30 rounded p-2">
                <span className="text-muted-foreground">Nodos prom.</span>
                <p className="font-medium">{avgNodesExpanded}</p>
              </div>
              <div className="bg-secondary/30 rounded p-2">
                <span className="text-muted-foreground">Tiempo prom.</span>
                <p className="font-medium">{avgExecutionTime}ms</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
