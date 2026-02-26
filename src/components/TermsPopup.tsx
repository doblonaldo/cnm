"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface TermsPopupProps {
    open: boolean;
}

export function TermsPopup({ open }: TermsPopupProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(open);

    const handleAccept = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/accept-terms", {
                method: "POST",
            });

            if (!res.ok) {
                throw new Error("Erro ao registrar aceite.");
            }

            toast.success("Obrigado por aceitar os termos. Bem-vindo!");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Ocorreu um erro ao processar sua solicitação.");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            {/* onOpenChange vazio impede fechamento clicando fora ou no Esc */}
            <DialogContent className="sm:max-w-[600px] border-slate-800 bg-slate-900 text-slate-100 p-0 overflow-hidden" showCloseButton={false}>
                <div className="bg-blue-600/10 border-b border-blue-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                        <ShieldAlert className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-bold tracking-tight">AVISO — PRIMEIRO ACESSO</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Por favor, leia atentamente as instruções abaixo antes de prosseguir.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6">
                    <ScrollArea className="h-[280px] w-full rounded-md border border-slate-800 bg-slate-950 p-4">
                        <div className="space-y-4 text-sm text-slate-300 leading-relaxed pr-4">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Esta aplicação é exclusiva para uso profissional de colaboradores e terceiros autorizados da <strong>Brphonia</strong>.</li>
                                <li>Utilize apenas as ferramentas e links disponibilizados aqui (homologados pela Brphonia).</li>
                                <li>É proibido usar soluções não autorizadas para atividades da empresa.</li>
                                <li>A Brphonia pode registrar e monitorar acessos e uso para fins de segurança e conformidade.</li>
                                <li>Qualquer uso indevido ou incidente (ex.: vazamento de dados) pode gerar medidas disciplinares e responsabilização.</li>
                            </ul>

                            <div className="pt-2">
                                <p className="mb-2 font-medium text-slate-200">Ao prosseguir, você declara estar ciente e de acordo com as políticas internas aplicáveis listadas abaixo:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li>Política de Segurança da Informação e Cibersegurança</li>
                                    <li>Política de Proteção de Dados Pessoais</li>
                                    <li>Política de Privacidade</li>
                                    <li>Código de Ética e Conduta</li>
                                </ul>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 pt-0 sm:justify-between items-center bg-slate-900 flex-col sm:flex-row gap-3 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                        onClick={() => window.open("https://politicas.brphonia.com.br", "_blank")}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Ler Documento Oficial Completo
                    </Button>
                    <Button
                        type="button"
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Estou Ciente e Autorizo
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
