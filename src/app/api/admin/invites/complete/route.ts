import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { inviteToken: token },
        });

        if (!user || user.inviteStatus === "COMPLETED") {
            return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                isActive: true, // Ativa o usuário
                inviteStatus: "COMPLETED",
                inviteToken: null, // Invalida o token após uso
            },
        });

        return NextResponse.json({ message: "Password set and account activated successfully" });
    } catch (error) {
        console.error("Invite Complete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
