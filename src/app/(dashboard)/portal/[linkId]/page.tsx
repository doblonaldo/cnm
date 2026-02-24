"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

export default function PortalPage() {
    const params = useParams();
    const linkId = params.linkId as string;
    const [linkUrl, setLinkUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        async function loadLink() {
            try {
                const res = await fetch("/api/admin/links"); // Busca lista pra achar o URL
                if (!res.ok) throw new Error("Erro ao buscar link");

                const links = await res.json();
                const target = links.find((l: any) => l.id === linkId);

                if (target) {
                    setLinkUrl(target.url);
                } else {
                    setError("Link não encontrado ou você não tem permissão.");
                }
            } catch (err) {
                setError("Falha ao carregar o portal.");
            } finally {
                setLoading(false);
            }
        }
        loadLink();
    }, [linkId]);

    if (loading) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                <p>Carregando ambiente seguro...</p>
            </div>
        );
    }

    if (error || !linkUrl) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 text-red-500 p-8">
                <ShieldAlert className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                <p className="text-slate-400 max-w-md text-center">{error}</p>
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
                ref={iframeRef}
                src={linkUrl}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                title="Secure Portal Domain"
            />
        </div>
    );
}
