export type GameStatus = "PLAN_TO_PLAY" | "PLAYING" | "COMPLETED";

export interface Game {
    id: string;
    rawgId: number;
    name: string;
    slug?: string;
    backgroundImage?: string;
    released?: string;
    metacritic?: number;
    genres?: string;
    platforms?: string;
    developers?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GameLog {
    id: string;
    status: GameStatus;
    rating?: number;
    hoursPlayed?: number;
    platforms?: string;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
    gameId: string;
    game: Game;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Stats {
    total: number;
    planToPlay: number;
    playing: number;
    completed: number;
}

export interface CreateGameLogData {
    rawgId: number;
    gameName: string;
    gameSlug?: string;
    gameImage?: string;
    gameReleased?: string;
    gameMetacritic?: number;
    gameGenres?: string;
    gamePlatforms?: string;
    gameDevelopers?: string;
    status: GameStatus;
    rating?: number;
    hoursPlayed?: number;
    platforms?: string;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
}

export interface UpdateGameLogData {
    status?: GameStatus;
    rating?: number | null;
    hoursPlayed?: number | null;
    platforms?: string | null;
    notes?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export interface RAWGGame {
    id: number;
    name: string;
    slug: string;
    background_image: string | null;
    released: string | null;
    metacritic: number | null;
    rating: number;
    genres: { id: number; name: string }[];
    platforms: { platform: { id: number; name: string } }[];
    developers?: { id: number; name: string }[];
    short_screenshots?: { id: number; image: string }[];
}

export interface RAWGSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: RAWGGame[];
}

export interface FilterConditions {
    status?: GameStatus;
    genres?: string[];
    platforms?: string[];
    ratingMin?: number;
    ratingMax?: number;
    hoursMin?: number;
    hoursMax?: number;
}

export interface CustomFilter {
    id: string;
    name: string;
    icon: string;
    color: string;
    conditions: FilterConditions;
    userId: string;
    createdAt: string;
    updatedAt: string;
}
