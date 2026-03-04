import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const existing = await prisma.customFilter.findFirst({
            where: { id, userId: user.userId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Filter not found" },
                { status: 404 },
            );
        }

        const { name, icon, color, conditions } = body;

        const filter = await prisma.customFilter.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(icon !== undefined && { icon }),
                ...(color !== undefined && { color }),
                ...(conditions !== undefined && {
                    conditions: JSON.stringify(conditions),
                }),
            },
        });

        return NextResponse.json({
            filter: {
                ...filter,
                conditions: JSON.parse(filter.conditions),
            },
        });
    } catch (error) {
        console.error("Update custom filter error:", error);

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

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const existing = await prisma.customFilter.findFirst({
            where: { id, userId: user.userId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Filter not found" },
                { status: 404 },
            );
        }

        await prisma.customFilter.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete custom filter error:", error);

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
