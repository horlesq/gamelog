import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/rawg";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const page = parseInt(searchParams.get("page") || "1");

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ results: [], count: 0 });
        }

        const data = await searchGames(query.trim(), page);

        const results = data.results.map((game) => ({
            id: game.id,
            name: game.name,
            slug: game.slug,
            backgroundImage: game.background_image,
            released: game.released,
            metacritic: game.metacritic,
            rating: game.rating,
            genres: game.genres?.map((g) => g.name) || [],
            platforms: game.platforms?.map((p) => p.platform.name) || [],
            developers: game.developers?.map((d) => d.name) || [],
        }));

        return NextResponse.json({
            results,
            count: data.count,
            next: data.next,
        });
    } catch (error) {
        console.error("Game search error:", error);
        return NextResponse.json(
            { error: "Failed to search games" },
            { status: 500 },
        );
    }
}
