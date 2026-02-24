import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista todos os grupos ou busca um específico
export async function GET() {
    try {
        const groups = await prisma.group.findMany({
            include: {
                _count: {
                    select: { users: true, groupLinks: true },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("List Groups Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Criar novo grupo
export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required." }, { status: 400 });
        }

        const newGroup = await prisma.group.create({
            data: { name },
        });

        return NextResponse.json(newGroup);
    } catch (error) {
        console.error("Create Group Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
