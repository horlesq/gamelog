"use client";

import { GameLog } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import {
    Star,
    Clock,
    Calendar,
    Pencil,
    Trash2,
    ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface GameListProps {
    gameLogs: GameLog[];
    onEdit: (gameLog: GameLog) => void;
    onDelete: (gameLogId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    PLAN_TO_PLAY: {
        label: "Plan to Play",
        color: "bg-purple-900/90 hover:bg-purple-900/70 border-purple-700/50",
    },
    PLAYING: {
        label: "Playing",
        color: "bg-blue-900/90 hover:bg-blue-900/70 border-blue-700/50",
    },
    COMPLETED: {
        label: "Completed",
        color: "bg-green-900/90 hover:bg-green-900/70 border-green-700/50",
    },
};

export default function GameList({
    gameLogs,
    onEdit,
    onDelete,
}: GameListProps) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50 hover:bg-muted/50 text-muted-foreground">
                            <th className="h-12 px-4 text-left align-middle font-medium">
                                Game
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium">
                                Status
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">
                                Platform
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">
                                Rating
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">
                                Time Played
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden xl:table-cell">
                                Date Added
                            </th>
                            <th className="h-12 px-4 text-right align-middle font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {gameLogs.map((gameLog) => {
                            const config =
                                statusConfig[gameLog.status] ||
                                statusConfig.PLAN_TO_PLAY;
                            const platforms = gameLog.platforms
                                ? JSON.parse(gameLog.platforms)
                                : [];

                            return (
                                <tr
                                    key={gameLog.id}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                >
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0">
                                                {gameLog.game
                                                    .backgroundImage ? (
                                                    <Image
                                                        src={
                                                            gameLog.game
                                                                .backgroundImage
                                                        }
                                                        alt={gameLog.game.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground">
                                                            No img
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-medium">
                                                {gameLog.game.name}
                                                <div className="md:hidden text-xs text-muted-foreground mt-1">
                                                    {platforms.join(", ")}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge
                                            variant="outline"
                                            className={`${config.color} text-white border`}
                                        >
                                            {config.label}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {platforms.map((p: string) => (
                                                <Badge
                                                    key={p}
                                                    variant="secondary"
                                                    className="text-xs font-normal"
                                                >
                                                    {p}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle hidden sm:table-cell">
                                        {gameLog.rating ? (
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>{gameLog.rating}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle hidden lg:table-cell">
                                        {gameLog.hoursPlayed ? (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {gameLog.hoursPlayed}h
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle hidden xl:table-cell">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {new Date(
                                                    gameLog.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {gameLog.game.slug && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <a
                                                        href={`https://rawg.io/games/${gameLog.game.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            View on RAWG
                                                        </span>
                                                    </a>
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(gameLog)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Edit
                                                </span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    onDelete(gameLog.id)
                                                }
                                                className="h-8 w-8 text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Delete
                                                </span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
