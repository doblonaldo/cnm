import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("cnm_token")?.value;

        if (!token) {
            return NextResponse.json({ isAdmin: false });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.groupId) {
            return NextResponse.json({ isAdmin: false });
        }

        const group = await prisma.group.findUnique({
            where: { id: payload.groupId }
        });

        const isAdmin = group?.name === "Administrador";

        return NextResponse.json({ isAdmin });
    } catch (error) {
        return NextResponse.json({ isAdmin: false });
    }
}
