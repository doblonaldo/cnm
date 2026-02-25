"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UploadCloud, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppearanceSettingsPage() {
    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-full">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Aparência e Personalização</h1>
                </div>
                <p className="text-slate-400 ml-14">Personalize a identidade visual do Central Network Manager.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800 max-w-4xl ml-14">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-blue-400" />
                        Logotipo do Portal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <div className="p-4 bg-slate-950 rounded border border-slate-800 flex items-center justify-center w-40 h-40 shrink-0">
                            <img
                                src={`/logo.png?v=${Date.now()}`}
                                alt="Logo"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg text-white font-medium mb-2">Upload de Logotipo</h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-xl leading-relaxed">
                                Faça o upload de uma imagem personalizada para assumir o lugar do ícone padrão do sistema no painel lateral de navegação e na tela inicial de login. <br /><br />
                                <strong>Recomendado:</strong> Formato PNG ou SVG com fundo transparente. Proporção quadrada ou semi-retangular.
                            </p>
                            <input
                                type="file"
                                id="logo-upload"
                                accept="image/png, image/jpeg, image/svg+xml"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append("logo", file);
                                    try {
                                        toast.loading("Enviando logo...");
                                        const res = await fetch("/api/admin/logo", { method: "POST", body: formData });
                                        toast.dismiss();
                                        if (!res.ok) throw new Error("Falha no upload");
                                        toast.success("Logotipo atualizado com sucesso!");
                                        setTimeout(() => window.location.reload(), 1500);
                                    } catch (err) {
                                        toast.error("Erro ao subir a imagem");
                                    }
                                }}
                            />
                            <Button
                                onClick={() => document.getElementById("logo-upload")?.click()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Selecionar Arquivo do Computador...
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
