import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const user = await requireAuth();

        const filters = await prisma.customFilter.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "asc" },
        });

        // Parse conditions JSON for each filter
        const parsed = filters.map((f) => ({
            ...f,
            conditions: JSON.parse(f.conditions),
        }));

        return NextResponse.json({ filters: parsed });
    } catch (error) {
        console.error("Get custom filters error:", error);

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

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { name, icon, color, conditions } = body;

        if (!name || !conditions) {
            return NextResponse.json(
                { error: "Name and conditions are required" },
                { status: 400 },
            );
        }

        const filter = await prisma.customFilter.create({
            data: {
                name,
                icon: icon || "filter",
                color: color || "purple",
                conditions: JSON.stringify(conditions),
                userId: user.userId,
            },
        });

        return NextResponse.json(
            {
                filter: {
                    ...filter,
                    conditions: JSON.parse(filter.conditions),
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Create custom filter error:", error);

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
