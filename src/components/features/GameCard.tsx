"use client";

import { GameLog } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import {
    Star,
    Clock,
    Gamepad2,
    Trash2,
    Pencil,
    ExternalLink,
} from "lucide-react";

interface GameCardProps {
    gameLog: GameLog;
    onEdit: (gameLog: GameLog) => void;
    onDelete: (gameLogId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    PLAN_TO_PLAY: {
        label: "Plan to Play",
        color: "bg-purple-900/90",
    },
    PLAYING: {
        label: "Playing",
        color: "bg-blue-900/90",
    },
    COMPLETED: {
        label: "Completed",
        color: "bg-green-900/90",
    },
};

export default function GameCard({ gameLog, onEdit, onDelete }: GameCardProps) {
    const game = gameLog.game;
    const config = statusConfig[gameLog.status] || statusConfig.PLAN_TO_PLAY;
    const genres = game.genres ? JSON.parse(game.genres) : [];

    return (
        <div className="group relative bg-card rounded-xl overflow-hidden border">
            {/* Cover Art */}
            <div className="relative w-full h-44 overflow-hidden">
                {game.backgroundImage ? (
                    <img
                        src={game.backgroundImage}
                        alt={game.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center">
                        <Gamepad2 className="h-12 w-12 text-purple-400/50" />
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    <Badge
                        className={`${config.color} text-xs font-medium px-2 py-1 rounded-md text-white`}
                    >
                        {config.label}
                    </Badge>
                </div>

                {/* Metacritic */}
                {game.metacritic && (
                    <div className="absolute top-3 right-3">
                        <span
                            className={`text-xs font-bold px-2 py-1 rounded-md text-white ${
                                game.metacritic >= 75
                                    ? "bg-green-900/90"
                                    : game.metacritic >= 50
                                      ? "bg-yellow-900/90"
                                      : "bg-red-900/90"
                            }`}
                        >
                            {game.metacritic}
                        </span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {game.slug && (
                        <a
                            href={`https://rawg.io/games/${game.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white transition-colors cursor-pointer"
                            title="View on RAWG"
                        >
                            <ExternalLink className="h-4 w-4 pointer-events-none" />
                        </a>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(gameLog);
                        }}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white transition-colors cursor-pointer"
                        title="Edit"
                    >
                        <Pencil className="h-4 w-4 pointer-events-none" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(gameLog.id);
                        }}
                        className="p-2 rounded-full bg-red-500/20 backdrop-blur-sm hover:bg-red-500/40 text-white transition-colors cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4 pointer-events-none" />
                    </button>
                </div>

                {/* Game title on cover */}
                <div className="absolute bottom-3 left-3 right-24">
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg line-clamp-2">
                        {game.name}
                    </h3>
                </div>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
                {/* Genres */}
                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {genres.slice(0, 3).map((genre: string) => (
                            <span
                                key={genre}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                {/* Meta info row */}
                <div className="flex items-center justify-between text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-3">
                        {/* Rating stars */}
                        {gameLog.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                    {gameLog.rating}/10
                                </span>
                            </div>
                        )}

                        {/* Hours */}
                        {gameLog.hoursPlayed && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{gameLog.hoursPlayed}h</span>
                            </div>
                        )}
                    </div>

                    {/* Platform */}
                    {gameLog.platforms && (
                        <div className="flex flex-wrap gap-1">
                            {JSON.parse(gameLog.platforms).map((p: string) => (
                                <Badge
                                    key={p}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Year */}
                {game.released && (
                    <p className="text-xs text-muted-foreground">
                        {game.released.split("-")[0]}
                    </p>
                )}
            </div>
        </div>
    );
}
