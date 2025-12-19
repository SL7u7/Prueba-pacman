"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Medal, Clock } from "lucide-react"
import { loadHighScores, type HighScore } from "@/lib/game/storage"

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export function HighScoresPanel() {
  const [highScores, setHighScores] = useState<HighScore[]>([])

  useEffect(() => {
    setHighScores(loadHighScores())
  }, [])

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-300"
      case 3:
        return "text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span>High Scores</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {highScores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay puntuaciones guardadas aún. ¡Juega para entrar en el ranking!
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {highScores.map((hs) => (
                <div key={`${hs.date}-${hs.score}`} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                  <div className={`w-6 text-center ${getMedalColor(hs.position)}`}>
                    {hs.position <= 3 ? (
                      <Medal className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">#{hs.position}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-primary">{hs.score.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Nivel {hs.level}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(hs.duration)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">{formatDate(hs.date)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
