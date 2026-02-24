import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista todos os links
export async function GET() {
    try {
        const links = await prisma.link.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(links);
    } catch (error) {
        console.error("List Links Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Criar novo Link
export async function POST(req: Request) {
    try {
        const { name, url, openInNewTab } = await req.json();

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required." }, { status: 400 });
        }

        const formattedUrl = url.startsWith("http") ? url : `http://${url}`;

        const newLink = await prisma.link.create({
            data: { name, url: formattedUrl, openInNewTab: Boolean(openInNewTab) },
        });

        return NextResponse.json(newLink);
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
            return NextResponse.json({ error: "Link URL or Name already exists" }, { status: 400 });
        }
        console.error("Create Link Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
