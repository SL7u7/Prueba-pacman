"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Code, HelpCircle } from "lucide-react"

const TUTORIALS = [
  {
    id: "intro",
    title: "Introducción",
    content: `
PacMan Intelligence Lab es una plataforma educativa diseñada para enseñar conceptos de Inteligencia Artificial a través del clásico juego de Pac-Man.

**Objetivos de aprendizaje:**
- Comprender algoritmos de pathfinding (A*, Dijkstra, BFS)
- Visualizar máquinas de estados finitos (FSM)
- Analizar el rendimiento de diferentes algoritmos
    `,
  },
  {
    id: "pathfinding",
    title: "Pathfinding",
    content: `
**Algoritmos de búsqueda de caminos:**

**A*** - Algoritmo heurístico que combina el costo real del camino con una estimación del costo restante. Usa la distancia Manhattan como heurística.

**Dijkstra** - Encuentra el camino más corto explorando todos los nodos. No usa heurística, por lo que puede ser más lento que A*.

**BFS** - Búsqueda en anchura que garantiza encontrar el camino más corto en grafos no ponderados. Expande nodos nivel por nivel.
    `,
  },
  {
    id: "fsm",
    title: "FSM",
    content: `
**Máquina de Estados Finitos de los Fantasmas:**

Los fantasmas tienen 4 estados posibles:

**Chase** - Persiguen activamente a Pac-Man usando diferentes estrategias según el fantasma.

**Scatter** - Patrullan su esquina asignada del laberinto.

**Frightened** - Huyen aleatoriamente cuando Pac-Man come una Power Pellet.

**Dead** - Regresan a la casa de fantasmas después de ser comidos.
    `,
  },
]

const GLOSSARY = [
  { term: "A*", definition: "Algoritmo de búsqueda heurística para pathfinding" },
  { term: "BFS", definition: "Breadth-First Search - Búsqueda en anchura" },
  { term: "Dijkstra", definition: "Algoritmo de camino más corto sin heurística" },
  { term: "FSM", definition: "Finite State Machine - Máquina de Estados Finitos" },
  { term: "Heurística", definition: "Estimación del costo para llegar al objetivo" },
  { term: "Manhattan", definition: "Distancia medida solo en movimientos horizontales y verticales" },
  { term: "Nodo", definition: "Posición en el grafo del laberinto" },
  { term: "Path", definition: "Secuencia de nodos desde origen a destino" },
]

export function EducationalPanel() {
  const [selectedTutorial, setSelectedTutorial] = useState("intro")

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Material Educativo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tutorial" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tutorial" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              Tutoriales
            </TabsTrigger>
            <TabsTrigger value="glossary" className="text-xs">
              <HelpCircle className="w-3 h-3 mr-1" />
              Glosario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tutorial" className="mt-3">
            <div className="flex gap-2 mb-3 flex-wrap">
              {TUTORIALS.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial.id)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedTutorial === tutorial.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  {tutorial.title}
                </button>
              ))}
            </div>
            <ScrollArea className="h-48">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {TUTORIALS.find((t) => t.id === selectedTutorial)?.content}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="glossary" className="mt-3">
            <ScrollArea className="h-56">
              <div className="space-y-2">
                {GLOSSARY.map((item) => (
                  <div key={item.term} className="p-2 bg-secondary/30 rounded-md">
                    <span className="font-medium text-primary">{item.term}</span>
                    <p className="text-xs text-muted-foreground mt-1">{item.definition}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
