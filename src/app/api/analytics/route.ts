import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db";
import { parseStringArray } from "@/lib/utils";

export async function GET() {
    try {
        const user = await requireAuth();

        const gameLogs = await prisma.gameLog.findMany({
            where: { userId: user.userId },
            include: { game: true },
        });

        // --- Status Breakdown ---
        const statusBreakdown = [
            {
                name: "Plan to Play",
                value: gameLogs.filter((l) => l.status === "PLAN_TO_PLAY")
                    .length,
                color: "var(--chart-5)",
            },
            {
                name: "Playing",
                value: gameLogs.filter((l) => l.status === "PLAYING").length,
                color: "var(--chart-2)",
            },
            {
                name: "Completed",
                value: gameLogs.filter((l) => l.status === "COMPLETED").length,
                color: "var(--chart-1)",
            },
        ];

        // --- Genre Distribution ---
        const genreCounts: Record<string, number> = {};
        gameLogs.forEach((log) => {
            if (log.game.genres) {
                const genres = parseStringArray(log.game.genres);
                genres.forEach((g) => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            }
        });
        const genreDistribution = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));

        // --- Platform Distribution ---
        const platformCounts: Record<string, number> = {};
        gameLogs.forEach((log) => {
            if (log.platforms) {
                const platforms = parseStringArray(log.platforms);
                platforms.forEach((p) => {
                    platformCounts[p] = (platformCounts[p] || 0) + 1;
                });
            }
        });
        const platformDistribution = Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));

        // --- Rating Distribution ---
        const ratingBuckets: Record<number, number> = {};
        for (let i = 1; i <= 10; i++) ratingBuckets[i] = 0;
        const ratedLogs = gameLogs.filter(
            (l) => l.rating !== null && l.rating !== undefined,
        );
        ratedLogs.forEach((log) => {
            if (log.rating) ratingBuckets[log.rating]++;
        });
        const ratingDistribution = Object.entries(ratingBuckets).map(
            ([rating, count]) => ({
                name: `${rating}`,
                value: count,
            }),
        );

        // --- Average Rating ---
        const avgRating =
            ratedLogs.length > 0
                ? Math.round(
                      (ratedLogs.reduce((sum, l) => sum + (l.rating || 0), 0) /
                          ratedLogs.length) *
                          10,
                  ) / 10
                : 0;

        // --- Hours ---
        const logsWithHours = gameLogs.filter(
            (l) =>
                l.hoursPlayed !== null &&
                l.hoursPlayed !== undefined &&
                l.hoursPlayed > 0,
        );
        const totalHours = logsWithHours.reduce(
            (sum, l) => sum + (l.hoursPlayed || 0),
            0,
        );
        const avgHoursPerGame =
            logsWithHours.length > 0
                ? Math.round((totalHours / logsWithHours.length) * 10) / 10
                : 0;

        // --- Completion Rate ---
        const completedCount = gameLogs.filter(
            (l) => l.status === "COMPLETED",
        ).length;
        const completionRate =
            gameLogs.length > 0
                ? Math.round((completedCount / gameLogs.length) * 100)
                : 0;

        // --- Top Rated Games ---
        const topRatedGames = gameLogs
            .filter((l) => l.rating !== null && l.rating !== undefined)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5)
            .map((l) => ({
                name: l.game.name,
                rating: l.rating,
                image: l.game.backgroundImage,
            }));

        // --- Release Year Distribution ---
        const yearCounts: Record<string, number> = {};
        gameLogs.forEach((log) => {
            if (log.game.released) {
                const year = log.game.released.split("-")[0];
                if (year) {
                    yearCounts[year] = (yearCounts[year] || 0) + 1;
                }
            }
        });
        const releaseYearDistribution = Object.entries(yearCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, value]) => ({ name, value }));

        // --- Developer Distribution ---
        const devCounts: Record<string, number> = {};
        gameLogs.forEach((log) => {
            if (log.game.developers) {
                const devs = parseStringArray(log.game.developers);
                devs.forEach((d) => {
                    devCounts[d] = (devCounts[d] || 0) + 1;
                });
            }
        });
        const developerDistribution = Object.entries(devCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            summary: {
                totalGames: gameLogs.length,
                totalHours: Math.round(totalHours * 10) / 10,
                avgRating,
                avgHoursPerGame,
                completionRate,
            },
            statusBreakdown,
            genreDistribution,
            platformDistribution,
            ratingDistribution,
            releaseYearDistribution,
            developerDistribution,
            topRatedGames,
        });
    } catch (error) {
        console.error("Analytics error:", error);

        if (
            error instanceof Error &&
            error.message === "Authentication required"
        ) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
