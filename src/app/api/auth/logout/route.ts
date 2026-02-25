import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { logSystemAudit } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("cnm_token")?.value;
        const ip = req.headers.get("x-forwarded-for") || "unknown";

        if (token) {
            const payload = await verifyToken(token);
            if (payload && payload.email) {
                // Registro de Logout (DB + OS)
                await logSystemAudit({
                    eventType: "LOGOUT",
                    ipAddress: ip,
                    emailAttempt: payload.email,
                });
            }
        }

        const response = NextResponse.json({ message: "Logout successful" });

        // Deleta o cookie do JWT
        response.cookies.delete("cnm_token");

        return response;
    } catch (error) {
        console.error("Logout Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
