import type { Vector2D, PathNode, AlgorithmType, AlgorithmMetrics, Maze } from "./types"
import { getNeighbors } from "./maze-data"

// Distancia Manhattan (heurística para A*)
function manhattanDistance(a: Vector2D, b: Vector2D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

// Distancia Euclidiana
function euclideanDistance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function positionKey(pos: Vector2D): string {
  return `${pos.x},${pos.y}`
}

function reconstructPath(node: PathNode): Vector2D[] {
  const path: Vector2D[] = []
  let current: PathNode | null = node

  while (current !== null) {
    path.unshift(current.position)
    current = current.parent
  }

  return path
}

// ===== A* ALGORITHM =====
export function astar(maze: Maze, start: Vector2D, goal: Vector2D): { path: Vector2D[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now()
  let nodesExpanded = 0

  const openSet: PathNode[] = []
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null,
  }

  openSet.push(startNode)

  while (openSet.length > 0) {
    // Obtener nodo con menor f
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!
    nodesExpanded++

    // Llegamos al objetivo
    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path = reconstructPath(current)
      return {
        path,
        metrics: {
          algorithm: "astar",
          nodesExpanded,
          executionTimeMs: performance.now() - startTime,
          pathLength: path.length,
          timestamp: Date.now(),
        },
      }
    }

    closedSet.add(positionKey(current.position))

    // Explorar vecinos
    const neighbors = getNeighbors(maze, current.position)
    for (const neighborPos of neighbors) {
      const key = positionKey(neighborPos)
      if (closedSet.has(key)) continue

      const g = current.g + 1
      const h = manhattanDistance(neighborPos, goal)
      const f = g + h

      const existingNode = openSet.find((n) => n.position.x === neighborPos.x && n.position.y === neighborPos.y)

      if (!existingNode) {
        openSet.push({
          position: neighborPos,
          g,
          h,
          f,
          parent: current,
        })
      } else if (g < existingNode.g) {
        existingNode.g = g
        existingNode.f = f
        existingNode.parent = current
      }
    }
  }

  // No se encontró camino
  return {
    path: [],
    metrics: {
      algorithm: "astar",
      nodesExpanded,
      executionTimeMs: performance.now() - startTime,
      pathLength: 0,
      timestamp: Date.now(),
    },
  }
}

// ===== DIJKSTRA ALGORITHM =====
export function dijkstra(maze: Maze, start: Vector2D, goal: Vector2D): { path: Vector2D[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now()
  let nodesExpanded = 0

  const openSet: PathNode[] = []
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: 0, // Dijkstra no usa heurística
    f: 0,
    parent: null,
  }

  openSet.push(startNode)

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.g - b.g)
    const current = openSet.shift()!
    nodesExpanded++

    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path = reconstructPath(current)
      return {
        path,
        metrics: {
          algorithm: "dijkstra",
          nodesExpanded,
          executionTimeMs: performance.now() - startTime,
          pathLength: path.length,
          timestamp: Date.now(),
        },
      }
    }

    closedSet.add(positionKey(current.position))

    const neighbors = getNeighbors(maze, current.position)
    for (const neighborPos of neighbors) {
      const key = positionKey(neighborPos)
      if (closedSet.has(key)) continue

      const g = current.g + 1

      const existingNode = openSet.find((n) => n.position.x === neighborPos.x && n.position.y === neighborPos.y)

      if (!existingNode) {
        openSet.push({
          position: neighborPos,
          g,
          h: 0,
          f: g,
          parent: current,
        })
      } else if (g < existingNode.g) {
        existingNode.g = g
        existingNode.f = g
        existingNode.parent = current
      }
    }
  }

  return {
    path: [],
    metrics: {
      algorithm: "dijkstra",
      nodesExpanded,
      executionTimeMs: performance.now() - startTime,
      pathLength: 0,
      timestamp: Date.now(),
    },
  }
}

// ===== BFS ALGORITHM =====
export function bfs(maze: Maze, start: Vector2D, goal: Vector2D): { path: Vector2D[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now()
  let nodesExpanded = 0

  const queue: PathNode[] = []
  const visited = new Set<string>()

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  }

  queue.push(startNode)
  visited.add(positionKey(start))

  while (queue.length > 0) {
    const current = queue.shift()!
    nodesExpanded++

    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path = reconstructPath(current)
      return {
        path,
        metrics: {
          algorithm: "bfs",
          nodesExpanded,
          executionTimeMs: performance.now() - startTime,
          pathLength: path.length,
          timestamp: Date.now(),
        },
      }
    }

    const neighbors = getNeighbors(maze, current.position)
    for (const neighborPos of neighbors) {
      const key = positionKey(neighborPos)
      if (visited.has(key)) continue

      visited.add(key)
      queue.push({
        position: neighborPos,
        g: current.g + 1,
        h: 0,
        f: 0,
        parent: current,
      })
    }
  }

  return {
    path: [],
    metrics: {
      algorithm: "bfs",
      nodesExpanded,
      executionTimeMs: performance.now() - startTime,
      pathLength: 0,
      timestamp: Date.now(),
    },
  }
}

// ===== EJECUTAR PATHFINDING =====
export function runPathfinding(
  algorithm: AlgorithmType,
  maze: Maze,
  start: Vector2D,
  goal: Vector2D,
): { path: Vector2D[]; metrics: AlgorithmMetrics } {
  switch (algorithm) {
    case "astar":
      return astar(maze, start, goal)
    case "dijkstra":
      return dijkstra(maze, start, goal)
    case "bfs":
      return bfs(maze, start, goal)
    default:
      return astar(maze, start, goal)
  }
}

// ===== COMPARAR ALGORITMOS =====
export function compareAlgorithms(
  maze: Maze,
  start: Vector2D,
  goal: Vector2D,
  algorithms: AlgorithmType[] = ["astar", "dijkstra", "bfs"],
): { path: Vector2D[]; metrics: AlgorithmMetrics }[] {
  return algorithms.map((algo) => runPathfinding(algo, maze, start, goal))
}
