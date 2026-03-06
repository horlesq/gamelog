import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db";
import Papa from "papaparse";
import { GameStatus } from "@prisma/client";
import { searchGames } from "@/lib/rawg";

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        const text = await file.text();
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            console.error("CSV Parse Errors:", parseResult.errors);
            return NextResponse.json(
                { error: "Invalid CSV format" },
                { status: 400 },
            );
        }

        const rows = parseResult.data as any[];
        let addedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        const failedRows = [];

        // Fetch User's existing logs to prevent duplicate entries and detect updates
        const existingLogs = await prisma.gameLog.findMany({
            where: { userId: user.userId },
            include: { game: true },
        });

        const existingMap = new Map(
            existingLogs.map((log) => [log.game.rawgId, log]),
        );

        for (const row of rows) {
            const gameName = row["Game Name"] || row["name"] || row["Title"];
            if (!gameName) {
                failedCount++;
                failedRows.push({ row, reason: "Missing Game Name" });
                continue;
            }

            try {
                let rawgId = parseInt(row["Rawg ID"] || row["rawgId"], 10);
                let match = null;

                // Look up in RAWG if we don't have a direct Rawg ID
                if (isNaN(rawgId)) {
                    // Small delay to prevent rate-limiting RAWG
                    await new Promise((resolve) => setTimeout(resolve, 200));

                    const searchResults = await searchGames(gameName, 1);
                    if (searchResults.results.length === 0) {
                        failedCount++;
                        failedRows.push({
                            row,
                            reason: `Game not found on RAWG: ${gameName}`,
                        });
                        continue;
                    }
                    match = searchResults.results[0];
                    rawgId = match.id;
                } else {
                    // We need full details if it's a new game in our DB
                    const existingGame = await prisma.game.findUnique({
                        where: { rawgId },
                    });

                    if (!existingGame) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 200),
                        );
                        const searchResults = await searchGames(gameName, 1);
                        if (searchResults.results.length > 0) {
                            match = searchResults.results[0];
                        }
                    }
                }

                // Map status safely
                const rawStatus = (
                    row["Status"] ||
                    row["status"] ||
                    "PLAN_TO_PLAY"
                )
                    .toUpperCase()
                    .replace(/\s+/g, "_");
                let mappedStatus: GameStatus = GameStatus.PLAN_TO_PLAY;
                if (rawStatus === "COMPLETED")
                    mappedStatus = GameStatus.COMPLETED;
                if (rawStatus === "PLAYING") mappedStatus = GameStatus.PLAYING;

                const rating = row["Rating"]
                    ? parseInt(row["Rating"], 10)
                    : null;
                const hoursPlayed = row["Hours Played"]
                    ? parseFloat(row["Hours Played"])
                    : null;

                const existingLog = existingMap.get(rawgId);

                if (existingLog) {
                    // Update existing log
                    await prisma.gameLog.update({
                        where: { id: existingLog.id },
                        data: {
                            status: mappedStatus,
                            rating: isNaN(rating as number)
                                ? existingLog.rating
                                : rating,
                            hoursPlayed: isNaN(hoursPlayed as number)
                                ? existingLog.hoursPlayed
                                : hoursPlayed,
                            notes: row["Notes"] || existingLog.notes,
                            completedAt:
                                mappedStatus === GameStatus.COMPLETED &&
                                !existingLog.completedAt
                                    ? new Date()
                                    : existingLog.completedAt,
                        },
                    });
                    updatedCount++;
                } else {
                    // Create new user log entirely, ensure Game exists first
                    let gameId;
                    const dbGame = await prisma.game.findUnique({
                        where: { rawgId },
                    });

                    if (dbGame) {
                        gameId = dbGame.id;
                    } else if (match) {
                        const newGame = await prisma.game.create({
                            data: {
                                rawgId: match.id,
                                name: match.name,
                                slug: match.slug,
                                backgroundImage: match.background_image,
                                released: match.released,
                                metacritic: match.metacritic,
                                genres: JSON.stringify(
                                    match.genres.map((g: any) => g.name),
                                ),
                                platforms: JSON.stringify(
                                    match.platforms.map(
                                        (p: any) => p.platform.name,
                                    ),
                                ),
                            },
                        });
                        gameId = newGame.id;
                    } else {
                        throw new Error("Game not found in DB or API");
                    }

                    await prisma.gameLog.create({
                        data: {
                            userId: user.userId,
                            gameId: gameId,
                            status: mappedStatus,
                            rating: !isNaN(rating as number) ? rating : null,
                            hoursPlayed: !isNaN(hoursPlayed as number)
                                ? hoursPlayed
                                : null,
                            notes: row["Notes"] || null,
                            startedAt:
                                mappedStatus !== GameStatus.PLAN_TO_PLAY
                                    ? new Date()
                                    : null,
                            completedAt:
                                mappedStatus === GameStatus.COMPLETED
                                    ? new Date()
                                    : null,
                        },
                    });
                    addedCount++;
                }
            } catch (err) {
                console.error(`Failed to process row for ${gameName}:`, err);
                failedCount++;
                failedRows.push({ row, reason: "Internal Processing Error" });
            }
        }

        return NextResponse.json({
            success: true,
            results: {
                added: addedCount,
                updated: updatedCount,
                failed: failedCount,
                failedDetails: failedRows.slice(0, 10), // Limit payload size
            },
        });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
