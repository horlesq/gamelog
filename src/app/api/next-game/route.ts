import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db";
import { parseStringArray } from "@/lib/utils";
import Groq from "groq-sdk";
import { searchGames } from "@/lib/rawg";

interface AiSuggestion {
    name: string;
    reason: string;
}

interface EnrichedSuggestion {
    name: string;
    reason: string;
    image: string | null;
    genres: string[];
    platforms: string[];
    metacritic: number | null;
    released: string | null;
    slug: string | null;
    rawgId: number | null;
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return NextResponse.json(
                {
                    error: "AI suggestions are not configured. Please add a GROQ_API_KEY to your environment.",
                },
                { status: 503 },
            );
        }

        // Parse excluded names from request body
        let excludeNames: string[] = [];
        try {
            const body = await request.json();
            if (Array.isArray(body.excludeNames)) {
                excludeNames = body.excludeNames;
            }
        } catch {
            // No body or invalid JSON is fine
        }

        // Fetch user's game logs
        const gameLogs = await prisma.gameLog.findMany({
            where: { userId: user.userId },
            include: { game: true },
        });

        const completedLogs = gameLogs.filter((l) => l.status === "COMPLETED");

        if (completedLogs.length === 0) {
            return NextResponse.json(
                {
                    error: "You need to complete some games first before getting AI suggestions.",
                },
                { status: 400 },
            );
        }

        // Collect all game names to exclude from suggestions
        const allGameNames = [
            ...gameLogs.map((l) => l.game.name),
            ...excludeNames,
        ];

        // Build gaming profile based on completed games only
        const genreCounts: Record<string, number> = {};
        const platformCounts: Record<string, number> = {};
        const ratings: number[] = [];
        const completedGames: string[] = [];

        completedLogs.forEach((log) => {
            if (log.game.genres) {
                const genres = parseStringArray(log.game.genres);
                genres.forEach((g) => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            }

            if (log.platforms) {
                const platforms = parseStringArray(log.platforms);
                platforms.forEach((p) => {
                    platformCounts[p] = (platformCounts[p] || 0) + 1;
                });
            }

            if (log.rating) {
                ratings.push(log.rating);
            }

            completedGames.push(
                `${log.game.name}${log.rating ? ` (rated ${log.rating}/10)` : ""}`,
            );
        });

        const topGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        const topPlatforms = Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

        const avgRating =
            ratings.length > 0
                ? Math.round(
                      (ratings.reduce((a, b) => a + b, 0) / ratings.length) *
                          10,
                  ) / 10
                : null;

        // Build the prompt
        const prompt = `You are a game recommendation expert. Based on the following completed games and their ratings, suggest exactly 4 new games for the user.
        
        **CRITICAL:** In the "reason" field, address the user directly using "You", "Your", etc. (e.g., "Since you enjoyed...", "You might like..."). Do NOT use third-person phrases like "The user".

## Completed Games

${completedGames.join("\n")}

## Preferences

**Top genres:** ${topGenres.join(", ") || "varied"}
**Preferred platforms:** ${topPlatforms.join(", ") || "various"}
**Average rating given:** ${avgRating ? `${avgRating}/10` : "no ratings yet"}

## Rules
- Suggest only real, existing games
- Do NOT suggest any of these games (already in library): ${allGameNames.join(", ")}
- Focus on games similar to the ones the user rated highly
- Match their genre and platform preferences
- Mix well-known titles with hidden gems
- Each suggestion should have a specific, personalized reason referencing the completed games, addressing the user directly.

Respond with ONLY a valid JSON array, no markdown, no extra text. Each object must have "name" (the exact game title) and "reason" (1-2 sentences explaining why this game fits your taste, addressing you directly):
[{"name": "Game Title", "reason": "Because you enjoyed..."}, ...]`;

        // Call Groq API
        const groq = new Groq({ apiKey: groqApiKey });
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_completion_tokens: 1024,
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json(
                { error: "AI did not return a response. Please try again." },
                { status: 500 },
            );
        }

        // Parse the JSON response
        let suggestions: AiSuggestion[];
        try {
            // Strip potential markdown code fences
            const cleaned = content
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            suggestions = JSON.parse(cleaned);
        } catch {
            console.error("Failed to parse AI response:", content);
            return NextResponse.json(
                {
                    error: "AI returned an invalid response. Please try again.",
                },
                { status: 500 },
            );
        }

        // Enrich each suggestion with RAWG data
        const enrichedSuggestions: EnrichedSuggestion[] = await Promise.all(
            suggestions.slice(0, 4).map(async (suggestion) => {
                try {
                    const rawgResults = await searchGames(suggestion.name, 1);
                    const match = rawgResults.results[0];

                    if (match) {
                        return {
                            name: match.name,
                            reason: suggestion.reason,
                            image: match.background_image,
                            genres: match.genres.map((g) => g.name),
                            platforms: match.platforms.map(
                                (p) => p.platform.name,
                            ),
                            metacritic: match.metacritic,
                            released: match.released,
                            slug: match.slug,
                            rawgId: match.id,
                        };
                    }
                } catch (error) {
                    console.error(
                        `RAWG lookup failed for "${suggestion.name}":`,
                        error,
                    );
                }

                // Fallback if RAWG lookup fails
                return {
                    name: suggestion.name,
                    reason: suggestion.reason,
                    image: null,
                    genres: [],
                    platforms: [],
                    metacritic: null,
                    released: null,
                    slug: null,
                    rawgId: null,
                };
            }),
        );

        return NextResponse.json({ suggestions: enrichedSuggestions });
    } catch (error) {
        console.error("AI Suggest error:", error);

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
