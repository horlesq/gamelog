"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StatsOverview from "@/components/features/StatsOverview";
import DashboardControls from "@/components/features/DashboardControls";
import EmptyState from "@/components/features/EmptyState";
import { SortOption } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar, { NavbarRef } from "@/components/layout/Navbar";
import GameCard from "@/components/features/GameCard";
import GameList from "@/components/features/GameList";
import AddGameLogModal from "@/components/features/AddGameLogModal";
import { GameLog, Stats } from "@/types/game";
import { getGameLogs, deleteGameLog } from "@/lib/client/game-logs";
import toast from "react-hot-toast";

export default function DashboardPage() {
    const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        planToPlay: 0,
        playing: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<SortOption>("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<GameLog | null>(null);
    const router = useRouter();
    const navbarRef = useRef<NavbarRef>(null);

    useEffect(() => {
        fetchGameLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    const fetchGameLogs = async () => {
        try {
            const data = await getGameLogs(
                search,
                statusFilter !== "all" ? statusFilter : undefined,
            );
            setGameLogs(data.gameLogs);
            setStats(data.stats);
        } catch (error) {
            console.error("Error fetching game logs:", error);
            if (error instanceof Error && error.message.includes("401")) {
                router.push("/login");
                return;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGameLogSaved = () => {
        fetchGameLogs();
        setEditingLog(null);
    };

    const handleEdit = (gameLog: GameLog) => {
        setEditingLog(gameLog);
        setAddModalOpen(true);
    };

    const handleDelete = async (gameLogId: string) => {
        if (!confirm("Remove this game from your library?")) return;

        try {
            await deleteGameLog(gameLogId);
            toast.success("Game removed from library");
            fetchGameLogs();
        } catch (error) {
            console.error("Error deleting game log:", error);
            toast.error("Failed to remove game");
        }
    };

    const handleAddClick = () => {
        setEditingLog(null);
        setAddModalOpen(true);
    };

    const sortedGameLogs = [...gameLogs].sort((a, b) => {
        const modifier = sortDirection === "asc" ? 1 : -1;
        switch (sortBy) {
            case "name":
                return modifier * a.game.name.localeCompare(b.game.name);
            case "release":
                return (
                    modifier *
                    (new Date(a.game.released || 0).getTime() -
                        new Date(b.game.released || 0).getTime())
                );
            case "rating":
                return modifier * ((a.rating || 0) - (b.rating || 0));
            case "time":
                return modifier * ((a.hoursPlayed || 0) - (b.hoursPlayed || 0));
            case "date":
            default:
                return (
                    modifier *
                    (new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime())
                );
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar ref={navbarRef} onAddGame={handleAddClick} />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Skeleton Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-20 sm:h-24 rounded-2xl"
                            />
                        ))}
                    </div>

                    {/* Skeleton Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                    </div>

                    {/* Skeleton Game Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-72 rounded-2xl" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar ref={navbarRef} onAddGame={handleAddClick} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <StatsOverview
                    stats={stats}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                />

                <DashboardControls
                    search={search}
                    setSearch={setSearch}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                {/* Game Content */}
                {sortedGameLogs.length === 0 ? (
                    <EmptyState
                        search={search}
                        statusFilter={statusFilter}
                        onAddGame={handleAddClick}
                    />
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {sortedGameLogs.map((gameLog) => (
                            <GameCard
                                key={gameLog.id}
                                gameLog={gameLog}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <GameList
                        gameLogs={sortedGameLogs}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </main>

            <AddGameLogModal
                open={addModalOpen}
                onOpenChange={(open) => {
                    setAddModalOpen(open);
                    if (!open) setEditingLog(null);
                }}
                onGameLogSaved={handleGameLogSaved}
                editData={editingLog}
            />
        </div>
    );
}
