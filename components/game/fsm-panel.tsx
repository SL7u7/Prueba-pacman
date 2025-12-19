"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FSMVisualization, GhostName, GhostState } from "@/lib/game/types"
import { GHOST_COLORS } from "@/lib/game/ghost-fsm"

interface FSMPanelProps {
  visualizations: FSMVisualization[]
  ghostTargets: { name: GhostName; target: { x: number; y: number } }[]
}

const STATE_COLORS: Record<GhostState, string> = {
  CHASE: "bg-red-500",
  SCATTER: "bg-green-500",
  FRIGHTENED: "bg-blue-500",
  DEAD: "bg-gray-500",
}

const STATE_LABELS: Record<GhostState, string> = {
  CHASE: "Persecución",
  SCATTER: "Dispersión",
  FRIGHTENED: "Asustado",
  DEAD: "Muerto",
}

export function FSMPanel({ visualizations, ghostTargets }: FSMPanelProps) {
  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Panel de Visualización FSM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visualizations.map((viz) => {
          const target = ghostTargets.find((g) => g.name === viz.ghostName)

          return (
            <div key={viz.ghostName} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: GHOST_COLORS[viz.ghostName] }} />
                <span className="font-medium capitalize">{viz.ghostName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${STATE_COLORS[viz.currentState]} text-white text-xs`}>
                  {STATE_LABELS[viz.currentState]}
                </Badge>
                {target && (
                  <span className="text-xs text-muted-foreground">
                    Objetivo: ({target.target.x}, {target.target.y})
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Leyenda de Estados</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATE_LABELS) as GhostState[]).map((state) => (
              <Badge key={state} className={`${STATE_COLORS[state]} text-white text-xs`}>
                {STATE_LABELS[state]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
