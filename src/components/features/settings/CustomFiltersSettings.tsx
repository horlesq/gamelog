"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Trash2,
    Pencil,
    X,
    Check,
    Filter,
    Gamepad2,
    Star,
    Clock,
    Tag,
    Monitor,
} from "lucide-react";
import { CustomFilter, FilterConditions, GameLog } from "@/types";
import {
    getCustomFilters,
    createCustomFilter,
    updateCustomFilter,
    deleteCustomFilter,
} from "@/lib/client/custom-filters";
import { getGameLogs } from "@/lib/client/game-logs";
import toast from "react-hot-toast";
import { parseStringArray } from "@/lib/utils";

const FILTER_COLORS = [
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "pink", label: "Pink", class: "bg-pink-500" },
    { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
];

const STATUS_OPTIONS = [
    { value: "", label: "Any Status" },
    { value: "PLAN_TO_PLAY", label: "Plan to Play" },
    { value: "PLAYING", label: "Playing" },
    { value: "COMPLETED", label: "Completed" },
];

function getColorClass(color: string) {
    return (
        FILTER_COLORS.find((c) => c.value === color)?.class || "bg-purple-500"
    );
}

export default function CustomFiltersSettings() {
    const [filters, setFilters] = useState<CustomFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [color, setColor] = useState("purple");
    const [conditions, setConditions] = useState<FilterConditions>({});

    // Available options from library
    const [availableGenres, setAvailableGenres] = useState<string[]>([]);
    const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

    const fetchFilters = useCallback(async () => {
        try {
            const data = await getCustomFilters();
            setFilters(data.filters);
        } catch (error) {
            console.error("Failed to fetch filters:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLibraryData = useCallback(async () => {
        try {
            const data = await getGameLogs();
            const genres = new Set<string>();
            const platforms = new Set<string>();

            data.gameLogs.forEach((log: GameLog) => {
                if (log.game.genres) {
                    parseStringArray(log.game.genres).forEach((g) =>
                        genres.add(g),
                    );
                }
                if (log.game.platforms) {
                    parseStringArray(log.game.platforms).forEach((p) =>
                        platforms.add(p),
                    );
                }
            });

            setAvailableGenres(Array.from(genres).sort());
            setAvailablePlatforms(Array.from(platforms).sort());
        } catch (error) {
            console.error("Failed to fetch library data:", error);
        }
    }, []);

    useEffect(() => {
        fetchFilters();
        fetchLibraryData();
    }, [fetchFilters, fetchLibraryData]);

    const resetForm = () => {
        setName("");
        setColor("purple");
        setConditions({});
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (filter: CustomFilter) => {
        setName(filter.name);
        setColor(filter.color);
        setConditions({ ...filter.conditions });
        setEditingId(filter.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Filter name is required");
            return;
        }

        const hasConditions =
            conditions.status ||
            (conditions.genres && conditions.genres.length > 0) ||
            (conditions.platforms && conditions.platforms.length > 0) ||
            conditions.ratingMin !== undefined ||
            conditions.ratingMax !== undefined ||
            conditions.hoursMin !== undefined ||
            conditions.hoursMax !== undefined;

        if (!hasConditions) {
            toast.error("Add at least one filter condition");
            return;
        }

        // Clean empty arrays
        const cleanConditions = { ...conditions };
        if (cleanConditions.genres?.length === 0) delete cleanConditions.genres;
        if (cleanConditions.platforms?.length === 0)
            delete cleanConditions.platforms;

        try {
            if (editingId) {
                await updateCustomFilter(editingId, {
                    name: name.trim(),
                    color,
                    conditions: cleanConditions,
                });
                toast.success("Filter updated");
            } else {
                await createCustomFilter({
                    name: name.trim(),
                    color,
                    conditions: cleanConditions,
                });
                toast.success("Filter created");
            }
            resetForm();
            fetchFilters();
        } catch (error) {
            console.error("Save filter error:", error);
            toast.error("Failed to save filter");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this custom filter?")) return;

        try {
            await deleteCustomFilter(id);
            toast.success("Filter deleted");
            fetchFilters();
        } catch (error) {
            console.error("Delete filter error:", error);
            toast.error("Failed to delete filter");
        }
    };

    const toggleGenre = (genre: string) => {
        const current = conditions.genres || [];
        if (current.includes(genre)) {
            setConditions({
                ...conditions,
                genres: current.filter((g) => g !== genre),
            });
        } else {
            setConditions({ ...conditions, genres: [...current, genre] });
        }
    };

    const togglePlatform = (platform: string) => {
        const current = conditions.platforms || [];
        if (current.includes(platform)) {
            setConditions({
                ...conditions,
                platforms: current.filter((p) => p !== platform),
            });
        } else {
            setConditions({
                ...conditions,
                platforms: [...current, platform],
            });
        }
    };

    const getConditionSummary = (conditions: FilterConditions): string => {
        const parts: string[] = [];
        if (conditions.status) {
            parts.push(
                STATUS_OPTIONS.find((s) => s.value === conditions.status)
                    ?.label || conditions.status,
            );
        }
        if (conditions.genres?.length) {
            parts.push(
                `${conditions.genres.length} genre${conditions.genres.length > 1 ? "s" : ""}`,
            );
        }
        if (conditions.platforms?.length) {
            parts.push(
                `${conditions.platforms.length} platform${conditions.platforms.length > 1 ? "s" : ""}`,
            );
        }
        if (
            conditions.ratingMin !== undefined ||
            conditions.ratingMax !== undefined
        ) {
            parts.push(
                `Rating ${conditions.ratingMin || 0}–${conditions.ratingMax || 10}`,
            );
        }
        if (
            conditions.hoursMin !== undefined ||
            conditions.hoursMax !== undefined
        ) {
            parts.push(
                `${conditions.hoursMin || 0}–${conditions.hoursMax || "∞"}h`,
            );
        }
        return parts.join(" · ");
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6">
                <p className="text-muted-foreground">Loading filters...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Custom Filters
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Create reusable filters for your game library.
                    </p>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="flex items-center space-x-2 w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Filter</span>
                    </Button>
                )}
            </div>

            {/* Existing Filters */}
            {!showForm && (
                <div className="rounded-xl bg-card p-6">
                    {/* Filter List */}
                    {filters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Filter className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No custom filters yet.</p>
                            <p className="text-xs mt-1">
                                Create one to quickly filter your library.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filters.map((filter) => (
                                <div
                                    key={filter.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-3 h-3 rounded-full ${getColorClass(filter.color)}`}
                                        />
                                        <div>
                                            <p className="font-medium text-sm text-foreground">
                                                {filter.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {getConditionSummary(
                                                    filter.conditions,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(filter)}
                                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(filter.id)
                                            }
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <div className="rounded-2xl border border-primary/20 bg-card/40 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                            {editingId ? "Edit Filter" : "Create Filter"}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Name & Color */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Filter Name
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. RPGs I haven't finished"
                            className="max-w-sm"
                        />
                        <div className="flex gap-2">
                            {FILTER_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setColor(c.value)}
                                    className={`w-6 h-6 rounded-full ${c.class} transition-all ${
                                        color === c.value
                                            ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110"
                                            : "opacity-50 hover:opacity-80"
                                    }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        setConditions({
                                            ...conditions,
                                            status: opt.value
                                                ? (opt.value as FilterConditions["status"])
                                                : undefined,
                                        })
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                        (conditions.status || "") === opt.value
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genres */}
                    {availableGenres.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                Genres{" "}
                                {conditions.genres &&
                                    conditions.genres.length > 0 && (
                                        <span className="text-xs text-primary">
                                            ({conditions.genres.length}{" "}
                                            selected)
                                        </span>
                                    )}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableGenres.map((genre) => (
                                    <button
                                        key={genre}
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                            conditions.genres?.includes(genre)
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platforms */}
                    {availablePlatforms.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                Platforms{" "}
                                {conditions.platforms &&
                                    conditions.platforms.length > 0 && (
                                        <span className="text-xs text-primary">
                                            ({conditions.platforms.length}{" "}
                                            selected)
                                        </span>
                                    )}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availablePlatforms.map((platform) => (
                                    <button
                                        key={platform}
                                        onClick={() => togglePlatform(platform)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                            conditions.platforms?.includes(
                                                platform,
                                            )
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                                        }`}
                                    >
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rating Range */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            Rating Range
                        </label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={0}
                                max={10}
                                placeholder="Min"
                                value={conditions.ratingMin ?? ""}
                                onChange={(e) =>
                                    setConditions({
                                        ...conditions,
                                        ratingMin: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-20"
                            />
                            <span className="text-muted-foreground text-sm">
                                to
                            </span>
                            <Input
                                type="number"
                                min={0}
                                max={10}
                                placeholder="Max"
                                value={conditions.ratingMax ?? ""}
                                onChange={(e) =>
                                    setConditions({
                                        ...conditions,
                                        ratingMax: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-20"
                            />
                        </div>
                    </div>

                    {/* Hours Range */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Hours Played Range
                        </label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={0}
                                placeholder="Min"
                                value={conditions.hoursMin ?? ""}
                                onChange={(e) =>
                                    setConditions({
                                        ...conditions,
                                        hoursMin: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-20"
                            />
                            <span className="text-muted-foreground text-sm">
                                to
                            </span>
                            <Input
                                type="number"
                                min={0}
                                placeholder="Max"
                                value={conditions.hoursMax ?? ""}
                                onChange={(e) =>
                                    setConditions({
                                        ...conditions,
                                        hoursMax: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-20"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="gap-2"
                        >
                            <Check className="h-4 w-4" />
                            {editingId ? "Save Changes" : "Create Filter"}
                        </Button>
                        <Button
                            onClick={resetForm}
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
