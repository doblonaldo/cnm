import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { logSystemAudit } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("cnm_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const ip = req.headers.get("x-forwarded-for") || "unknown";

        const user = await prisma.user.update({
            where: { id: payload.userId as string },
            data: {
                hasAcceptedTerms: true,
                acceptedTermsAt: new Date()
            }
        });

        await logSystemAudit({
            eventType: "TERMS_ACCEPTED",
            ipAddress: ip,
            emailAttempt: user.email,
        });

        return NextResponse.json({ success: true, message: "Os termos foram aceitos e registrados." });
    } catch (error) {
        console.error("Accep Terms Error:", error);
        return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
    }
}
