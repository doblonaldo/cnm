import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    // Basic IP/Secret Protection to prevent abuse.
    // Em Produção real, idealmente isso seria bloqueado apenas para `127.0.0.1` + um Cron Token
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    // Authorization check via Authorization header (Bearer token matching the app's CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    try {
        // Calculate the date exactly 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Execute the deletion
        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo, // Menor que (Older than) 30 dias
                }
            }
        });

        return NextResponse.json({
            message: "Limpeza de Audit Logs concluída com sucesso.",
            deletedCount: result.count,
            olderThan: thirtyDaysAgo.toISOString()
        });

    } catch (error) {
        console.error("Erro na rotina de limpeza do banco:", error);
        return NextResponse.json({ error: "Erro interno ao executar limpeza." }, { status: 500 });
    }
}
