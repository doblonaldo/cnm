import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email, groupId } = await req.json();

        if (!email || !groupId) {
            return NextResponse.json({ error: "Email and Group ID are required." }, { status: 400 });
        }

        // Verificar se grupo existe
        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found." }, { status: 404 });
        }

        // Gerar token de convite único
        const inviteToken = crypto.randomBytes(32).toString("hex");

        // Criar (ou atualizar) usuário com status pendente
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                inviteToken,
                inviteStatus: "PENDING",
                groupId, // Atualiza o grupo caso já exista mas estivesse inativo/pendente
            },
            create: {
                email,
                groupId,
                inviteToken,
                inviteStatus: "PENDING",
            },
        });

        // Construir Link de Convite (baseado na rota de frontend)
        // Exemplo: http://localhost:3000/invite/7812637123...
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteLink = `${appUrl}/invite/${inviteToken}`;

        // AQUI ENTRARIA O DISPARO DE E-MAIL (Ex: Nodemailer, Resend, etc)
        // mockSendEmail(email, inviteLink);
        console.log(`\n\n[MOCK EMAIL] Enviar para: ${email}`);
        console.log(`[MOCK EMAIL] Link de convite: ${inviteLink}\n\n`);

        return NextResponse.json({
            message: "Invite generated successfully",
            userId: user.id,
            mockLink: inviteLink // Apenas para debug inicial 
        });
    } catch (error) {
        console.error("Create Invite Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
