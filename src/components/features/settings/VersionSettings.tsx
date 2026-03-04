"use client";

import SimpleUpdateNotification from "@/components/features/SimpleUpdateNotification";

export default function VersionSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Version Information
                </h2>
                <p className="text-muted-foreground mt-1">
                    Check for updates and manage system version
                </p>
            </div>

            <SimpleUpdateNotification />
        </div>
    );
}
