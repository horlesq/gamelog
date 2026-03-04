"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { GameLog, Stats, CustomFilter } from "@/types/game";
import { getGameLogs, deleteGameLog } from "@/lib/client/game-logs";
import { getCustomFilters } from "@/lib/client/custom-filters";
import toast from "react-hot-toast";
import { parseStringArray } from "@/lib/utils";

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
    const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
    const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
    const router = useRouter();
    const navbarRef = useRef<NavbarRef>(null);

    useEffect(() => {
        fetchGameLogs();
        fetchCustomFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    const fetchCustomFilters = async () => {
        try {
            const data = await getCustomFilters();
            setCustomFilters(data.filters);
        } catch (error) {
            console.error("Error fetching custom filters:", error);
        }
    };

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

    // Apply custom filter conditions
    const activeFilter = customFilters.find((f) => f.id === activeFilterId);

    const filteredGameLogs = activeFilter
        ? sortedGameLogs.filter((log) => {
              const c = activeFilter.conditions;

              if (c.status && log.status !== c.status) return false;

              if (c.genres && c.genres.length > 0) {
                  const gameGenres = parseStringArray(log.game.genres || "");
                  if (!c.genres.some((g) => gameGenres.includes(g)))
                      return false;
              }

              if (c.platforms && c.platforms.length > 0) {
                  const gamePlatforms = parseStringArray(
                      log.game.platforms || "",
                  );
                  if (!c.platforms.some((p) => gamePlatforms.includes(p)))
                      return false;
              }

              if (
                  c.ratingMin !== undefined &&
                  (log.rating === undefined ||
                      log.rating === null ||
                      log.rating < c.ratingMin)
              )
                  return false;
              if (
                  c.ratingMax !== undefined &&
                  (log.rating === undefined ||
                      log.rating === null ||
                      log.rating > c.ratingMax)
              )
                  return false;

              if (
                  c.hoursMin !== undefined &&
                  (log.hoursPlayed === undefined ||
                      log.hoursPlayed === null ||
                      log.hoursPlayed < c.hoursMin)
              )
                  return false;
              if (
                  c.hoursMax !== undefined &&
                  (log.hoursPlayed === undefined ||
                      log.hoursPlayed === null ||
                      log.hoursPlayed > c.hoursMax)
              )
                  return false;

              return true;
          })
        : sortedGameLogs;

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
                    customFilters={customFilters}
                    activeFilterId={activeFilterId}
                    setActiveFilterId={setActiveFilterId}
                />

                {/* Game Content */}
                {filteredGameLogs.length === 0 ? (
                    <EmptyState
                        search={search}
                        statusFilter={statusFilter}
                        onAddGame={handleAddClick}
                    />
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredGameLogs.map((gameLog) => (
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
                        gameLogs={filteredGameLogs}
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
