import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db";
import Papa from "papaparse";
import { GameStatus } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireAuth();

        const gameLogs = await prisma.gameLog.findMany({
            where: { userId: user.userId },
            include: { game: true },
            orderBy: { updatedAt: "desc" },
        });

        const csvData = gameLogs.map((log) => ({
            "Game Name": log.game.name,
            "Rawg ID": log.game.rawgId,
            Status: log.status,
            Rating: log.rating || "",
            "Hours Played": log.hoursPlayed || "",
            Platforms: log.platforms || "",
            Notes: log.notes || "",
            "Started At": log.startedAt ? log.startedAt.toISOString() : "",
            "Completed At": log.completedAt
                ? log.completedAt.toISOString()
                : "",
            "Date Added": log.createdAt.toISOString(),
            "Last Modified": log.updatedAt.toISOString(),
        }));

        const csvString = Papa.unparse(csvData);

        return new NextResponse(csvString, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition":
                    'attachment; filename="gamelog-export.csv"',
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
