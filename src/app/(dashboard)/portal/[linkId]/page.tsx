import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// 1. Convertemos para um Server Component (remoção do 'use client')
// 2. Buscamos o banco diretamente para evitar checagens do proxy.ts
// 3. Verificamos se o usuário ativo pertence a um grupo que tem acesso à esse link

export default async function PortalPage({ params }: { params: Promise<{ linkId: string }> }) {
    const { linkId } = await params;

    // A) Autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get("cnm_token")?.value;

    if (!token) {
        redirect("/login");
    }

    let payload;
    try {
        payload = await verifyToken(token);
        if (!payload || !payload.userId) throw new Error("Token Invalido");
    } catch (e) {
        redirect("/login");
    }

    const userId = payload.userId as string;
    const userGroupId = payload.groupId as string;
    const isAdmin = payload.isAdmin as boolean;

    // B) Buscar o link alvo no DB
    const link = await prisma.link.findUnique({
        where: { id: linkId },
    });

    if (!link) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 text-red-500 p-8">
                <ShieldAlert className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                <p className="text-slate-400 max-w-md text-center">O aplicativo solicitado não foi encontrado.</p>
            </div>
        );
    }

    // C) Autorização (Checar se ele tem acesso)
    if (!isAdmin) {
        const hasAccess = await prisma.groupLink.findFirst({
            where: {
                groupId: userGroupId,
                linkId: link.id,
            }
        });

        if (!hasAccess) {
            return (
                <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 text-red-500 p-8">
                    <ShieldAlert className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                    <p className="text-slate-400 max-w-md text-center">Seu grupo de usuário não possui permissão para acessar esta aplicação.</p>
                </div>
            );
        }
    }

    // D) Renderização da View de Sucesso
    if (link.openInNewTab) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 p-8">
                <ShieldAlert className="h-16 w-16 mb-4 text-emerald-500" />
                <h2 className="text-2xl font-bold mb-2 text-white">Ambiente em Execução</h2>
                <p className="text-slate-400 max-w-md text-center">
                    Esta aplicação foi redirecionada e aberta de forma segura em uma nova aba do seu navegador.
                </p>
                <p className="text-slate-500 mt-4 text-sm max-w-md text-center">
                    Você pode fechar esta tela ou navegar para outro serviço pelo menu lateral.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-black">
            {/* 
            IFRAME SANDBOXED:
            A política restringe os scripts e comportamentos da página filha para isolamento de segurança.
            Não logamos interações aqui. O CNM age apenas como um túnel de visualização seguro.
            */}
            <iframe
                src={link.url}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                title="Secure Portal Domain"
            />
        </div>
    );
}
