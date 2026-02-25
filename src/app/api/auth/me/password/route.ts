import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/hash";

export async function PUT(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("cnm_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: "A nova senha deve ter no mínimo 8 caracteres." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user || !user.passwordHash) {
            return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
        }

        const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json({ message: "Senha atualizada com sucesso!" });
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "Ocorreu um erro interno. Tente novamente." }, { status: 500 });
    }
}
