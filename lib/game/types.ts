// ===== TIPOS BASE =====
export interface Vector2D {
  x: number
  y: number
}

export type Direction = "up" | "down" | "left" | "right" | "none"

export type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAMEOVER" | "VICTORY"

export type GhostState = "CHASE" | "SCATTER" | "FRIGHTENED" | "DEAD"

export type GhostName = "blinky" | "pinky" | "inky" | "clyde"

export type CellType = "wall" | "path" | "pellet" | "power_pellet" | "ghost_house" | "empty"

export type AlgorithmType = "astar" | "dijkstra" | "bfs"

export type DifficultyPreset = "easy" | "medium" | "hard" | "custom"

export type TargetingStrategy = "direct" | "ambush" | "proximity" | "random"

export type GhostPersonality = "cautious" | "brave" | "unpredictable" | "evasive"

// ===== ENTIDADES =====
export interface PacmanState {
  position: Vector2D
  direction: Direction
  nextDirection: Direction
  lives: number
  score: number
  pelletsEaten: number
  powerActive: boolean
  powerTimer: number
  ghostsEatenThisPower: number // Track combo for 200, 400, 800, 1600 points
}

export interface GhostConfig {
  targetingStrategy: TargetingStrategy
  aggressiveness: number // 1-10
  relativeSpeed: number // 0.5-1.5
  algorithm: AlgorithmType
  personality: GhostPersonality[]
}

export interface GhostData {
  name: GhostName
  position: Vector2D
  direction: Direction
  state: GhostState
  targetPosition: Vector2D
  path: Vector2D[]
  color: string
  scatterCorner: Vector2D
  homePosition: Vector2D
  stateTimer: number
  config: GhostConfig
  isInitialScatter?: boolean // Track if this is the first scatter phase
  previousState?: GhostState // Track previous state for returning from frightened mode
  stateStartTime?: number // Real elapsed seconds when state started
}

export interface Cell {
  type: CellType
  x: number
  y: number
  hasPellet: boolean
  hasPowerPellet: boolean
}

export interface Maze {
  width: number
  height: number
  cells: Cell[][]
  pacmanStart: Vector2D
  ghostHome: Vector2D
  totalPellets: number
}

// ===== ALGORITMOS =====
export interface PathNode {
  position: Vector2D
  g: number
  h: number
  f: number
  parent: PathNode | null
}

export interface AlgorithmMetrics {
  algorithm: AlgorithmType
  nodesExpanded: number
  executionTimeMs: number
  pathLength: number
  timestamp: number
  memoryUsage?: number
}

export interface ComparisonResult {
  algorithms: AlgorithmType[]
  metrics: AlgorithmMetrics[]
  origin: Vector2D
  destination: Vector2D
}

// ===== SESIÓN =====
export interface GameSession {
  score: number
  lives: number
  level: number
  pelletsRemaining: number
  totalPellets: number
  startTime: number
  elapsedTime: number
  algorithmMetrics: AlgorithmMetrics[]
}

export interface GlobalAIConfig {
  agentSpeed: number // 0.5-2.0
  scatterTime: number // seconds
  chaseTime: number // seconds
  frightenedDuration: number // seconds
}

export interface GameConfig {
  difficulty: number
  difficultyPreset: DifficultyPreset
  defaultAlgorithm: AlgorithmType
  gameSpeed: number
  soundEnabled: boolean
  showTooltips: boolean
  showPathVisualization: boolean
  showFSMVisualization: boolean
  globalAI: GlobalAIConfig
  ghostConfigs: Record<GhostName, GhostConfig>
}

export interface LevelProgress {
  unlockedLevels: number[]
  highScoreByLevel: Record<number, number>
  completedLevels: number[]
}

// ===== FSM =====
export interface FSMTransition {
  from: GhostState
  to: GhostState
  condition: string
  event: string
}

export interface FSMVisualization {
  currentState: GhostState
  ghostName: GhostName
  stateHistory: { state: GhostState; timestamp: number }[]
  transitions: FSMTransition[]
  transitionCounts: Record<GhostState, number>
}

export interface GameFrame {
  frameNumber: number
  timestamp: number
  pacmanPosition: Vector2D
  pacmanDirection: Direction
  ghostStates: {
    name: GhostName
    position: Vector2D
    state: GhostState
    target: Vector2D
    path: Vector2D[]
  }[]
  score: number
  pelletsRemaining: number
  events: GameEvent[]
}

export interface GameEvent {
  timestamp: number
  type: "fsm_change" | "pellet_eaten" | "power_pellet" | "ghost_eaten" | "pacman_death" | "level_complete"
  description: string
  ghostName?: GhostName
  details?: string
}

export type AppView = "menu" | "game" | "algorithms" | "stepbystep" | "config"
