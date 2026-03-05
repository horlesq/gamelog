import Image from "next/image";
import { AnalyticsData } from "./types";

interface AnalyticsSummaryCardsProps {
    summary: AnalyticsData["summary"];
}

const SUMMARY_CARDS = [
    {
        icon: "/3d/sphere.png",
        label: "Total Games",
        key: "totalGames" as const,
        format: (v: number) => String(v),
    },
    {
        icon: "/3d/clock.png",
        label: "Total Hours",
        key: "totalHours" as const,
        format: (v: number) => String(v),
    },
    {
        icon: "/3d/star.png",
        label: "Avg Rating",
        key: "avgRating" as const,
        format: (v: number) => (v > 0 ? `${v}/10` : "—"),
    },
    {
        icon: "/3d/chart.png",
        label: "Completion",
        key: "completionRate" as const,
        format: (v: number) => `${v}%`,
    },
];

export default function AnalyticsSummaryCards({
    summary,
}: AnalyticsSummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {SUMMARY_CARDS.map((card) => (
                <div
                    key={card.key}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card"
                >
                    <Image
                        src={card.icon}
                        alt={card.label}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain"
                    />
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {card.label}
                        </p>
                        <p className="text-2xl font-bold text-accent">
                            {card.format(summary[card.key])}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
