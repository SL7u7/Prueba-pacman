"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FSMVisualization, GhostState } from "@/lib/game/types"
import { GHOST_COLORS } from "@/lib/game/ghost-fsm"

interface TransitionTimelineProps {
  visualizations: FSMVisualization[]
  gameTime: number
}

const STATE_COLORS: Record<GhostState, string> = {
  CHASE: "#ef4444",
  SCATTER: "#22c55e",
  FRIGHTENED: "#3b82f6",
  DEAD: "#6b7280",
}

export function TransitionTimeline({ visualizations, gameTime }: TransitionTimelineProps) {
  const maxTime = Math.max(gameTime, 60000) // At least 60 seconds

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Línea de Tiempo de Transiciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visualizations.map((viz) => {
          const history = viz.stateHistory.slice(-10) // Last 10 states

          return (
            <div key={viz.ghostName} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GHOST_COLORS[viz.ghostName] }} />
                <span className="text-xs capitalize">{viz.ghostName}</span>
              </div>
              <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
                {history.map((entry, i) => {
                  const nextEntry = history[i + 1]
                  const startTime = entry.timestamp
                  const endTime = nextEntry?.timestamp || Date.now()
                  const duration = endTime - startTime
                  const widthPercent = Math.min((duration / maxTime) * 100, 100)

                  return (
                    <div
                      key={i}
                      className="h-full"
                      style={{
                        backgroundColor: STATE_COLORS[entry.state],
                        width: `${widthPercent}%`,
                        minWidth: "2px",
                      }}
                      title={`${entry.state}: ${Math.round(duration / 1000)}s`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Time scale */}
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
          <span>0s</span>
          <span>30s</span>
          <span>60s</span>
        </div>
      </CardContent>
    </Card>
  )
}
