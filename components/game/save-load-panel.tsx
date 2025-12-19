"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, FolderOpen, Trash2, Download, Upload } from "lucide-react"
import {
  loadSavedGames,
  saveGame,
  deleteSavedGame,
  type SavedGame,
  exportAllData,
  importData,
} from "@/lib/game/storage"
import type { GameEngineState } from "@/lib/game/game-engine"
import type { GameConfig } from "@/lib/game/types"

interface SaveLoadPanelProps {
  gameState: GameEngineState
  config: GameConfig
  onLoadGame: (savedGame: SavedGame) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SaveLoadPanel({ gameState, config, onLoadGame }: SaveLoadPanelProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [saveName, setSaveName] = useState("")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  useEffect(() => {
    setSavedGames(loadSavedGames())
  }, [])

  const handleSave = () => {
    if (!saveName.trim()) return

    const saved = saveGame({
      name: saveName,
      state: {
        pacmanPosition: gameState.pacman.position,
        ghostPositions: gameState.ghosts.map((g) => g.position),
        pelletsRemaining: gameState.session.pelletsRemaining,
        score: gameState.pacman.score,
        lives: gameState.pacman.lives,
        level: gameState.session.level,
      },
      config,
    })

    setSavedGames([...savedGames, saved])
    setSaveName("")
    setSaveDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteSavedGame(id)
    setSavedGames(savedGames.filter((g) => g.id !== id))
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacmanlab_backup_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (importData(content)) {
        setSavedGames(loadSavedGames())
        alert("Datos importados correctamente")
      } else {
        alert("Error al importar datos")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Save className="w-4 h-4 text-primary" />
          <span>Guardar / Cargar</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save button */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={gameState.gameState === "MENU"}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Partida
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Guardar Partida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nombre de la partida"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <div className="text-sm text-muted-foreground">
                <p>Puntuación: {gameState.pacman.score}</p>
                <p>Vidas: {gameState.pacman.lives}</p>
                <p>Nivel: {gameState.session.level}</p>
              </div>
              <Button onClick={handleSave} className="w-full">
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Saved games list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Partidas Guardadas</h4>
          {savedGames.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No hay partidas guardadas</p>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {savedGames.map((game) => (
                  <div key={game.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.state.score} pts • {formatDate(game.date)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => onLoadGame(game)}>
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(game.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Export/Import */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
            <label>
              <Upload className="w-4 h-4 mr-1" />
              Importar
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
