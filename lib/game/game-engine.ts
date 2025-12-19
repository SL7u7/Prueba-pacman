import type {
  GameState,
  PacmanState,
  GhostData,
  Maze,
  Direction,
  Vector2D,
  GameSession,
  GameConfig,
  FSMVisualization,
  FSMTransition,
  GameFrame,
} from "./types"
import { createMaze, getCellAt, isWalkable } from "./maze-data"
import { createAllGhosts, updateGhostState, moveGhost, killGhost } from "./ghost-fsm"

const POINTS = {
  PELLET: 10,
  POWER_PELLET: 50,
  GHOST: 200,
}

const DIRECTION_VECTORS: Record<Direction, Vector2D> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
}

export interface GameEngineState {
  gameState: GameState
  pacman: PacmanState
  ghosts: GhostData[]
  maze: Maze
  session: GameSession
  fsmVisualizations: FSMVisualization[]
  lastTransitions: { ghostName: string; transition: FSMTransition }[]
  pathVisualization: Vector2D[]
  expandedNodes: Vector2D[]
  // Step-by-step mode
  frameHistory: GameFrame[]
  currentFrameIndex: number
  isStepByStepMode: boolean
  playbackSpeed: number
  isPaused: boolean
  // Real-time tracking
  gameStartTime: number // Timestamp when game started
  elapsedSeconds: number // Elapsed time in seconds
  hasMovedOnce: boolean // Track if Pacman has moved at least once
  pausedTime: number // Total time spent paused (in ms)
  lastPauseTime: number // Timestamp when game was paused
}

export function createInitialState(config: GameConfig, level: number = 1): GameEngineState {
  const maze = createMaze(level)
  const ghosts = createAllGhosts(maze.ghostHome, config.ghostConfigs)

  const pacman: PacmanState = {
    position: { ...maze.pacmanStart },
    direction: "none",
    nextDirection: "none",
    lives: 3,
    score: 0,
    pelletsEaten: 0,
    powerActive: false,
    powerTimer: 0,
    ghostsEatenThisPower: 0,
  }

  const session: GameSession = {
    score: 0,
    lives: 3,
    level: 1,
    pelletsRemaining: maze.totalPellets,
    totalPellets: maze.totalPellets,
    startTime: Date.now(),
    elapsedTime: 0,
    algorithmMetrics: [],
  }

  const fsmVisualizations: FSMVisualization[] = ghosts.map((ghost) => ({
    currentState: ghost.state,
    ghostName: ghost.name,
    stateHistory: [{ state: ghost.state, timestamp: Date.now() }],
    transitions: [],
    transitionCounts: { CHASE: 0, SCATTER: 0, FRIGHTENED: 0, DEAD: 0 },
  }))

  return {
    gameState: "MENU",
    pacman,
    ghosts,
    maze,
    session,
    fsmVisualizations,
    lastTransitions: [],
    pathVisualization: [],
    expandedNodes: [],
    // Step-by-step mode
    frameHistory: [],
    currentFrameIndex: 0,
    isStepByStepMode: false,
    playbackSpeed: 1,
    isPaused: false,
    // Real-time tracking
    gameStartTime: 0,
    elapsedSeconds: 0,
    hasMovedOnce: false,
    pausedTime: 0,
    lastPauseTime: 0,
  }
}

export function startGame(state: GameEngineState): GameEngineState {
  return {
    ...state,
    gameState: "PLAYING",
    gameStartTime: 0, // Will be set on first movement
    elapsedSeconds: 0,
    hasMovedOnce: false,
    pausedTime: 0,
    lastPauseTime: 0,
    session: {
      ...state.session,
      startTime: Date.now(),
    },
  }
}

export function pauseGame(state: GameEngineState): GameEngineState {
  const isPausing = state.gameState === "PLAYING"

  return {
    ...state,
    gameState: state.gameState === "PLAYING" ? "PAUSED" : "PLAYING",
    lastPauseTime: isPausing ? Date.now() : 0,
    // When resuming, add the paused duration to pausedTime
    pausedTime: !isPausing && state.lastPauseTime > 0
      ? state.pausedTime + (Date.now() - state.lastPauseTime)
      : state.pausedTime,
  }
}

export function setDirection(state: GameEngineState, direction: Direction): GameEngineState {
  return {
    ...state,
    pacman: {
      ...state.pacman,
      nextDirection: direction,
    },
  }
}

function movePacman(pacman: PacmanState, maze: Maze): PacmanState {
  let newDirection = pacman.nextDirection
  let dirVector = DIRECTION_VECTORS[newDirection]
  let newPos = {
    x: pacman.position.x + dirVector.x,
    y: pacman.position.y + dirVector.y,
  }

  if (newPos.x < 0) newPos.x = maze.width - 1
  if (newPos.x >= maze.width) newPos.x = 0

  if (!isWalkable(maze, newPos)) {
    newDirection = pacman.direction
    dirVector = DIRECTION_VECTORS[newDirection]
    newPos = {
      x: pacman.position.x + dirVector.x,
      y: pacman.position.y + dirVector.y,
    }

    if (newPos.x < 0) newPos.x = maze.width - 1
    if (newPos.x >= maze.width) newPos.x = 0

    if (!isWalkable(maze, newPos)) {
      return pacman
    }
  }

  return {
    ...pacman,
    position: newPos,
    direction: newDirection,
  }
}

function checkPelletCollision(
  pacman: PacmanState,
  maze: Maze,
): {
  pacman: PacmanState
  maze: Maze
  powerPelletEaten: boolean
} {
  const cell = getCellAt(maze, pacman.position)
  let powerPelletEaten = false
  let mazeChanged = false

  if (cell) {
    // Regular pellet
    if (cell.hasPellet) {
      pacman = { ...pacman, score: pacman.score + POINTS.PELLET, pelletsEaten: pacman.pelletsEaten + 1 }
      cell.hasPellet = false
      mazeChanged = true
      console.log(`Pellet eaten! Total: ${pacman.pelletsEaten}`)
    }
    // Power pellet
    else if (cell.hasPowerPellet) {
      pacman = {
        ...pacman,
        score: pacman.score + POINTS.POWER_PELLET,
        pelletsEaten: pacman.pelletsEaten + 1,
        powerActive: true,
        powerTimer: 6 * 60,
        ghostsEatenThisPower: 0,
      }
      cell.hasPowerPellet = false
      powerPelletEaten = true
      mazeChanged = true
      console.log(`Power pellet eaten! Total: ${pacman.pelletsEaten}`)
    }
  }

  // Return updated maze if changed
  if (mazeChanged) {
    maze = { ...maze, cells: maze.cells.map(row => [...row]) }
  }

  return { pacman, maze, powerPelletEaten }
}

function checkGhostCollision(
  pacman: PacmanState,
  ghosts: GhostData[],
): {
  pacman: PacmanState
  ghosts: GhostData[]
  ghostKilled: boolean
} {
  let ghostKilled = false
  const COLLISION_DISTANCE = 0.6 // Collision within 0.6 cells

  // Create a mutable copy of the ghosts array to allow modifications
  const updatedGhosts = ghosts.map((g) => ({ ...g }))

  for (let i = 0; i < updatedGhosts.length; i++) {
    const ghost = updatedGhosts[i]
    // Calculate distance between Pacman and ghost
    const dx = pacman.position.x - ghost.position.x
    const dy = pacman.position.y - ghost.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if collision occurred
    if (distance < COLLISION_DISTANCE) {
      if (ghost.state === "FRIGHTENED") {
        // Pacman eats ghost
        const { ghost: killedGhost } = killGhost(ghost) // Assuming killGhost returns a new ghost object
        updatedGhosts[i] = killedGhost // Update the ghost in the array
        ghostKilled = true

        // Award points based on combo (200, 400, 800, 1600)
        const ghostsEatenThisPower = pacman.ghostsEatenThisPower || 0
        const points = 200 * Math.pow(2, ghostsEatenThisPower)
        pacman.score += points
        pacman.ghostsEatenThisPower = ghostsEatenThisPower + 1
      } else if (ghost.state !== "DEAD") {
        // Ghost hits Pacman
        pacman.lives--
        pacman.position = { x: 14, y: 23 } // Reset to start position
        pacman.direction = "none"
        pacman.nextDirection = "none"
        pacman.ghostsEatenThisPower = 0 // Reset combo counter on Pacman death
      }
    }
  }

  return { pacman, ghosts, ghostKilled }
}

export function updateGame(state: GameEngineState, config: GameConfig): GameEngineState {
  if (state.gameState !== "PLAYING") {
    return state
  }

  let { pacman, ghosts, maze, session, fsmVisualizations } = state
  const lastTransitions: { ghostName: string; transition: FSMTransition }[] = []

  // Move Pacman
  const previousPosition = { ...pacman.position }
  pacman = movePacman(pacman, maze)

  // Check if Pacman moved for the first time
  let gameStartTime = state.gameStartTime
  let hasMovedOnce = state.hasMovedOnce

  if (!hasMovedOnce && (pacman.position.x !== previousPosition.x || pacman.position.y !== previousPosition.y)) {
    // First movement detected - start the timer
    gameStartTime = Date.now()
    hasMovedOnce = true
  }

  // Calculate elapsed time in seconds (only if game has started and accounting for paused time)
  const elapsedSeconds = hasMovedOnce && gameStartTime > 0
    ? Math.floor((Date.now() - gameStartTime - state.pausedTime) / 1000)
    : 0

  const pelletResult = checkPelletCollision(pacman, maze)
  pacman = pelletResult.pacman
  maze = pelletResult.maze
  const powerPelletEaten = pelletResult.powerPelletEaten

  if (pacman.powerActive) {
    pacman.powerTimer--
    if (pacman.powerTimer <= 0) {
      pacman.powerActive = false
      pacman.ghostsEatenThisPower = 0 // Reset combo counter when power ends
    }
  }

  const newGhosts: GhostData[] = []
  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i]
    const { ghost: updatedGhost, transition } = updateGhostState(
      ghost,
      maze,
      pacman.position,
      pacman.direction,
      config.defaultAlgorithm,
      powerPelletEaten,
      ghosts,
      config.globalAI,
      elapsedSeconds, // Pass real game time
    )

    const movedGhost = moveGhost(updatedGhost)
    newGhosts.push(movedGhost)

    if (transition) {
      lastTransitions.push({ ghostName: movedGhost.name, transition })
      fsmVisualizations[i].stateHistory.push({
        state: movedGhost.state,
        timestamp: Date.now(),
      })
      fsmVisualizations[i].transitionCounts[movedGhost.state]++
    }
    fsmVisualizations[i].currentState = movedGhost.state
  }
  ghosts = newGhosts

  const ghostResult = checkGhostCollision(pacman, ghosts)
  pacman = ghostResult.pacman
  ghosts = ghostResult.ghosts

  session = {
    ...session,
    score: pacman.score,
    lives: pacman.lives,
    pelletsRemaining: maze.totalPellets - pacman.pelletsEaten,
    elapsedTime: Date.now() - session.startTime,
  }

  const pathVisualization = ghosts[0]?.path || []

  // Record frame for step-by-step mode
  const MAX_FRAME_HISTORY = 1000
  let frameHistory = [...state.frameHistory]

  // Create current frame snapshot
  const currentFrame: GameFrame = {
    frameNumber: state.currentFrameIndex + 1,
    timestamp: Date.now(),
    pacmanPosition: { ...pacman.position },
    pacmanDirection: pacman.direction,
    ghostStates: ghosts.map((g) => ({
      name: g.name,
      position: { ...g.position },
      state: g.state,
      target: { ...g.targetPosition },
      path: [...g.path],
    })),
    score: pacman.score,
    pelletsRemaining: session.pelletsRemaining,
    events: lastTransitions.map((lt) => ({
      timestamp: Date.now(),
      type: "fsm_change" as const,
      description: `${lt.ghostName} changed state`,
      ghostName: lt.ghostName as import("./types").GhostName,
      details: `${lt.transition.from} → ${lt.transition.to}`,
    })),
  }

  // Add frame to history (limit to MAX_FRAME_HISTORY)
  frameHistory.push(currentFrame)
  if (frameHistory.length > MAX_FRAME_HISTORY) {
    frameHistory = frameHistory.slice(-MAX_FRAME_HISTORY)
  }

  // Check victory and game over conditions
  let newGameState: GameState = state.gameState

  // Debug: Log pellet count
  console.log(`Pellets eaten: ${pacman.pelletsEaten}, Total: ${maze.totalPellets}`)

  if (pacman.lives <= 0) {
    newGameState = "GAMEOVER"
  } else if (pacman.pelletsEaten >= maze.totalPellets) {
    // Victory when all pellets are eaten
    console.log("VICTORY TRIGGERED!")
    newGameState = "VICTORY"
  }

  return {
    ...state,
    gameState: newGameState,
    pacman,
    ghosts,
    maze,
    session,
    fsmVisualizations,
    lastTransitions,
    pathVisualization,
    frameHistory,
    currentFrameIndex: frameHistory.length - 1,
    elapsedSeconds, // Update elapsed time
    gameStartTime, // Update start time
    hasMovedOnce, // Update movement flag
  }
}

export function resetGame(config: GameConfig, level: number = 1): GameEngineState {
  return createInitialState(config, level)
}
