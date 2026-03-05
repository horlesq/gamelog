import { prisma } from "../db";
import { CreateGameLogData, UpdateGameLogData, GameStatus } from "@/types";

export class GameLogService {
    static async getUserGameLogs(
        userId: string,
        filters?: { search?: string; status?: string },
    ) {
        const where: Record<string, unknown> = { userId };

        if (filters?.status && filters.status !== "all") {
            where.status = filters.status.toUpperCase() as GameStatus;
        }

        const gameLogs = await prisma.gameLog.findMany({
            where,
            include: {
                game: true,
            },
            orderBy: { updatedAt: "desc" },
        });

        // Apply search filter on the game name (client-side since it's a relation)
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            return gameLogs.filter((log) =>
                log.game.name.toLowerCase().includes(searchLower),
            );
        }

        return gameLogs;
    }

    static async getGameLogById(gameLogId: string, userId: string) {
        return prisma.gameLog.findFirst({
            where: {
                id: gameLogId,
                userId,
            },
            include: {
                game: true,
            },
        });
    }

    static async createGameLog(userId: string, data: CreateGameLogData) {
        // Find or create the game
        let game = await prisma.game.findUnique({
            where: { rawgId: data.rawgId },
        });

        if (!game) {
            game = await prisma.game.create({
                data: {
                    rawgId: data.rawgId,
                    name: data.gameName,
                    slug: data.gameSlug,
                    backgroundImage: data.gameImage,
                    released: data.gameReleased,
                    metacritic: data.gameMetacritic,
                    genres: data.gameGenres,
                    platforms: data.gamePlatforms,
                    developers: data.gameDevelopers,
                },
            });
        }

        // Create the game log
        const gameLog = await prisma.gameLog.create({
            data: {
                status: data.status,
                rating: data.rating,
                hoursPlayed: data.hoursPlayed,
                platforms: data.platforms,
                notes: data.notes,
                startedAt: data.startedAt ? new Date(data.startedAt) : null,
                completedAt: data.completedAt
                    ? new Date(data.completedAt)
                    : null,
                gameId: game.id,
                userId,
            },
            include: {
                game: true,
            },
        });

        return gameLog;
    }

    static async updateGameLog(
        gameLogId: string,
        userId: string,
        data: UpdateGameLogData,
    ) {
        const existing = await this.getGameLogById(gameLogId, userId);
        if (!existing) {
            throw new Error("Game log not found or access denied");
        }

        const updateData: Record<string, unknown> = {};

        if (data.status !== undefined) updateData.status = data.status;
        if (data.rating !== undefined) updateData.rating = data.rating;
        if (data.hoursPlayed !== undefined)
            updateData.hoursPlayed = data.hoursPlayed;
        if (data.platforms !== undefined) updateData.platforms = data.platforms;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.startedAt !== undefined)
            updateData.startedAt = data.startedAt
                ? new Date(data.startedAt)
                : null;
        if (data.completedAt !== undefined)
            updateData.completedAt = data.completedAt
                ? new Date(data.completedAt)
                : null;

        return prisma.gameLog.update({
            where: { id: gameLogId },
            data: updateData,
            include: {
                game: true,
            },
        });
    }

    static async deleteGameLog(gameLogId: string, userId: string) {
        const existing = await this.getGameLogById(gameLogId, userId);
        if (!existing) {
            throw new Error("Game log not found or access denied");
        }

        await prisma.gameLog.delete({
            where: { id: gameLogId },
        });

        return { success: true };
    }

    static async getUserStats(userId: string) {
        const [total, planToPlay, playing, completed] = await Promise.all([
            prisma.gameLog.count({ where: { userId } }),
            prisma.gameLog.count({
                where: { userId, status: "PLAN_TO_PLAY" },
            }),
            prisma.gameLog.count({ where: { userId, status: "PLAYING" } }),
            prisma.gameLog.count({
                where: { userId, status: "COMPLETED" },
            }),
        ]);

        return { total, planToPlay, playing, completed };
    }
}
