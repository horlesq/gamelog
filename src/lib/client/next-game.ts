import { Suggestion } from "@/components/features/SuggestionCard";

export async function getNextGameSuggestions(excludeNames: string[] = []) {
    const response = await fetch("/api/next-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeNames }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Authentication required - 401");
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to get AI suggestions");
    }

    return response.json();
}

const STORAGE_KEY = "gamelog-next-game-suggestions";
const HISTORY_KEY = "gamelog-next-game-suggestions-history";
const ADDED_IDS_KEY = "gamelog-next-game-added-ids";

export function loadSuggestions(): Suggestion[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch {}
    return [];
}

export function saveSuggestions(suggestions: Suggestion[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
    } catch {}
}

export function loadExcludedNames(): string[] {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) return JSON.parse(stored);
    } catch {}
    return [];
}

export function saveExcludedNames(names: string[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(names));
    } catch {}
}

export function loadAddedIds(): Set<number> {
    try {
        const stored = localStorage.getItem(ADDED_IDS_KEY);
        if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
}

export function saveAddedIds(ids: Set<number>) {
    try {
        localStorage.setItem(ADDED_IDS_KEY, JSON.stringify(Array.from(ids)));
    } catch {}
}
