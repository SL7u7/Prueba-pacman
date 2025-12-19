import type { GhostData, GhostName, Vector2D, Maze, AlgorithmType, FSMTransition, GhostConfig, GhostState } from "./types"
import { runPathfinding } from "./pathfinding"

// Ghost state durations in REAL SECONDS (not frames)
const DEFAULT_STATE_DURATIONS = {
  INITIAL_SCATTER: 5, // 5 seconds
  CHASE: Infinity, // Indefinite
  SCATTER: 7, // 7 seconds (not used after initial)
  FRIGHTENED: 6, // 6 seconds
}

// Scatter corners for each ghost
const SCATTER_CORNERS: Record<GhostName, Vector2D> = {
  blinky: { x: 25, y: 0 },
  pinky: { x: 2, y: 0 },
  inky: { x: 27, y: 30 },
  clyde: { x: 0, y: 30 },
}

// Ghost colors
export const GHOST_COLORS: Record<GhostName, string> = {
  blinky: "#FF0000",
  pinky: "#FFB8FF",
  inky: "#00FFFF",
  clyde: "#FFB852",
}

// All possible FSM transitions
export const FSM_TRANSITIONS: FSMTransition[] = [
  { from: "CHASE", to: "SCATTER", condition: "Timer expires (chase time)", event: "TIMEOUT" },
  { from: "SCATTER", to: "CHASE", condition: "Timer expires (scatter time)", event: "TIMEOUT" },
  { from: "CHASE", to: "FRIGHTENED", condition: "Pacman eats power pellet", event: "POWER_PELLET" },
  { from: "SCATTER", to: "FRIGHTENED", condition: "Pacman eats power pellet", event: "POWER_PELLET" },
  { from: "FRIGHTENED", to: "CHASE", condition: "Timer expires from Chase", event: "TIMEOUT" },
  { from: "FRIGHTENED", to: "SCATTER", condition: "Timer expires from Scatter", event: "TIMEOUT" },
  { from: "FRIGHTENED", to: "DEAD", condition: "Pacman eats ghost", event: "EATEN" },
  { from: "DEAD", to: "CHASE", condition: "Ghost reaches home", event: "REVIVE" },
  { from: "DEAD", to: "SCATTER", condition: "Ghost reaches home", event: "REVIVE" },
]

const DEFAULT_GHOST_CONFIGS: Record<GhostName, GhostConfig> = {
  blinky: {
    targetingStrategy: "direct",
    aggressiveness: 8,
    relativeSpeed: 1.0,
    algorithm: "astar",
    personality: ["brave"],
  },
  pinky: {
    targetingStrategy: "ambush",
    aggressiveness: 6,
    relativeSpeed: 0.95,
    algorithm: "astar",
    personality: ["cautious"],
  },
  inky: {
    targetingStrategy: "proximity",
    aggressiveness: 5,
    relativeSpeed: 0.9,
    algorithm: "bfs",
    personality: ["unpredictable"],
  },
  clyde: {
    targetingStrategy: "random",
    aggressiveness: 4,
    relativeSpeed: 0.85,
    algorithm: "dijkstra",
    personality: ["evasive"],
  },
}

export function createGhost(name: GhostName, homePosition: Vector2D, config?: GhostConfig): GhostData {
  return {
    name,
    position: { ...homePosition },
    direction: "up",
    state: "SCATTER", // Start in SCATTER mode
    targetPosition: SCATTER_CORNERS[name],
    path: [],
    color: GHOST_COLORS[name],
    scatterCorner: SCATTER_CORNERS[name],
    homePosition,
    stateTimer: 5 * 60, // 5 seconds at 60fps
    config: config || DEFAULT_GHOST_CONFIGS[name],
    isInitialScatter: true,
    previousState: "SCATTER",
    stateStartTime: 0, // Will be set when game starts
  }
}

export function createAllGhosts(ghostHome: Vector2D, configs?: Record<GhostName, GhostConfig>): GhostData[] {
  const offsets: Record<GhostName, Vector2D> = {
    blinky: { x: 0, y: -3 },
    pinky: { x: -2, y: 0 },
    inky: { x: 2, y: 0 },
    clyde: { x: 0, y: 0 },
  }

  const names: GhostName[] = ["blinky", "pinky", "inky", "clyde"]
  return names.map((name) => {
    const offset = offsets[name]
    return createGhost(name, { x: ghostHome.x + offset.x, y: ghostHome.y + offset.y }, configs?.[name])
  })
}

function calculateChaseTarget(
  ghost: GhostData,
  pacmanPosition: Vector2D,
  pacmanDirection: string,
  blinkyPosition?: Vector2D,
): Vector2D {
  // Use ghost's configured strategy
  switch (ghost.config.targetingStrategy) {
    case "direct":
      // Direct pursuit of Pacman
      return pacmanPosition

    case "ambush":
      // Aim ahead of Pacman
      const ambushOffset = { x: 0, y: 0 }
      const lookAhead = 4
      switch (pacmanDirection) {
        case "up":
          ambushOffset.y = -lookAhead
          break
        case "down":
          ambushOffset.y = lookAhead
          break
        case "left":
          ambushOffset.x = -lookAhead
          break
        case "right":
          ambushOffset.x = lookAhead
          break
      }
      return {
        x: pacmanPosition.x + ambushOffset.x,
        y: pacmanPosition.y + ambushOffset.y,
      }

    case "proximity":
      // Complex targeting based on Blinky (for Inky-like behavior)
      if (blinkyPosition) {
        const ahead = { x: 0, y: 0 }
        switch (pacmanDirection) {
          case "up":
            ahead.y = -2
            break
          case "down":
            ahead.y = 2
            break
          case "left":
            ahead.x = -2
            break
          case "right":
            ahead.x = 2
            break
        }
        const pivot = {
          x: pacmanPosition.x + ahead.x,
          y: pacmanPosition.y + ahead.y,
        }
        return {
          x: pivot.x + (pivot.x - blinkyPosition.x),
          y: pivot.y + (pivot.y - blinkyPosition.y),
        }
      }
      return pacmanPosition

    case "random":
      // Clyde-like: chase if far, scatter if close
      const distance = Math.sqrt(
        Math.pow(ghost.position.x - pacmanPosition.x, 2) + Math.pow(ghost.position.y - pacmanPosition.y, 2),
      )
      const threshold = 8 - ghost.config.aggressiveness / 2 // More aggressive = smaller threshold
      return distance > threshold ? pacmanPosition : ghost.scatterCorner

    default:
      return pacmanPosition
  }
}

// Update ghost state (FSM)
export function updateGhostState(
  ghost: GhostData,
  maze: Maze,
  pacmanPosition: Vector2D,
  pacmanDirection: string,
  defaultAlgorithm: AlgorithmType,
  powerPelletEaten: boolean,
  allGhosts: GhostData[],
  globalAI?: { chaseTime: number; scatterTime: number; frightenedDuration: number },
  elapsedSeconds?: number, // Real game time in seconds
): { ghost: GhostData; transition: FSMTransition | null } {
  let transition: FSMTransition | null = null
  const currentState = ghost.state

  // Initialize stateStartTime if not set
  if (ghost.stateStartTime === undefined || ghost.stateStartTime === 0) {
    ghost.stateStartTime = elapsedSeconds || 0
  }

  // Calculate how long we've been in current state
  const timeInState = (elapsedSeconds || 0) - (ghost.stateStartTime || 0)

  // Priority 1: Power pellet eaten - go to frightened mode
  if (powerPelletEaten && ghost.state !== "DEAD") {
    ghost.previousState = ghost.state
    ghost.state = "FRIGHTENED"
    ghost.stateStartTime = elapsedSeconds || 0
    transition = FSM_TRANSITIONS.find((t) => t.from === currentState && t.to === "FRIGHTENED") || null
  }
  // Priority 2: Check state transitions based on REAL TIME
  else {
    switch (ghost.state) {
      case "SCATTER":
        // After 5 seconds, go to CHASE mode permanently
        if (timeInState >= 5) {
          ghost.state = "CHASE"
          ghost.stateStartTime = elapsedSeconds || 0
          ghost.previousState = "SCATTER"
          ghost.isInitialScatter = false
          transition = FSM_TRANSITIONS.find((t) => t.from === "SCATTER" && t.to === "CHASE") || null
        }
        break

      case "FRIGHTENED":
        // After 6 seconds, return to CHASE mode
        if (timeInState >= 6) {
          ghost.state = "CHASE"
          ghost.stateStartTime = elapsedSeconds || 0
          transition = FSM_TRANSITIONS.find((t) => t.from === "FRIGHTENED" && t.to === "CHASE") || null
        }
        break

      case "CHASE":
        // Chase mode is indefinite, no transition
        break
    }
  }

  // Calculate target based on state
  switch (ghost.state) {
    case "CHASE":
      const blinky = allGhosts.find((g) => g.name === "blinky")
      ghost.targetPosition = calculateChaseTarget(ghost, pacmanPosition, pacmanDirection, blinky?.position)
      break
    case "SCATTER":
      // Random movement - not chasing Pacman
      ghost.targetPosition = {
        x: Math.floor(Math.random() * maze.width),
        y: Math.floor(Math.random() * maze.height),
      }
      break
    case "FRIGHTENED":
      // Flee from Pacman - move away
      const dx = ghost.position.x - pacmanPosition.x
      const dy = ghost.position.y - pacmanPosition.y
      ghost.targetPosition = {
        x: Math.max(0, Math.min(maze.width - 1, ghost.position.x + dx * 2)),
        y: Math.max(0, Math.min(maze.height - 1, ghost.position.y + dy * 2)),
      }
      break
    case "DEAD":
      // Return to home as "eyes"
      ghost.targetPosition = ghost.homePosition
      // Check if reached home - respawn in CHASE mode
      if (ghost.position.x === ghost.homePosition.x && ghost.position.y === ghost.homePosition.y) {
        ghost.state = "CHASE"
        ghost.stateTimer = Infinity // Chase mode is indefinite
        transition = FSM_TRANSITIONS.find((t) => t.from === "DEAD" && t.to === "CHASE") || null
      }
      break
  }

  const algorithm = ghost.config.algorithm || defaultAlgorithm
  const { path } = runPathfinding(algorithm, maze, ghost.position, ghost.targetPosition)
  ghost.path = path

  return { ghost, transition }
}

// Move ghost to next position in path
export function moveGhost(ghost: GhostData): GhostData {
  if (ghost.path.length > 1) {
    const nextPos = ghost.path[1]

    // Determine direction
    if (nextPos.x > ghost.position.x) ghost.direction = "right"
    else if (nextPos.x < ghost.position.x) ghost.direction = "left"
    else if (nextPos.y > ghost.position.y) ghost.direction = "down"
    else if (nextPos.y < ghost.position.y) ghost.direction = "up"

    ghost.position = nextPos
    ghost.path = ghost.path.slice(1)
  }

  return ghost
}

// Kill ghost
export function killGhost(ghost: GhostData): { ghost: GhostData; transition: FSMTransition } {
  ghost.state = "DEAD"
  ghost.stateTimer = 0
  const transition = FSM_TRANSITIONS.find((t) => t.from === "FRIGHTENED" && t.to === "DEAD")!
  return { ghost, transition }
}
