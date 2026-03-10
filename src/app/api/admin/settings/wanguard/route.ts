import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const settings = await prisma.appSetting.findUnique({
            where: { id: "singleton" }
        });

        // Retornamos os dados omitindo tokens e dados sensíveis que não devem voltar preenchidos pra front.
        if (!settings) {
            return NextResponse.json({});
        }

        return NextResponse.json({
            wanguardHost: settings.wanguardHost,
            wanguardUser: settings.wanguardUser
        });
    } catch (error) {
        console.error("Wanguard settings fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch Wanguard config" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const existing = await prisma.appSetting.findUnique({ where: { id: "singleton" } });

        const updateData: any = {};
        if (body.wanguardHost !== undefined) updateData.wanguardHost = body.wanguardHost;
        if (body.wanguardUser !== undefined) updateData.wanguardUser = body.wanguardUser;
        if (body.wanguardPassword) updateData.wanguardPassword = body.wanguardPassword; // Only update if non-empty

        if (!existing) {
            await prisma.appSetting.create({
                data: {
                    id: "singleton",
                    ...updateData
                }
            });
        } else {
            await prisma.appSetting.update({
                where: { id: "singleton" },
                data: updateData
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Wanguard settings update error:", error);
        return NextResponse.json({ error: "Failed to update Wanguard config" }, { status: 500 });
    }
}
