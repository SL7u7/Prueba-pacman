"use client"

import { useState } from "react"
import type { AlgorithmType, AlgorithmMetrics, Vector2D, Maze } from "@/lib/game/types"
import { compareAlgorithms } from "@/lib/game/pathfinding"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AlgorithmPanelProps {
  maze: Maze
  pacmanPosition: Vector2D
  ghostPosition: Vector2D
  currentAlgorithm: AlgorithmType
  onAlgorithmChange: (algorithm: AlgorithmType) => void
}

const ALGORITHM_INFO: Record<AlgorithmType, { name: string; complexity: string; description: string }> = {
  astar: {
    name: "A*",
    complexity: "O(b^d)",
    description:
      "Algoritmo heurístico que encuentra el camino más corto usando la distancia Manhattan como heurística.",
  },
  dijkstra: {
    name: "Dijkstra",
    complexity: "O((V+E)logV)",
    description: "Algoritmo de camino más corto que explora todos los nodos sin usar heurística.",
  },
  bfs: {
    name: "BFS",
    complexity: "O(V+E)",
    description: "Búsqueda en anchura que garantiza el camino más corto en grafos no ponderados.",
  },
}

export function AlgorithmPanel({
  maze,
  pacmanPosition,
  ghostPosition,
  currentAlgorithm,
  onAlgorithmChange,
}: AlgorithmPanelProps) {
  const [comparisonResults, setComparisonResults] = useState<
    {
      path: Vector2D[]
      metrics: AlgorithmMetrics
    }[]
  >([])
  const [isComparing, setIsComparing] = useState(false)

  const runComparison = () => {
    setIsComparing(true)
    const results = compareAlgorithms(maze, ghostPosition, pacmanPosition)
    setComparisonResults(results)
    setIsComparing(false)
  }

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      gameInfo: {
        level: 1, // This could be passed as a prop
        score: 0, // This could be passed as a prop
        pacmanPosition: pacmanPosition,
      },
      algorithms: comparisonResults.map((result) => ({
        name: ALGORITHM_INFO[result.metrics.algorithm].name,
        executionTime_ms: Number(result.metrics.executionTimeMs.toFixed(2)),
        nodesExplored: result.metrics.nodesExpanded,
        pathLength: result.metrics.pathLength,
        memoryUsage_KB: result.metrics.memoryUsage || 0,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacman-algorithms-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const headers = ["Algorithm", "Execution Time (ms)", "Nodes Explored", "Path Length", "Memory Usage (KB)"]
    const rows = comparisonResults.map((result) => [
      ALGORITHM_INFO[result.metrics.algorithm].name,
      result.metrics.executionTimeMs.toFixed(2),
      result.metrics.nodesExpanded.toString(),
      result.metrics.pathLength.toString(),
      (result.metrics.memoryUsage || 0).toString(),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacman-algorithms-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-primary">Algoritmos</span>
          <span className="text-muted-foreground text-sm font-normal">Pathfinding</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Seleccionar</TabsTrigger>
            <TabsTrigger value="compare">Comparar</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-3 mt-3">
            {(["astar", "dijkstra", "bfs"] as AlgorithmType[]).map((algo) => (
              <button
                key={algo}
                onClick={() => onAlgorithmChange(algo)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${currentAlgorithm === algo
                  ? "bg-primary/20 border border-primary"
                  : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{ALGORITHM_INFO[algo].name}</span>
                  <Badge variant="outline" className="text-xs">
                    {ALGORITHM_INFO[algo].complexity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ALGORITHM_INFO[algo].description}</p>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="compare" className="space-y-3 mt-3">
            <Button onClick={runComparison} disabled={isComparing} className="w-full">
              {isComparing ? "Ejecutando..." : "Ejecutar Comparación"}
            </Button>

            {comparisonResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resultados</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2">Algoritmo</th>
                        <th className="text-right p-2">Nodos</th>
                        <th className="text-right p-2">Tiempo</th>
                        <th className="text-right p-2">Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((result) => (
                        <tr key={result.metrics.algorithm} className="border-b border-border/50">
                          <td className="p-2 font-medium">{ALGORITHM_INFO[result.metrics.algorithm].name}</td>
                          <td className="text-right p-2 text-muted-foreground">{result.metrics.nodesExpanded}</td>
                          <td className="text-right p-2 text-muted-foreground">
                            {result.metrics.executionTimeMs.toFixed(2)}ms
                          </td>
                          <td className="text-right p-2 text-muted-foreground">{result.metrics.pathLength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gráfico simple de barras */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium">Nodos Expandidos</h4>
                  {comparisonResults.map((result) => {
                    const maxNodes = Math.max(...comparisonResults.map((r) => r.metrics.nodesExpanded))
                    const width = (result.metrics.nodesExpanded / maxNodes) * 100
                    return (
                      <div key={result.metrics.algorithm} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{ALGORITHM_INFO[result.metrics.algorithm].name}</span>
                          <span className="text-muted-foreground">{result.metrics.nodesExpanded}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button onClick={exportToJSON} variant="outline" className="flex-1" size="sm">
                    Exportar JSON
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" className="flex-1" size="sm">
                    Exportar CSV
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
