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
        const playingLogs = gameLogs.filter((l) => l.status === "PLAYING");

        if (completedLogs.length === 0) {
            return NextResponse.json(
                {
                    error: "You need to complete some games first before getting AI suggestions.",
                },
                { status: 400 },
            );
        }

        // Fetch user's explicitly ignored/disliked games from DB
        const ignoredGames = await prisma.ignoredGame.findMany({
            where: { userId: user.userId },
            select: { gameName: true },
        });

        // Collect all game names to exclude from suggestions
        const allGameNames = [
            ...gameLogs.map((l) => l.game.name),
            ...ignoredGames.map((ig) => ig.gameName),
            ...excludeNames,
        ];

        // Lowercase set for fast comparison during post-filtering
        const excludedNamesLower = new Set(
            allGameNames.map((n) => n.toLowerCase()),
        );

        // Build gaming profile based on completed games only
        const genreCounts: Record<string, number> = {};
        const platformCounts: Record<string, number> = {};
        const lovedGames: string[] = []; // rated 8-10
        const likedGames: string[] = []; // rated 5-7
        const mixedGames: string[] = []; // rated 1-4 or unrated

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

            const detail = [
                log.game.name,
                log.rating ? `rated ${log.rating}/10` : null,
                log.hoursPlayed ? `${log.hoursPlayed}h played` : null,
                log.notes ? `notes: "${log.notes.slice(0, 120)}"` : null,
            ]
                .filter(Boolean)
                .join(" — ");

            if (log.rating && log.rating >= 8) {
                lovedGames.push(detail);
            } else if (log.rating && log.rating >= 5) {
                likedGames.push(detail);
            } else {
                mixedGames.push(detail);
            }
        });

        const topGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        const topPlatforms = Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

        // Currently playing context
        const currentlyPlaying = playingLogs.map((l) => l.game.name);

        // Inject randomness: pick a random exploration angle each time
        // This forces the LLM to explore different parts of its knowledge
        const explorationAngles = [
            "Focus on indie games and hidden gems from small studios that match their taste.",
            "Focus on critically acclaimed AAA titles they might have missed.",
            "Focus on games from the last 3 years that match their preferences.",
            "Focus on classic games (pre-2015) that are considered timeless masterpieces in their favorite genres.",
            "Focus on games with exceptional storytelling and narrative depth.",
            "Focus on games with unique or innovative gameplay mechanics.",
            "Focus on games from Japanese developers or studios outside the Western mainstream.",
            "Focus on games that are underrated or overlooked but highly praised by niche communities.",
            "Focus on games with strong multiplayer or co-op experiences.",
            "Focus on games with atmospheric world-building and immersive environments.",
            "Focus on games that won major awards (GOTY, BAFTA, TGA) in their favorite genres.",
            "Focus on games from Eastern European or other non-mainstream development studios.",
        ];
        const randomAngle =
            explorationAngles[
                Math.floor(Math.random() * explorationAngles.length)
            ];
        const randomSeed = Math.floor(Math.random() * 100000);

        // Reframe exclusions positively: "you've already recommended these"
        const previouslyRecommended =
            excludeNames.length > 0
                ? `\n## Already Recommended (DO NOT repeat these)\nYou have already recommended these in previous sessions, so suggest COMPLETELY DIFFERENT games:\n${excludeNames.join(", ")}`
                : "";
        // Build the prompt — ask for 12 to have a large buffer for post-filtering
        const prompt = `Based on the user's gaming history below, suggest exactly 6 NEW and UNIQUE games they would love.

**CRITICAL:** Address the user directly ("You", "Your"). Do NOT use "The user".

## Games They LOVED (rated 8-10)
${lovedGames.length > 0 ? lovedGames.join("\n") : "None yet"}

## Games They Liked (rated 5-7)
${likedGames.length > 0 ? likedGames.join("\n") : "None yet"}

## Games They Had Mixed Feelings About (rated 1-4 or unrated)
${mixedGames.length > 0 ? mixedGames.join("\n") : "None yet"}
${currentlyPlaying.length > 0 ? `\n## Currently Playing\n${currentlyPlaying.join("\n")}` : ""}
${previouslyRecommended}

## Taste Profile
**Favorite genres:** ${topGenres.join(", ") || "varied"}
**Preferred platforms:** ${topPlatforms.join(", ") || "various"}

## Special Direction for THIS Session
${randomAngle}
(Session seed: ${randomSeed} — use this to vary your picks)

## Rules
- Suggest only real, existing games
- NEVER suggest any game the user already owns or that appears in the "Already Recommended" list above
- Prioritize games similar to those they LOVED — match the specific qualities they enjoyed (narrative style, mechanics, atmosphere, difficulty)
- If they wrote notes about a game, use those insights to understand what they value
- Each suggestion must be a UNIQUE game not from the same franchise as another suggestion
- Each suggestion must have a specific reason referencing their actual completed games
- Be creative and surprising — dig deep into your knowledge of gaming

Respond with a JSON object containing a "suggestions" array. Each object in the array must have "name" (exact game title) and "reason" (1-2 sentences):
{
  "suggestions": [
    {"name": "Game Title", "reason": "Because you enjoyed..."},
    ...
  ]
}`;

        // Call Groq API with system message for better role adherence
        const groq = new Groq({ apiKey: groqApiKey });
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are a game recommendation expert with encyclopedic knowledge of video games across all eras, genres, and platforms. You pride yourself on surprising users with unexpected but perfectly matched recommendations. Never repeat yourself — always find fresh suggestions. You MUST respond with valid JSON.",
                },
                { role: "user", content: prompt },
            ],
            model: "openai/gpt-oss-120b",
            temperature: 1.0,
            max_tokens: 2048,
        });

        let content = chatCompletion.choices[0]?.message?.content;
        if (content) {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                content = jsonMatch[1];
            }
        }
        if (!content) {
            return NextResponse.json(
                { error: "AI did not return a response. Please try again." },
                { status: 500 },
            );
        }

        // Parse the JSON response
        let aiResponse: { suggestions: AiSuggestion[] };
        try {
            aiResponse = JSON.parse(content);
            if (!Array.isArray(aiResponse.suggestions)) {
                throw new Error("Invalid response format");
            }
        } catch {
            console.error("Failed to parse AI response:", content);
            return NextResponse.json(
                {
                    error: "AI returned an invalid response. Please try again.",
                },
                { status: 500 },
            );
        }

        const rawSuggestions = aiResponse.suggestions;

        // Server-side post-filter: programmatically remove any suggestion
        // that matches the exclusion list (LLMs often ignore negative constraints)
        const filteredSuggestions = rawSuggestions.filter(
            (s) => !excludedNamesLower.has(s.name.toLowerCase()),
        );

        // Enrich each suggestion with RAWG data (take top 4 after filtering)
        const enrichedSuggestions: EnrichedSuggestion[] = await Promise.all(
            filteredSuggestions.slice(0, 4).map(async (suggestion) => {
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
