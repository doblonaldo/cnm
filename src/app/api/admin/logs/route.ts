import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        // Busca logs de auditoria de autenticação protegidos pela middleware do painel Admin
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100, // Limita ao top 100 mais recentes por performance
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("List Audit Logs Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
