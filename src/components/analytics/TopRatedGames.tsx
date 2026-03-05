import { Star, Gamepad2 } from "lucide-react";
import { ChartCard } from "./ChartCard";

interface TopRatedGamesProps {
    games: {
        name: string;
        rating: number;
        image: string | null;
    }[];
}

export default function TopRatedGames({ games }: TopRatedGamesProps) {
    if (games.length === 0) return null;

    return (
        <ChartCard title="Top Rated Games">
            <div className="space-y-3">
                {games.map((game, index) => (
                    <div
                        key={game.name}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                        <span className="text-lg font-bold text-muted-foreground/50 w-6 text-center">
                            {index + 1}
                        </span>
                        {game.image ? (
                            <img
                                src={game.image}
                                alt={game.name}
                                className="w-12 h-8 object-cover rounded"
                            />
                        ) : (
                            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {game.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm">
                                {game.rating}/10
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
