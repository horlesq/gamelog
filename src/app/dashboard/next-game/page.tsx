"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, Gamepad2 } from "lucide-react";
import {
    getNextGameSuggestions,
    loadSuggestions,
    saveSuggestions,
    loadExcludedNames,
    saveExcludedNames,
    loadAddedIds,
    saveAddedIds,
    clearHistory,
} from "@/lib/client/next-game";
import { createGameLog, getGameLogs } from "@/lib/client/game-logs";
import toast from "react-hot-toast";
import SuggestionCard, {
    Suggestion,
} from "@/components/features/SuggestionCard";

export default function AiSuggestPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            // Load addedIds synchronously first to prevent button flicker
            const storedAddedIds = loadAddedIds();
            if (storedAddedIds.size > 0) {
                setAddedIds(storedAddedIds);
            }

            const stored = loadSuggestions();
            if (stored.length > 0) {
                setSuggestions(stored);
                setHasGenerated(true);
            }

            try {
                // Fetch user's actual game logs to see what they already have
                const { gameLogs } = await getGameLogs();
                const libraryIds = new Set<number>(
                    gameLogs.map((log: any) => log.game.rawgId).filter(Boolean),
                );
                setAddedIds(libraryIds);
                saveAddedIds(libraryIds);
            } catch (err) {
                console.error("Failed to load user library for checking", err);
            }
        };

        init();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build cumulative exclusion list
            const history = loadExcludedNames();
            const currentNames = suggestions.map((s) => s.name);
            const allExcluded = [...new Set([...history, ...currentNames])];

            const data = await getNextGameSuggestions(allExcluded);
            setSuggestions(data.suggestions);
            saveSuggestions(data.suggestions);

            // Append new names to history
            const newNames = data.suggestions.map((s: Suggestion) => s.name);
            saveExcludedNames([...new Set([...allExcluded, ...newNames])]);

            setHasGenerated(true);
            // We do NOT clear addedIds here anymore since we rely on actual library data
        } catch (err) {
            console.error("AI suggestions error:", err);
            if (err instanceof Error && err.message.includes("401")) {
                router.push("/login");
                return;
            }
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to get suggestions",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddToPlan = async (game: Suggestion) => {
        if (!game.rawgId) return;

        setAddingIds((prev) => new Set(prev).add(game.rawgId!));

        try {
            await createGameLog({
                rawgId: game.rawgId,
                gameName: game.name,
                gameSlug: game.slug || undefined,
                gameImage: game.image || undefined,
                gameReleased: game.released || undefined,
                gameMetacritic: game.metacritic || undefined,
                gameGenres:
                    game.genres.length > 0
                        ? JSON.stringify(game.genres)
                        : undefined,
                gamePlatforms:
                    game.platforms.length > 0
                        ? JSON.stringify(game.platforms)
                        : undefined,
                status: "PLAN_TO_PLAY",
            });

            setAddedIds((prev) => {
                const next = new Set(prev).add(game.rawgId!);
                saveAddedIds(next);
                return next;
            });
            toast.success(`${game.name} added to Plan to Play!`);
        } catch (err) {
            console.error("Failed to add game:", err);
            toast.error(
                err instanceof Error ? err.message : "Failed to add game",
            );
        } finally {
            setAddingIds((prev) => {
                const next = new Set(prev);
                next.delete(game.rawgId!);
                return next;
            });
        }
    };

    const handleResetHistory = () => {
        clearHistory();
        setSuggestions([]);
        setHasGenerated(false);
        toast.success("Recommendation history cleared!");
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Next Game
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            AI-powered recommendations based on your completed
                            games.
                        </p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center sm:justify-end gap-2 text-accent animate-pulse w-full sm:w-auto py-2">
                            <Sparkles className="size-5 shrink-0" />
                            <span className="text-sm font-medium mt-0.5">
                                Analyzing your gaming taste...
                            </span>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {hasGenerated && (
                                <Button
                                    onClick={handleResetHistory}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                >
                                    Reset History
                                </Button>
                            )}
                            <Button
                                onClick={handleGenerate}
                                variant="default"
                                className="space-x-2 min-w-0 flex-1 sm:flex-none"
                                disabled={loading}
                            >
                                {hasGenerated ? (
                                    <RefreshCw className="size-4 shrink-0" />
                                ) : (
                                    <Sparkles className="size-4 shrink-0" />
                                )}
                                <span>
                                    {hasGenerated
                                        ? "Suggest Again"
                                        : "Get Suggestions"}
                                </span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Loading State Skeletons */}
                {loading && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-0">
                                    <Skeleton className="h-44 rounded-t-xl rounded-b-none" />
                                    <Skeleton className="h-28 rounded-b-xl rounded-t-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm mb-4">{error}</p>
                        <Button
                            onClick={handleGenerate}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="size-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Suggestions Grid */}
                {!loading && !error && suggestions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {suggestions.map((game, index) => {
                            const isAdding = game.rawgId
                                ? addingIds.has(game.rawgId)
                                : false;
                            const isAdded = game.rawgId
                                ? addedIds.has(game.rawgId)
                                : false;

                            return (
                                <SuggestionCard
                                    key={`${game.name}-${index}`}
                                    game={game}
                                    isAdding={isAdding}
                                    isAdded={isAdded}
                                    onAdd={handleAddToPlan}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Empty state - first visit */}
                {!loading && !error && !hasGenerated && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">
                            Ready to discover
                        </p>
                        <p className="text-sm">
                            Click the button above to get personalized
                            suggestions based on your completed games.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
