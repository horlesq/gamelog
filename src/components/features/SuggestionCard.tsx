import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gamepad2, Loader2, Check, Plus, ExternalLink } from "lucide-react";

export interface Suggestion {
    name: string;
    reason: string;
    image: string | null;
    genres: string[];
    platforms: string[];
    metacritic: number | null;
    released: string | null;
    slug: string | null;
    rawgId: number | null;
}

interface SuggestionCardProps {
    game: Suggestion;
    isAdding: boolean;
    isAdded: boolean;
    onAdd: (game: Suggestion) => void;
}

export default function SuggestionCard({
    game,
    isAdding,
    isAdded,
    onAdd,
}: SuggestionCardProps) {
    return (
        <div className="group relative bg-card rounded-xl overflow-hidden border flex flex-col">
            {/* Cover Image */}
            <div className="relative w-full h-44 overflow-hidden">
                {game.image ? (
                    <img
                        src={game.image}
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

                {/* Metacritic badge */}
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

                {/* Game title on cover */}
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg line-clamp-2">
                        {game.name}
                    </h3>
                </div>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3 flex-1 flex flex-col">
                {/* Genres */}
                {game.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {game.genres.slice(0, 3).map((genre) => (
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {game.released && (
                            <span className="text-xs">
                                {game.released.split("-")[0]}
                            </span>
                        )}
                    </div>

                    {game.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {game.platforms.slice(0, 2).map((p) => (
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

                {/* AI Reason */}
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {game.reason}
                </p>

                {/* Action buttons */}
                <div className="mt-auto pt-1 flex gap-2">
                    {game.slug && (
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`https://rawg.io/games/${game.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="size-4" />
                            </a>
                        </Button>
                    )}
                    {game.rawgId && (
                        <Button
                            onClick={() => onAdd(game)}
                            disabled={isAdding || isAdded}
                            variant={isAdded ? "secondary" : "outline"}
                            size="sm"
                            className="flex-1"
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : isAdded ? (
                                <>
                                    <Check className="size-4 mr-2" />
                                    Added
                                </>
                            ) : (
                                <>
                                    <Plus className="size-4 mr-2" />
                                    Plan to Play
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
