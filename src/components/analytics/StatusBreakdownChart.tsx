import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard, CustomTooltip } from "./ChartCard";
import { PIE_COLORS } from "./types";

interface StatusBreakdownChartProps {
    data: { name: string; value: number; color: string }[];
}

export default function StatusBreakdownChart({
    data,
}: StatusBreakdownChartProps) {
    const filtered = data.filter((s) => s.value > 0);

    return (
        <ChartCard title="Status Breakdown">
            <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filtered}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            paddingAngle={4}
                            stroke="none"
                        >
                            {filtered.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {filtered.map((status, index) => (
                    <div
                        key={status.name}
                        className="flex items-center gap-2 text-sm"
                    >
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{
                                backgroundColor:
                                    PIE_COLORS[index % PIE_COLORS.length],
                            }}
                        />
                        <span className="text-muted-foreground">
                            {status.name}
                        </span>
                        <span className="font-semibold text-foreground">
                            {status.value}
                        </span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
