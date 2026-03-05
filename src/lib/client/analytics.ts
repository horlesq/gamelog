export async function getAnalytics() {
    const response = await fetch("/api/analytics");

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Authentication required - 401");
        }
        throw new Error("Failed to fetch analytics");
    }

    return response.json();
}
