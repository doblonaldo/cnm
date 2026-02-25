import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const settings = await prisma.appSetting.findUnique({
            where: { id: "singleton" },
        });

        // Retorna as configurações, se existem. Removemos a senha por segurança na interface
        if (settings) {
            const { smtpPass, ...safeSettings } = settings;
            return NextResponse.json(safeSettings);
        }

        return NextResponse.json({});
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();

        // Se a senha não foi enviada (campo em branco), não atualiza ela
        const updateData: any = {
            smtpHost: body.smtpHost,
            smtpPort: body.smtpPort ? parseInt(body.smtpPort) : null,
            smtpUser: body.smtpUser,
            smtpSecure: Boolean(body.smtpSecure),
            smtpFrom: body.smtpFrom
        };

        if (body.smtpPass) {
            updateData.smtpPass = body.smtpPass;
        }

        const settings = await prisma.appSetting.upsert({
            where: { id: "singleton" },
            update: updateData,
            create: {
                id: "singleton",
                ...updateData,
            },
        });

        return NextResponse.json({ message: "Configurações SMTP atualizadas" });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao salvar configurações SMTP" }, { status: 500 });
    }
}
