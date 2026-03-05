export function ChartCard({
    title,
    children,
    className = "",
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-card rounded-xl p-5 sm:p-6 ${className}`}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {title}
            </h3>
            {children}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
                <p className="text-sm font-medium text-foreground">
                    {label || payload[0].name}
                </p>
                <p className="text-sm text-muted-foreground">
                    {payload[0].value}{" "}
                    {payload[0].value === 1 ? "game" : "games"}
                </p>
            </div>
        );
    }
    return null;
}
