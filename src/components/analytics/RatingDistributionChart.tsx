import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { ChartCard, CustomTooltip } from "./ChartCard";

interface RatingDistributionChartProps {
    data: { name: string; value: number }[];
}

export default function RatingDistributionChart({
    data,
}: RatingDistributionChartProps) {
    return (
        <ChartCard title="Rating Distribution">
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            left: -10,
                            right: 10,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.25 0.04 290)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{
                                fill: "oklch(0.7 0.04 290)",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{
                                fill: "oklch(0.7 0.04 290)",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            fill="oklch(0.55 0.28 290)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
