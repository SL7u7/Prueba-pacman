"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AlgorithmMetrics, AlgorithmType } from "@/lib/game/types"

interface PathfindingMetricsProps {
  currentAlgorithm: AlgorithmType
  metrics: AlgorithmMetrics[]
}

export function PathfindingMetrics({ currentAlgorithm, metrics }: PathfindingMetricsProps) {
  // Get last 5 metrics
  const recentMetrics = metrics.slice(-5)

  // Calculate averages
  const avgTime =
    recentMetrics.length > 0 ? recentMetrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / recentMetrics.length : 0
  const avgNodes =
    recentMetrics.length > 0
      ? Math.round(recentMetrics.reduce((sum, m) => sum + m.nodesExpanded, 0) / recentMetrics.length)
      : 0

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Métricas de Pathfinding</span>
          <Badge>{currentAlgorithm.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Tiempo promedio</p>
            <p className="text-lg font-bold">{avgTime.toFixed(2)} ms</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Nodos explorados</p>
            <p className="text-lg font-bold">{avgNodes}</p>
          </div>
        </div>

        {/* Mini chart representation */}
        {recentMetrics.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Historial Reciente</p>
            <div className="flex items-end gap-1 h-16">
              {recentMetrics.map((m, i) => {
                const maxNodes = Math.max(...recentMetrics.map((rm) => rm.nodesExpanded), 1)
                const height = (m.nodesExpanded / maxNodes) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-primary/60 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Tiempo (ms)</span>
              <span>Nodos</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
