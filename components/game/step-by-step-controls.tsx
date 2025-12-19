"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
    SkipBack,
    ChevronLeft,
    Play,
    Pause,
    ChevronRight,
    SkipForward,
    X,
} from "lucide-react"
import type { GameFrame } from "@/lib/game/types"

interface StepByStepControlsProps {
    isActive: boolean
    currentFrame: number
    totalFrames: number
    isPlaying: boolean
    playbackSpeed: number
    frameData?: GameFrame
    onToggleMode: () => void
    onPlayPause: () => void
    onNextFrame: () => void
    onPrevFrame: () => void
    onGoToStart: () => void
    onGoToEnd: () => void
    onSpeedChange: (speed: number) => void
    onFrameSeek: (frame: number) => void
}

export function StepByStepControls({
    isActive,
    currentFrame,
    totalFrames,
    isPlaying,
    playbackSpeed,
    frameData,
    onToggleMode,
    onPlayPause,
    onNextFrame,
    onPrevFrame,
    onGoToStart,
    onGoToEnd,
    onSpeedChange,
    onFrameSeek,
}: StepByStepControlsProps) {
    if (!isActive) {
        return (
            <div className="flex justify-center">
                <Button onClick={onToggleMode} variant="outline" size="sm">
                    🎬 Activar Modo Paso a Paso
                </Button>
            </div>
        )
    }

    return (
        <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-primary">🎬 Modo Paso a Paso</span>
                        <Badge variant="outline" className="text-xs">
                            Activo
                        </Badge>
                    </CardTitle>
                    <Button onClick={onToggleMode} variant="ghost" size="sm">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Frame Info */}
                <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Frame</p>
                    <p className="text-lg font-bold">
                        {currentFrame} / {totalFrames}
                    </p>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-2">
                    <Button onClick={onGoToStart} variant="outline" size="sm" disabled={currentFrame === 0}>
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button onClick={onPrevFrame} variant="outline" size="sm" disabled={currentFrame === 0}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button onClick={onPlayPause} variant="default" size="sm">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button onClick={onNextFrame} variant="outline" size="sm" disabled={currentFrame >= totalFrames - 1}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button onClick={onGoToEnd} variant="outline" size="sm" disabled={currentFrame >= totalFrames - 1}>
                        <SkipForward className="w-4 h-4" />
                    </Button>
                </div>

                {/* Timeline Slider */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Timeline</p>
                    <Slider
                        value={[currentFrame]}
                        onValueChange={(value) => onFrameSeek(value[0])}
                        max={Math.max(totalFrames - 1, 0)}
                        step={1}
                        className="w-full"
                    />
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Velocidad: {playbackSpeed}x</p>
                    <div className="flex gap-1 justify-center">
                        {[0.25, 0.5, 1, 2, 4].map((speed) => (
                            <Button
                                key={speed}
                                onClick={() => onSpeedChange(speed)}
                                variant={playbackSpeed === speed ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                            >
                                {speed}x
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Frame Information */}
                {frameData && (
                    <div className="space-y-2 p-3 bg-muted/20 rounded text-xs">
                        <h4 className="font-semibold text-sm">Información del Frame</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-muted-foreground">Pacman</p>
                                <p className="font-mono">
                                    ({frameData.pacmanPosition.x}, {frameData.pacmanPosition.y})
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Dirección</p>
                                <p className="font-mono">{frameData.pacmanDirection}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Puntuación</p>
                                <p className="font-mono">{frameData.score}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Pellets</p>
                                <p className="font-mono">{frameData.pelletsRemaining}</p>
                            </div>
                        </div>

                        {/* Ghost States */}
                        <div className="mt-2">
                            <p className="text-muted-foreground mb-1">Estados de Fantasmas</p>
                            <div className="space-y-1">
                                {frameData.ghostStates.map((ghost) => (
                                    <div key={ghost.name} className="flex justify-between items-center text-xs">
                                        <span className="capitalize">{ghost.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {ghost.state}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Events */}
                        {frameData.events.length > 0 && (
                            <div className="mt-2">
                                <p className="text-muted-foreground mb-1">Eventos</p>
                                <div className="space-y-1">
                                    {frameData.events.map((event, i) => (
                                        <p key={i} className="text-xs">
                                            • {event.description}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
