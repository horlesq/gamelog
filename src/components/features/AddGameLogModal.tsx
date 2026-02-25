"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Search, Gamepad2, Star, ArrowLeft, Loader2 } from "lucide-react";
import {
    searchGames,
    createGameLog,
    updateGameLog,
} from "@/lib/client/game-logs";
import { GameLog, GameStatus } from "@/types/game";
import Image from "next/image";

interface GameSearchResult {
    id: number;
    name: string;
    slug: string;
    backgroundImage: string | null;
    released: string | null;
    metacritic: number | null;
    rating: number;
    genres: string[];
    platforms: string[];
}

interface AddGameLogModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGameLogSaved: () => void;
    editData?: GameLog | null;
}

const STATUS_OPTIONS: { value: GameStatus; label: string; image: string }[] = [
    { value: "PLAN_TO_PLAY", label: "Plan to Play", image: "/3d/file.png" },
    { value: "PLAYING", label: "Playing", image: "/3d/puzzle.png" },
    { value: "COMPLETED", label: "Completed", image: "/3d/crown.png" },
];

const MAIN_PLATFORMS = ["PC", "Xbox", "PlayStation", "Nintendo", "Mobile"];

const getValidPlatforms = (platforms: string[]): string[] => {
    if (!platforms || platforms.length === 0) return MAIN_PLATFORMS;

    const valid = new Set<string>();

    platforms.forEach((p) => {
        const lower = p.toLowerCase();
        if (
            lower.includes("pc") ||
            lower.includes("mac") ||
            lower.includes("linux") ||
            lower.includes("web")
        )
            valid.add("PC");
        if (
            lower.includes("playstation") ||
            lower.includes("ps") ||
            lower.includes("vita")
        )
            valid.add("PlayStation");
        if (lower.includes("xbox")) valid.add("Xbox");
        if (
            lower.includes("nintendo") ||
            lower.includes("wii") ||
            lower.includes("switch") ||
            lower.includes("ds") ||
            lower.includes("game boy") ||
            lower.includes("gamecube") ||
            lower.includes("nes") ||
            lower.includes("snes")
        )
            valid.add("Nintendo");
        if (
            lower.includes("ios") ||
            lower.includes("android") ||
            lower.includes("mobile")
        )
            valid.add("Mobile");
    });

    // If we found matches, return them sorted according to our main list order
    if (valid.size > 0) {
        return MAIN_PLATFORMS.filter((p) => valid.has(p));
    }

    // Fallback: if we couldn't map any platforms (e.g. obscure retro console), show all options
    return MAIN_PLATFORMS;
};

export default function AddGameLogModal({
    open,
    onOpenChange,
    onGameLogSaved,
    editData,
}: AddGameLogModalProps) {
    const [step, setStep] = useState<"search" | "details">(
        editData ? "details" : "search",
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(
        null,
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Form state
    const [status, setStatus] = useState<GameStatus>("PLAN_TO_PLAY");
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [rating, setRating] = useState<number>(0);
    const [hoursPlayed, setHoursPlayed] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (editData) {
            setStep("details");
            setStatus(editData.status);
            try {
                const parsedPlatforms = editData.platforms
                    ? JSON.parse(editData.platforms)
                    : [];
                setPlatforms(
                    Array.isArray(parsedPlatforms) ? parsedPlatforms : [],
                );
            } catch {
                setPlatforms([]);
            }
            setRating(editData.rating || 0);
            setHoursPlayed(editData.hoursPlayed?.toString() || "");
            setNotes(editData.notes || "");
            setSelectedGame({
                id: editData.game.rawgId,
                name: editData.game.name,
                slug: editData.game.slug || "",
                backgroundImage: editData.game.backgroundImage || null,
                released: editData.game.released || null,
                metacritic: editData.game.metacritic || null,
                rating: 0,
                genres: editData.game.genres
                    ? JSON.parse(editData.game.genres)
                    : [],
                platforms: editData.game.platforms
                    ? JSON.parse(editData.game.platforms)
                    : [],
            });
        } else {
            resetForm();
        }
    }, [editData, open]);

    const resetForm = () => {
        setStep("search");
        setSearchQuery("");
        setSearchResults([]);
        setSelectedGame(null);
        setStatus("PLAN_TO_PLAY");
        setPlatforms([]);
        setRating(0);
        setHoursPlayed("");
        setNotes("");
        setError("");
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await searchGames(query);
                setSearchResults(data.results || []);
            } catch {
                console.error("Search failed");
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const handleSelectGame = (game: GameSearchResult) => {
        setSelectedGame(game);
        setStep("details");
    };

    const handleSave = async () => {
        if (!selectedGame && !editData) return;

        setSaving(true);
        setError("");

        try {
            if (editData) {
                await updateGameLog(editData.id, {
                    status,
                    platforms:
                        platforms.length > 0
                            ? JSON.stringify(platforms)
                            : undefined,
                    rating: rating > 0 ? rating : undefined,
                    hoursPlayed: hoursPlayed
                        ? parseFloat(hoursPlayed)
                        : undefined,
                    notes: notes || undefined,
                });
            } else if (selectedGame) {
                await createGameLog({
                    rawgId: selectedGame.id,
                    gameName: selectedGame.name,
                    gameSlug: selectedGame.slug,
                    gameImage: selectedGame.backgroundImage || undefined,
                    gameReleased: selectedGame.released || undefined,
                    gameMetacritic: selectedGame.metacritic || undefined,
                    gameGenres: JSON.stringify(selectedGame.genres),
                    gamePlatforms: JSON.stringify(selectedGame.platforms),
                    status,
                    platforms:
                        platforms.length > 0
                            ? JSON.stringify(platforms)
                            : undefined,
                    rating: rating > 0 ? rating : undefined,
                    hoursPlayed: hoursPlayed
                        ? parseFloat(hoursPlayed)
                        : undefined,
                    notes: notes || undefined,
                });
            }

            resetForm();
            onOpenChange(false);
            onGameLogSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto border-2 border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image
                            src="/3d/play.png"
                            width={24}
                            height={24}
                            alt="Game"
                            className="h-8 w-8 object-contain"
                        />
                        {editData
                            ? "Edit Game Log"
                            : step === "search"
                              ? "Add a Game"
                              : "Game Details"}
                    </DialogTitle>
                </DialogHeader>

                {/* Search Step */}
                {step === "search" && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for a game..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                        </div>

                        {searching && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                            </div>
                        )}

                        {!searching && searchResults.length > 0 && (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {searchResults.map((game) => (
                                    <button
                                        key={game.id}
                                        onClick={() => handleSelectGame(game)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all cursor-pointer text-left"
                                    >
                                        {game.backgroundImage ? (
                                            <img
                                                src={game.backgroundImage}
                                                alt={game.name}
                                                className="w-16 h-12 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                                                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {game.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {game.released && (
                                                    <span>
                                                        {
                                                            game.released.split(
                                                                "-",
                                                            )[0]
                                                        }
                                                    </span>
                                                )}
                                                {game.genres.length > 0 && (
                                                    <span>
                                                        •{" "}
                                                        {game.genres
                                                            .slice(0, 2)
                                                            .join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {game.metacritic && (
                                            <span
                                                className={`text-xs font-bold px-2 py-1 rounded ${
                                                    game.metacritic >= 75
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        : game.metacritic >= 50
                                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                }`}
                                            >
                                                {game.metacritic}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!searching &&
                            searchQuery.length >= 2 &&
                            searchResults.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>
                                        No games found for &ldquo;{searchQuery}
                                        &rdquo;
                                    </p>
                                </div>
                            )}

                        {!searching && searchQuery.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Type to search for a game</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Details Step */}
                {step === "details" && selectedGame && (
                    <div className="space-y-4">
                        {!editData && (
                            <button
                                onClick={() => setStep("search")}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to search
                            </button>
                        )}

                        {/* Selected game info */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/20">
                            {selectedGame.backgroundImage ? (
                                <img
                                    src={selectedGame.backgroundImage}
                                    alt={selectedGame.name}
                                    className="w-20 h-14 object-cover rounded"
                                />
                            ) : (
                                <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                                    <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold">
                                    {selectedGame.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedGame.released &&
                                        selectedGame.released.split("-")[0]}
                                    {selectedGame.genres.length > 0 &&
                                        ` • ${selectedGame.genres.slice(0, 3).join(", ")}`}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer border ${
                                            status === opt.value
                                                ? "bg-primary/20 border-primary/30"
                                                : "hover:bg-accent/20 hover:text-accent border-border"
                                        }`}
                                    >
                                        <Image
                                            src={opt.image}
                                            width={20}
                                            height={20}
                                            alt={opt.label}
                                            className="h-5 w-5 object-contain"
                                        />
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Platform */}
                        <div className="space-y-2">
                            <Label>Platform Played On</Label>
                            <div className="flex flex-wrap gap-2">
                                {getValidPlatforms(selectedGame.platforms).map(
                                    (p) => {
                                        const isSelected =
                                            platforms.includes(p);
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    setPlatforms((prev) =>
                                                        isSelected
                                                            ? prev.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      p,
                                                              )
                                                            : [...prev, p],
                                                    );
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? "bg-primary/20 border-primary/30"
                                                        : "bg-background hover:bg-accent/20 hover:text-accent border-border"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="space-y-2">
                            <Label>Rating (1-10)</Label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() =>
                                            setRating(rating === n ? 0 : n)
                                        }
                                        className="cursor-pointer transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${
                                                n <= rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground/30"
                                            }`}
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                                        {rating}/10
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Hours Played */}
                        <div className="space-y-2">
                            <Label htmlFor="hoursPlayed">Hours Played</Label>
                            <Input
                                id="hoursPlayed"
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0"
                                value={hoursPlayed}
                                onChange={(e) => setHoursPlayed(e.target.value)}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Your thoughts about the game..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-secondary hover:bg-primary text-secondary-foreground"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                        Saving...
                                    </>
                                ) : editData ? (
                                    "Update"
                                ) : (
                                    "Add to Library"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
