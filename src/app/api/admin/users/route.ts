import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista todos os usuários
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                group: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const safeUsers = users.map((user) => {
            // Remover hash da senha antes de retornar
            const { passwordHash, ...rest } = user;
            return rest;
        });

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("List Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
