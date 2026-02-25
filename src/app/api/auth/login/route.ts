import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import rateLimit from "@/lib/rate-limit";
import { logSystemAudit } from "@/lib/logger";

const limiter = rateLimit({ uniqueTokenPerInterval: 50, interval: 60000 }); // 50 logins por minuto no maximo globalmente por IP (mitigação bruteforce simples usando memory cache /lru)

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    try {
        await limiter.check(5, ip); // Limita cada IP a ter no máximo 5 tentativas de login a cada 60 segundos
    } catch (error) {
        return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { group: true }
        });

        if (!user || !user.passwordHash || !user.isActive) {
            // Registrar falha de login (Auditoria Restrita + OS)
            await logSystemAudit({
                eventType: "LOGIN_FAILED",
                ipAddress: ip,
                emailAttempt: email, // Opcional, util saber quem tentaram derrubar
            });
            return NextResponse.json({ error: "Invalid credentials or inactive account." }, { status: 401 });
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);

        if (!isValidPassword) {
            // Registrar falha de login (Auditoria Restrita + OS)
            await logSystemAudit({
                eventType: "LOGIN_FAILED",
                ipAddress: ip,
                emailAttempt: email,
            });
            return NextResponse.json({ error: "Invalid credentials or inactive account." }, { status: 401 });
        }

        // Sucesso no Login -> Gerar JWT, setar cookie HttpOnly "Strict"

        const token = await signToken({
            userId: user.id,
            email: user.email,
            groupId: user.groupId,
            isAdmin: user.group?.name === "Administrador",
        });

        // Atualiza lastLogin
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Registrar sucesso de login (Auditoria Restrita + OS)
        await logSystemAudit({
            eventType: "LOGIN_SUCCESS",
            ipAddress: ip,
            emailAttempt: email,
        });

        const response = NextResponse.json({ message: "Login successful" });
        const isHttps = req.headers.get("x-forwarded-proto") === "https";
        const isLocalhost = req.url.includes("localhost") || req.url.includes("127.0.0.1");

        response.cookies.set("cnm_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" && isHttps && !isLocalhost,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8, // 8h
        });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
