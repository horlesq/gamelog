import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    LayoutGrid,
    List,
    ArrowUpDown,
    Check,
    ArrowUp,
    ArrowDown,
    Filter,
} from "lucide-react";
import { SORT_OPTIONS, SortOption } from "@/lib/constants";
import { CustomFilter } from "@/types";

interface DashboardControlsProps {
    search: string;
    setSearch: (search: string) => void;
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
    sortDirection: "asc" | "desc";
    setSortDirection: (direction: "asc" | "desc") => void;
    viewMode: "grid" | "list";
    setViewMode: (viewMode: "grid" | "list") => void;
    customFilters: CustomFilter[];
    activeFilterId: string | null;
    setActiveFilterId: (id: string | null) => void;
}

const FILTER_COLORS: Record<string, string> = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    yellow: "bg-yellow-500",
};

export default function DashboardControls({
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    viewMode,
    setViewMode,
    customFilters,
    activeFilterId,
    setActiveFilterId,
}: DashboardControlsProps) {
    const activeFilter = customFilters.find((f) => f.id === activeFilterId);
    const hasFilters = customFilters.length > 0;

    const SearchInput = (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                placeholder="Search your games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-14 rounded-xl border-none bg-card shadow-sm hover:ring-1 hover:ring-border focus-visible:ring-secondary transition-all"
            />
        </div>
    );

    const SortControls = (
        <div
            className={`flex bg-card p-1.5 rounded-xl shadow-sm h-14 items-center gap-1 ${hasFilters ? "w-full sm:w-auto flex-1 sm:flex-none" : "flex-1 sm:flex-none"}`}
        >
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`h-full px-6 gap-2 rounded-lg hover:bg-muted/50 transition-all text-muted-foreground hover:text-secondary-foreground data-[state=open]:text-secondary-foreground flex-1 sm:flex-none justify-start ${hasFilters ? "sm:w-[140px]" : ""}`}
                    >
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={`truncate`}>
                            {
                                SORT_OPTIONS.find((opt) => opt.value === sortBy)
                                    ?.label
                            }
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[200px] rounded-xl bg-muted border-none shadow-xl p-2"
                >
                    {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() =>
                                setSortBy(option.value as SortOption)
                            }
                            className="justify-between rounded-lg py-3 cursor-pointer"
                        >
                            {option.label}
                            {sortBy === option.value && (
                                <Check className="h-4 w-4 text-purple-500" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-8 bg-border/50 shrink-0" />

            <Button
                variant="ghost"
                onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
                className="h-full w-10 p-0 rounded-lg hover:bg-muted/50 transition-all text-muted-foreground hover:text-secondary-foreground shrink-0"
                title={`Sort ${sortDirection === "asc" ? "Ascending" : "Descending"}`}
            >
                {sortDirection === "asc" ? (
                    <ArrowUp className="h-4 w-4 shrink-0" />
                ) : (
                    <ArrowDown className="h-4 w-4 shrink-0" />
                )}
            </Button>
        </div>
    );

    const ViewModeControls = (
        <div className="flex bg-card p-1.5 rounded-xl shadow-sm h-14 items-center gap-1 shrink-0">
            <button
                onClick={() => setViewMode("grid")}
                className={`h-full aspect-square flex items-center justify-center rounded-lg transition-all ${
                    viewMode === "grid"
                        ? "bg-accent/10 text-accent shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Grid View"
            >
                <LayoutGrid className="h-5 w-5 shrink-0" />
            </button>
            <button
                onClick={() => setViewMode("list")}
                className={`h-full aspect-square flex items-center justify-center rounded-lg transition-all ${
                    viewMode === "list"
                        ? "bg-accent/10 text-accent shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="List View"
            >
                <List className="h-5 w-5 shrink-0" />
            </button>
        </div>
    );

    const FilterControls = hasFilters && (
        <div className="flex bg-card p-1.5 rounded-xl shadow-sm h-14 items-center gap-1 flex-1 sm:flex-none min-w-0 transition-all">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-full px-6 gap-2 rounded-lg hover:bg-muted/50 transition-all text-muted-foreground hover:text-secondary-foreground data-[state=open]:text-secondary-foreground flex-1 sm:flex-none justify-start min-w-0 sm:w-[140px]"
                    >
                        <Filter className="h-4 w-4 shrink-0" />
                        {activeFilter ? (
                            <span className="flex items-center gap-2 truncate min-w-0">
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${FILTER_COLORS[activeFilter.color] || "bg-purple-500"}`}
                                />
                                <span className="truncate">
                                    {activeFilter.name}
                                </span>
                            </span>
                        ) : (
                            <span className="truncate">Filters</span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[220px] rounded-xl bg-muted border-none shadow-xl p-2"
                >
                    {customFilters.map((filter) => (
                        <DropdownMenuItem
                            key={filter.id}
                            onClick={() =>
                                setActiveFilterId(
                                    activeFilterId === filter.id
                                        ? null
                                        : filter.id,
                                )
                            }
                            className="justify-between rounded-lg py-3 cursor-pointer"
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${FILTER_COLORS[filter.color] || "bg-purple-500"}`}
                                />
                                <span className="truncate">{filter.name}</span>
                            </span>
                            {activeFilterId === filter.id && (
                                <Check className="h-4 w-4 text-purple-500" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-2 mb-6">
            {hasFilters ? (
                <>
                    {/* Top Row on Mobile / Left Section on Desktop */}
                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                        {SearchInput}
                        <div className="block sm:hidden">{SortControls}</div>
                    </div>

                    {/* Bottom Row on Mobile / Right Section on Desktop */}
                    <div className="flex flex-row gap-2 w-full md:w-auto">
                        <div className="hidden sm:block">{SortControls}</div>
                        {FilterControls}
                        {ViewModeControls}
                    </div>
                </>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
                    {SearchInput}
                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                        {SortControls}
                        {ViewModeControls}
                    </div>
                </div>
            )}
        </div>
    );
}
