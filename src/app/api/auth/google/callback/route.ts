import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { logSystemAudit } from "@/lib/logger";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=OAUTH_NO_CODE", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const requiredDomain = process.env.GOOGLE_WORKSPACE_DOMAIN;

    if (!clientId || !clientSecret || !requiredDomain) {
        return NextResponse.redirect(new URL("/login?error=SSO_NOT_CONFIGURED", req.url));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

    try {
        // 1. Trocar o Authorization Code por um Access Token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Token Exchange Error:", tokenData);
            return NextResponse.redirect(new URL("/login?error=OAUTH_TOKEN_FAILED", req.url));
        }

        // 2. Buscar o Perfil do Google usando o Access Token
        const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const googleUser = await userinfoResponse.json();

        if (!userinfoResponse.ok || !googleUser.email) {
            return NextResponse.redirect(new URL("/login?error=OAUTH_PROFILE_FAILED", req.url));
        }

        const email = googleUser.email as string;

        // 3. Validação de Domínio OBRIGATÓRIA
        if (!email.endsWith(`@${requiredDomain}`)) {
            await logSystemAudit({
                eventType: "LOGIN_FAILED",
                ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                emailAttempt: email,
            });
            return NextResponse.redirect(new URL("/login?error=DOMAIN_NOT_ALLOWED", req.url));
        }

        // 4. Fluxo de Identidade no Banco (Auto-Provisioning)
        let user = await prisma.user.findUnique({
            where: { email },
            include: { group: true },
        });

        if (!user) {
            // Conta não existe - Cadastrar de imediato sem Grupo e sem Password
            user = await prisma.user.create({
                data: {
                    email,
                    isActive: true, // Ativo para poder logar, mas "Cego" por não ter Grupo.
                    // passwordHash é opcional e fica nulo.
                    // groupId é opcional e fica nulo.
                },
                include: { group: true },
            });
            console.log(`[SSO] Auto-Provisioned new user: ${email}`);
        } else if (!user.isActive) {
            return NextResponse.redirect(new URL("/login?error=INACTIVE_ACCOUNT", req.url));
        }

        // Atualiza lastLogin
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // 5. Emissão do nosso JWT Corporativo Padrão
        const token = await signToken({
            userId: user.id,
            email: user.email,
            groupId: user.groupId || undefined,
            isAdmin: user.group?.name === "Administrador",
        });

        await logSystemAudit({
            eventType: "LOGIN_SUCCESS",
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            emailAttempt: email,
        });

        // 6. Setar Sessão local via Cookie e Redirecionar para Dashboard
        const response = NextResponse.redirect(new URL("/", req.url));
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
        console.error("SSO Callback Error:", error);
        return NextResponse.redirect(new URL("/login?error=Internal_Server_Error", req.url));
    }
}
