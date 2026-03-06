"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Download, Upload, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function DataManagement() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch("/api/export", { method: "GET" });
            if (!response.ok) throw new Error("Export failed");

            // Convert raw CSV text response to a Blob for downloading
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `gamelog-export-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Data exported successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            toast.error("Please upload a valid CSV file");
            // Reset input so they can try again if they immediately select a valid one
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsImporting(true);
        const toastId = toast.loading(
            "Processing your CSV file... This may take a minute.",
        );

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/import", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to import file");
            }

            toast.success(
                `Import complete! Added: ${data.results.added}, Updated: ${data.results.updated}, Failed: ${data.results.failed}`,
                { id: toastId, duration: 5000 },
            );

            // Refresh to show newly added games seamlessly
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "An error occurred during import",
                { id: toastId },
            );
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    Data Management
                </h2>
                <p className="text-muted-foreground mt-1">
                    Export your library to a CSV file or import games from an
                    external source.
                </p>
            </div>

            <Card className="bg-card">
                <CardContent className="space-y-6 pt-6">
                    <Alert className="bg-accent/5 border-accent/20">
                        <AlertCircle className="h-4 w-4 text-accent" />
                        <AlertTitle>Importing Guidelines</AlertTitle>
                        <AlertDescription className="text-muted-foreground mt-1">
                            <p>
                                When uploading a CSV file, ensure it has a{" "}
                                <strong className="text-foreground">
                                    Game Name
                                </strong>{" "}
                                column at minimum. Other supported columns
                                include <code>Status</code>, <code>Rating</code>
                                , <code>Hours Played</code>, and{" "}
                                <code>Notes</code>. We will automatically
                                attempt to match your games with the RAWG
                                database.
                            </p>
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 rounded-lg bg-background/50 p-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">
                                    Export Library
                                </h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Download a backup of all games currently in
                                    your library, including all metadata and
                                    statuses.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full justify-start space-x-2"
                                onClick={handleExport}
                                disabled={isExporting || isImporting}
                            >
                                <Download className="h-4 w-4" />
                                <span>
                                    {isExporting
                                        ? "Exporting..."
                                        : "Export as CSV"}
                                </span>
                            </Button>
                        </div>

                        <div className="space-y-3 rounded-lg bg-background/50 p-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">
                                    Import Library
                                </h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Upload a CSV file to bulk add or update
                                    games in your library. Duplicates will
                                    update existing entries.
                                </p>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="default"
                                className="w-full justify-start space-x-2"
                                onClick={handleImportClick}
                                disabled={isImporting || isExporting}
                            >
                                <Upload className="h-4 w-4" />
                                <span>
                                    {isImporting
                                        ? "Processing..."
                                        : "Import from CSV"}
                                </span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
