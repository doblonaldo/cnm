import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Atualizar Link
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name, url, openInNewTab } = await req.json();

        if (!id || !name || !url) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        // Forçar protocolo se não tiver
        const formattedUrl = url.startsWith("http") ? url : `http://${url}`;

        const updatedLink = await prisma.link.update({
            where: { id },
            data: { name, url: formattedUrl, openInNewTab: Boolean(openInNewTab) },
        });

        return NextResponse.json(updatedLink);
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
            return NextResponse.json({ error: "Link URL or Name already exists" }, { status: 400 });
        }
        console.error("Update Link Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Excluir Link
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID is required." }, { status: 400 });
        }

        // Primeiro exclui as associações GroupLink associadas
        await prisma.groupLink.deleteMany({
            where: { linkId: id },
        });

        // Então exclui o link
        await prisma.link.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Link deleted successfully" });
    } catch (error) {
        console.error("Delete Link Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
