import type { GameConfig, AlgorithmType, AlgorithmMetrics, GhostName, LevelProgress, DifficultyPreset } from "./types"

// Storage keys
const STORAGE_KEYS = {
  CONFIG: "pacmanlab_config",
  HIGH_SCORES: "pacmanlab_highscores",
  SAVED_GAMES: "pacmanlab_partidas",
  METRICS: "pacmanlab_metricas",
  COMPARISONS: "pacmanlab_comparaciones",
  PROGRESS: "pacmanlab_progreso",
  LEVEL_PROGRESS: "pacmanlab_level_progress",
} as const

// ===== TIPOS DE ALMACENAMIENTO =====
export interface HighScore {
  position: number
  score: number
  level: number
  date: string
  duration: number
}

export interface SavedGame {
  id: string
  name: string
  date: string
  state: {
    pacmanPosition: { x: number; y: number }
    ghostPositions: { x: number; y: number }[]
    pelletsRemaining: number
    score: number
    lives: number
    level: number
  }
  config: GameConfig
}

export interface ComparisonRecord {
  id: string
  date: string
  algorithms: AlgorithmType[]
  results: AlgorithmMetrics[]
  level: number
}

export interface EducationalProgress {
  tutorialsCompleted: string[]
  algorithmsExplored: AlgorithmType[]
  fsmStatesViewed: string[]
  totalGameTime: number
  totalGames: number
}

// ===== UTILIDADES =====
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) return defaultValue

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    console.error("Error saving to localStorage:", key)
    return false
  }
}

// ===== CONFIGURACIÓN =====
const DEFAULT_GHOST_CONFIGS: Record<GhostName, import("./types").GhostConfig> = {
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

const DEFAULT_GLOBAL_AI: import("./types").GlobalAIConfig = {
  agentSpeed: 1.0,
  scatterTime: 7,
  chaseTime: 20,
  frightenedDuration: 6,
}

const DEFAULT_CONFIG: GameConfig = {
  difficulty: 3,
  difficultyPreset: "medium",
  defaultAlgorithm: "astar",
  gameSpeed: 1,
  soundEnabled: false,
  showTooltips: true,
  showPathVisualization: true,
  showFSMVisualization: true,
  globalAI: DEFAULT_GLOBAL_AI,
  ghostConfigs: DEFAULT_GHOST_CONFIGS,
}

export function loadConfig(): GameConfig {
  const stored = getItem(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG)
  // Ensure all required properties exist by merging with defaults
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    globalAI: {
      ...DEFAULT_GLOBAL_AI,
      ...(stored.globalAI || {}),
    },
    ghostConfigs: {
      blinky: { ...DEFAULT_GHOST_CONFIGS.blinky, ...(stored.ghostConfigs?.blinky || {}) },
      pinky: { ...DEFAULT_GHOST_CONFIGS.pinky, ...(stored.ghostConfigs?.pinky || {}) },
      inky: { ...DEFAULT_GHOST_CONFIGS.inky, ...(stored.ghostConfigs?.inky || {}) },
      clyde: { ...DEFAULT_GHOST_CONFIGS.clyde, ...(stored.ghostConfigs?.clyde || {}) },
    },
  }
}

export function saveConfig(config: GameConfig): boolean {
  return setItem(STORAGE_KEYS.CONFIG, config)
}

// ===== HIGH SCORES =====
export function loadHighScores(): HighScore[] {
  return getItem(STORAGE_KEYS.HIGH_SCORES, [])
}

export function saveHighScore(score: number, level: number, duration: number): HighScore[] {
  const highScores = loadHighScores()

  const newScore: HighScore = {
    position: 0,
    score,
    level,
    date: new Date().toISOString(),
    duration,
  }

  highScores.push(newScore)
  highScores.sort((a, b) => b.score - a.score)

  // Keep only top 10
  const top10 = highScores.slice(0, 10).map((hs, index) => ({
    ...hs,
    position: index + 1,
  }))

  setItem(STORAGE_KEYS.HIGH_SCORES, top10)
  return top10
}

export function isHighScore(score: number): boolean {
  const highScores = loadHighScores()
  if (highScores.length < 10) return true
  return score > (highScores[highScores.length - 1]?.score || 0)
}

// ===== PARTIDAS GUARDADAS =====
export function loadSavedGames(): SavedGame[] {
  return getItem(STORAGE_KEYS.SAVED_GAMES, [])
}

export function saveGame(game: Omit<SavedGame, "id" | "date">): SavedGame {
  const savedGames = loadSavedGames()

  const newGame: SavedGame = {
    ...game,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  }

  savedGames.push(newGame)

  // Keep only last 10 saves
  const recent = savedGames.slice(-10)
  setItem(STORAGE_KEYS.SAVED_GAMES, recent)

  return newGame
}

export function deleteSavedGame(id: string): boolean {
  const savedGames = loadSavedGames()
  const filtered = savedGames.filter((g) => g.id !== id)
  return setItem(STORAGE_KEYS.SAVED_GAMES, filtered)
}

// ===== MÉTRICAS DE ALGORITMOS =====
export function loadMetrics(): AlgorithmMetrics[] {
  return getItem(STORAGE_KEYS.METRICS, [])
}

export function saveMetrics(metrics: AlgorithmMetrics): AlgorithmMetrics[] {
  const allMetrics = loadMetrics()
  allMetrics.push(metrics)

  // Keep only last 100 metrics
  const recent = allMetrics.slice(-100)
  setItem(STORAGE_KEYS.METRICS, recent)

  return recent
}

export function getMetricsStats(): {
  byAlgorithm: Record<AlgorithmType, { avgNodes: number; avgTime: number; count: number }>
  total: number
} {
  const metrics = loadMetrics()
  const stats: Record<AlgorithmType, { totalNodes: number; totalTime: number; count: number }> = {
    astar: { totalNodes: 0, totalTime: 0, count: 0 },
    dijkstra: { totalNodes: 0, totalTime: 0, count: 0 },
    bfs: { totalNodes: 0, totalTime: 0, count: 0 },
  }

  for (const m of metrics) {
    stats[m.algorithm].totalNodes += m.nodesExpanded
    stats[m.algorithm].totalTime += m.executionTimeMs
    stats[m.algorithm].count++
  }

  const byAlgorithm: Record<AlgorithmType, { avgNodes: number; avgTime: number; count: number }> = {
    astar: {
      avgNodes: stats.astar.count > 0 ? Math.round(stats.astar.totalNodes / stats.astar.count) : 0,
      avgTime: stats.astar.count > 0 ? stats.astar.totalTime / stats.astar.count : 0,
      count: stats.astar.count,
    },
    dijkstra: {
      avgNodes: stats.dijkstra.count > 0 ? Math.round(stats.dijkstra.totalNodes / stats.dijkstra.count) : 0,
      avgTime: stats.dijkstra.count > 0 ? stats.dijkstra.totalTime / stats.dijkstra.count : 0,
      count: stats.dijkstra.count,
    },
    bfs: {
      avgNodes: stats.bfs.count > 0 ? Math.round(stats.bfs.totalNodes / stats.bfs.count) : 0,
      avgTime: stats.bfs.count > 0 ? stats.bfs.totalTime / stats.bfs.count : 0,
      count: stats.bfs.count,
    },
  }

  return { byAlgorithm, total: metrics.length }
}

// ===== COMPARACIONES =====
export function loadComparisons(): ComparisonRecord[] {
  return getItem(STORAGE_KEYS.COMPARISONS, [])
}

export function saveComparison(
  algorithms: AlgorithmType[],
  results: AlgorithmMetrics[],
  level: number,
): ComparisonRecord {
  const comparisons = loadComparisons()

  const newComparison: ComparisonRecord = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    algorithms,
    results,
    level,
  }

  comparisons.push(newComparison)

  // Keep only last 20 comparisons
  const recent = comparisons.slice(-20)
  setItem(STORAGE_KEYS.COMPARISONS, recent)

  return newComparison
}

// ===== PROGRESO EDUCATIVO =====
const DEFAULT_PROGRESS: EducationalProgress = {
  tutorialsCompleted: [],
  algorithmsExplored: [],
  fsmStatesViewed: [],
  totalGameTime: 0,
  totalGames: 0,
}

export function loadProgress(): EducationalProgress {
  return getItem(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS)
}

export function updateProgress(updates: Partial<EducationalProgress>): EducationalProgress {
  const progress = loadProgress()
  const updated = { ...progress, ...updates }
  setItem(STORAGE_KEYS.PROGRESS, updated)
  return updated
}

export function markTutorialCompleted(tutorialId: string): void {
  const progress = loadProgress()
  if (!progress.tutorialsCompleted.includes(tutorialId)) {
    progress.tutorialsCompleted.push(tutorialId)
    setItem(STORAGE_KEYS.PROGRESS, progress)
  }
}

export function markAlgorithmExplored(algorithm: AlgorithmType): void {
  const progress = loadProgress()
  if (!progress.algorithmsExplored.includes(algorithm)) {
    progress.algorithmsExplored.push(algorithm)
    setItem(STORAGE_KEYS.PROGRESS, progress)
  }
}

export function incrementGameStats(gameTime: number): void {
  const progress = loadProgress()
  progress.totalGameTime += gameTime
  progress.totalGames++
  setItem(STORAGE_KEYS.PROGRESS, progress)
}

// ===== LEVEL PROGRESS =====
const DEFAULT_LEVEL_PROGRESS: LevelProgress = {
  unlockedLevels: [1],
  highScoreByLevel: {},
  completedLevels: [],
}

export function loadLevelProgress(): LevelProgress {
  return getItem(STORAGE_KEYS.LEVEL_PROGRESS, DEFAULT_LEVEL_PROGRESS)
}

export function saveLevelProgress(progress: LevelProgress): boolean {
  return setItem(STORAGE_KEYS.LEVEL_PROGRESS, progress)
}

export function unlockLevel(level: number): void {
  const progress = loadLevelProgress()
  if (!progress.unlockedLevels.includes(level)) {
    progress.unlockedLevels.push(level)
    progress.unlockedLevels.sort((a, b) => a - b)
    saveLevelProgress(progress)
  }
}

export function markLevelCompleted(level: number, score: number): void {
  const progress = loadLevelProgress()
  if (!progress.completedLevels.includes(level)) {
    progress.completedLevels.push(level)
  }
  if (!progress.highScoreByLevel[level] || score > progress.highScoreByLevel[level]) {
    progress.highScoreByLevel[level] = score
  }
  // Unlock next level
  if (!progress.unlockedLevels.includes(level + 1) && level < 10) {
    progress.unlockedLevels.push(level + 1)
  }
  saveLevelProgress(progress)
}

export function isLevelUnlocked(level: number): boolean {
  const progress = loadLevelProgress()
  return progress.unlockedLevels.includes(level)
}

// ===== EXPORTAR/IMPORTAR DATOS =====
export function exportAllData(): string {
  const data = {
    config: loadConfig(),
    highScores: loadHighScores(),
    savedGames: loadSavedGames(),
    metrics: loadMetrics(),
    comparisons: loadComparisons(),
    progress: loadProgress(),
    levelProgress: loadLevelProgress(),
    exportDate: new Date().toISOString(),
  }

  return JSON.stringify(data, null, 2)
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)

    if (data.config) setItem(STORAGE_KEYS.CONFIG, data.config)
    if (data.highScores) setItem(STORAGE_KEYS.HIGH_SCORES, data.highScores)
    if (data.savedGames) setItem(STORAGE_KEYS.SAVED_GAMES, data.savedGames)
    if (data.metrics) setItem(STORAGE_KEYS.METRICS, data.metrics)
    if (data.comparisons) setItem(STORAGE_KEYS.COMPARISONS, data.comparisons)
    if (data.progress) setItem(STORAGE_KEYS.PROGRESS, data.progress)
    if (data.levelProgress) setItem(STORAGE_KEYS.LEVEL_PROGRESS, data.levelProgress)

    return true
  } catch {
    console.error("Error importing data")
    return false
  }
}

export function clearAllData(): void {
  if (!isLocalStorageAvailable()) return

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

// ===== DIFFICULTY PRESETS =====
export function getDifficultyPreset(preset: DifficultyPreset): Partial<GameConfig> {
  switch (preset) {
    case "easy":
      return {
        difficulty: 1,
        difficultyPreset: "easy",
        globalAI: {
          agentSpeed: 0.7,
          scatterTime: 10,
          chaseTime: 15,
          frightenedDuration: 8,
        },
      }
    case "medium":
      return {
        difficulty: 3,
        difficultyPreset: "medium",
        globalAI: DEFAULT_GLOBAL_AI,
      }
    case "hard":
      return {
        difficulty: 5,
        difficultyPreset: "hard",
        globalAI: {
          agentSpeed: 1.3,
          scatterTime: 5,
          chaseTime: 25,
          frightenedDuration: 4,
        },
      }
    case "custom":
      return { difficultyPreset: "custom" }
    default:
      return {}
  }
}

export function getDefaultGhostConfig(): Record<GhostName, import("./types").GhostConfig> {
  return JSON.parse(JSON.stringify(DEFAULT_GHOST_CONFIGS))
}

export function getDefaultConfig(): GameConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}
