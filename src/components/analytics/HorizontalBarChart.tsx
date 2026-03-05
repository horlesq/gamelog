import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";
import { ChartCard, CustomTooltip } from "./ChartCard";
import { CHART_COLORS } from "./types";

interface HorizontalBarChartProps {
    title: string;
    data: { name: string; value: number }[];
    yAxisWidth?: number;
    marginLeft?: number;
}

export default function HorizontalBarChart({
    title,
    data,
    yAxisWidth = 90,
    marginLeft = 0,
}: HorizontalBarChartProps) {
    if (data.length === 0) return null;

    return (
        <ChartCard title={title}>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            left: marginLeft,
                            right: 20,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.25 0.04 290)"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tick={{
                                fill: "oklch(0.7 0.04 290)",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={yAxisWidth}
                            tick={{
                                fill: "oklch(0.7 0.04 290)",
                                fontSize: yAxisWidth > 90 ? 11 : 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={
                                        CHART_COLORS[
                                            index % CHART_COLORS.length
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
