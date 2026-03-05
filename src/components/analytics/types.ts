export interface AnalyticsData {
    summary: {
        totalGames: number;
        totalHours: number;
        avgRating: number;
        avgHoursPerGame: number;
        completionRate: number;
    };
    statusBreakdown: { name: string; value: number; color: string }[];
    genreDistribution: { name: string; value: number }[];
    platformDistribution: { name: string; value: number }[];
    ratingDistribution: { name: string; value: number }[];
    releaseYearDistribution: { name: string; value: number }[];
    developerDistribution: { name: string; value: number }[];
    topRatedGames: {
        name: string;
        rating: number;
        image: string | null;
    }[];
}

export const CHART_COLORS = [
    "oklch(0.55 0.28 290)", // chart-1 purple
    "oklch(0.78 0.18 70)", // chart-2 gold
    "oklch(0.35 0.12 320)", // chart-3 magenta-dark
    "oklch(0.65 0.25 340)", // chart-4 pink
    "oklch(0.6 0.2 250)", // chart-5 blue
    "oklch(0.7 0.2 160)", // teal
    "oklch(0.65 0.22 30)", // orange
    "oklch(0.5 0.2 290)", // deep purple
    "oklch(0.75 0.15 90)", // lime
    "oklch(0.6 0.25 0)", // red
];

export const PIE_COLORS = [
    "oklch(0.6 0.2 250)", // blue - Plan to Play
    "oklch(0.78 0.18 70)", // gold - Playing
    "oklch(0.55 0.28 290)", // purple - Completed
];
