import { FilterConditions } from "@/types";

export async function getCustomFilters() {
    const response = await fetch("/api/custom-filters");

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Authentication required - 401");
        }
        throw new Error("Failed to fetch custom filters");
    }

    return response.json();
}

export async function createCustomFilter(data: {
    name: string;
    icon?: string;
    color?: string;
    conditions: FilterConditions;
}) {
    const response = await fetch("/api/custom-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create custom filter");
    }

    return response.json();
}

export async function updateCustomFilter(
    id: string,
    data: {
        name?: string;
        icon?: string;
        color?: string;
        conditions?: FilterConditions;
    },
) {
    const response = await fetch(`/api/custom-filters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update custom filter");
    }

    return response.json();
}

export async function deleteCustomFilter(id: string) {
    const response = await fetch(`/api/custom-filters/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete custom filter");
    }

    return response.json();
}
