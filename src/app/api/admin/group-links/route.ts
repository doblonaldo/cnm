import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST: Associar ou remover Links de um Grupo
export async function POST(req: Request) {
    try {
        const { groupId, linkIds } = await req.json(); // linkIds -> array de IDs

        if (!groupId || !Array.isArray(linkIds)) {
            return NextResponse.json({ error: "Invalid data." }, { status: 400 });
        }

        // Apaga todas as conexões antigas do grupo
        await prisma.groupLink.deleteMany({
            where: { groupId },
        });

        // Cria as novas conexões
        if (linkIds.length > 0) {
            const data = linkIds.map((linkId) => ({
                groupId,
                linkId,
            }));

            await prisma.groupLink.createMany({
                data,
            });
        }

        return NextResponse.json({ message: "Permissions updated" });
    } catch (error) {
        console.error("Group Links Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
