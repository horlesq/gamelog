import { Button } from "@/components/ui/button";
import { Gamepad2, Plus } from "lucide-react";

interface EmptyStateProps {
    search: string;
    statusFilter: string;
    onAddGame: () => void;
}

export default function EmptyState({
    search,
    statusFilter,
    onAddGame,
}: EmptyStateProps) {
    return (
        <div className="text-center py-16">
            <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">
                {search || statusFilter !== "all"
                    ? "No games found"
                    : "Your library is empty"}
            </h3>
            <p className="text-muted-foreground mb-6">
                {search || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Start by adding games you've played or want to play"}
            </p>
            {!search && statusFilter === "all" && (
                <Button
                    onClick={onAddGame}
                    variant="default"
                    className="space-x-2"
                >
                    <Plus className="size-4" />
                    Add Your First Game
                </Button>
            )}
        </div>
    );
}
