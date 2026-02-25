import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Rotas que não exigem autenticação
const publicRoutes = ["/login", "/api/auth/login", "/api/invites/complete", "/invite", "/logo.png"];
// Estendemos /invite para ignorar o middleware de autenticação (ex: /invite/T0k3n...)

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Verificação de Autenticação (Apenas se não for rota pública)
    const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

    if (!isPublic) {
        // Tenta pegar o token do cookie
        const token = request.cookies.get("cnm_token")?.value;

        if (!token) {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            const payload = await verifyToken(token);
            if (!payload) {
                throw new Error("Token inválido");
            }

            // Opcional: Adicionar headers customizados com o ID do usuário para rotas internas

            // Defesa Ativa A01: Broken Access Control: rotas Admin restritas SOMENTE a administradores
            if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
                if (!payload.isAdmin) {
                    if (pathname.startsWith("/api/")) {
                        return NextResponse.json({ error: "Forbidden - Administrator access required" }, { status: 403 });
                    }
                    return NextResponse.redirect(new URL("/login", request.url));
                }
            }
        } catch (error) {
            const response = pathname.startsWith("/api/")
                ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                : NextResponse.redirect(new URL("/login", request.url));

            // Limpa token inválido
            response.cookies.delete("cnm_token");
            return response;
        }
    }

    // 2. Proteção de Segurança Global e Content-Security-Policy (CSP)
    const response = NextResponse.next();

    // Assegura que *nenhum outro site* pode colocar o CNM num iframe (Prevenção de Clickjacking na própria casca)
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self';");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");

    // Outros headers de segurança básicos
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
