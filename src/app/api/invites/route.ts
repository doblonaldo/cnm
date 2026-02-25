import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteLink = `${appUrl}/invite/${inviteToken}`;

        // BUSCAR CONFIGURAÇÕES DE SMTP DO BANCO (Sobrepõe as do .env se existir)
        const settings = await prisma.appSetting.findUnique({
            where: { id: "singleton" },
        });

        const smtpHost = settings?.smtpHost || process.env.SMTP_HOST;
        const smtpPort = settings?.smtpPort || Number(process.env.SMTP_PORT) || 587;
        const smtpSecure = settings?.smtpHost ? settings.smtpSecure : (process.env.SMTP_SECURE === "true" || smtpPort === 465);
        const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
        const smtpPass = settings?.smtpPass || process.env.SMTP_PASS;
        const smtpFrom = settings?.smtpFrom || process.env.SMTP_FROM || `"CNM Admin" <${smtpUser}>`;

        // DISPARO DE E-MAIL VIA SMTP COM NODEMAILER
        if (smtpHost && smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            await transporter.sendMail({
                from: smtpFrom,
                to: email,
                subject: "Convite para acesso ao Central Network Manager (CNM)",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="color: #2563eb;">Convite Confidencial</h2>
                        <p>Você foi convidado(a) para acessar o portal Central Network Manager (CNM).</p>
                        <p><strong>Grupo de Permissão:</strong> ${group.name}</p>
                        <p>Para definir sua senha segura e ativar sua conta, por favor acesse o link abaixo:</p>
                        <p style="margin: 30px 0;">
                            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Ativar Minha Conta e Definir Senha
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
                            Se você não solicitou ou não esperava este e-mail, ignore-o.<br>
                            Este link é de uso único.
                        </p>
                    </div>
                `,
            });
            console.log(`[SMTP EMAIL] E-mail enviado com sucesso para: ${email}`);
        } else {
            console.log(`\n\n[MOCK EMAIL - SMTP NÃO CONFIGURADO] Enviar para: ${email}`);
            console.log(`[MOCK EMAIL] Link de convite: ${inviteLink}\n\n`);
        }

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
