"use client"

import type { GhostState, GhostName, FSMVisualization } from "@/lib/game/types"
import { GHOST_COLORS } from "@/lib/game/ghost-fsm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FSMVisualizerProps {
  visualizations: FSMVisualization[]
  selectedGhost: GhostName | "all"
}

const STATE_DESCRIPTIONS: Record<GhostState, { label: string; description: string; color: string }> = {
  CHASE: {
    label: "Chase",
    description: "Persiguiendo a Pacman",
    color: "bg-red-500",
  },
  SCATTER: {
    label: "Scatter",
    description: "Patrullando esquina",
    color: "bg-blue-500",
  },
  FRIGHTENED: {
    label: "Frightened",
    description: "Huyendo (vulnerable)",
    color: "bg-indigo-500",
  },
  DEAD: {
    label: "Dead",
    description: "Regresando a casa",
    color: "bg-gray-500",
  },
}

export function FSMVisualizer({ visualizations, selectedGhost }: FSMVisualizerProps) {
  const filteredVisualizations =
    selectedGhost === "all" ? visualizations : visualizations.filter((v) => v.ghostName === selectedGhost)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-primary">FSM</span>
          <span className="text-muted-foreground text-sm font-normal">Máquina de Estados Finitos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagrama de estados */}
        <div className="relative bg-secondary/30 rounded-lg p-4">
          <svg viewBox="0 0 300 200" className="w-full h-40">
            {/* Estados */}
            <g>
              {/* CHASE */}
              <circle cx="75" cy="50" r="30" fill="#ef4444" opacity="0.8" />
              <text x="75" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                CHASE
              </text>

              {/* SCATTER */}
              <circle cx="225" cy="50" r="30" fill="#3b82f6" opacity="0.8" />
              <text x="225" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                SCATTER
              </text>

              {/* FRIGHTENED */}
              <circle cx="150" cy="120" r="30" fill="#6366f1" opacity="0.8" />
              <text x="150" y="125" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                FRIGHTENED
              </text>

              {/* DEAD */}
              <circle cx="150" cy="180" r="25" fill="#6b7280" opacity="0.8" />
              <text x="150" y="185" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                DEAD
              </text>
            </g>

            {/* Transiciones */}
            <g stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)">
              {/* CHASE <-> SCATTER */}
              <path d="M 105 40 L 195 40" />
              <path d="M 195 60 L 105 60" />

              {/* CHASE -> FRIGHTENED */}
              <path d="M 85 78 L 130 100" />

              {/* SCATTER -> FRIGHTENED */}
              <path d="M 215 78 L 170 100" />

              {/* FRIGHTENED -> CHASE */}
              <path d="M 125 105 L 85 70" strokeDasharray="4" />

              {/* FRIGHTENED -> SCATTER */}
              <path d="M 175 105 L 215 70" strokeDasharray="4" />

              {/* FRIGHTENED -> DEAD */}
              <path d="M 150 150 L 150 155" />

              {/* DEAD -> CHASE/SCATTER */}
              <path d="M 130 165 L 75 80" strokeDasharray="4" />
            </g>

            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Estados actuales de los fantasmas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Estados Actuales</h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredVisualizations.map((viz) => (
              <div key={viz.ghostName} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: GHOST_COLORS[viz.ghostName as GhostName] }}
                />
                <span className="text-xs font-medium capitalize">{viz.ghostName}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${STATE_DESCRIPTIONS[viz.currentState].color} text-white`}
                >
                  {STATE_DESCRIPTIONS[viz.currentState].label}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda de transiciones */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Transiciones</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>• Timer (20s) → Chase ↔ Scatter</p>
            <p>• Power Pellet → Frightened</p>
            <p>• Comido → Dead</p>
            <p>• Llega a casa → Revive</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
