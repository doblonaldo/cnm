"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Link2, Activity, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, groups: 0, links: 0, logs: 0 });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function loadStats() {
            try {
                const [uRes, gRes, lRes, logRes, meRes] = await Promise.all([
                    fetch("/api/admin/users").then(r => r.json()),
                    fetch("/api/admin/groups").then(r => r.json()),
                    fetch("/api/admin/links").then(r => r.json()),
                    fetch("/api/admin/logs").then(r => r.json()),
                    fetch("/api/auth/me").then(r => r.json()).catch(() => ({ isAdmin: false }))
                ]);

                setStats({
                    users: uRes.length || 0,
                    groups: gRes.length || 0,
                    links: lRes.length || 0,
                    logs: logRes.length || 0
                });
                setIsAdmin(meRes?.isAdmin === true);
            } catch (error) {
                console.error(error);
            }
        }
        loadStats();
    }, []);

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Painel de Segurança</h1>
                <p className="text-slate-400">Visão geral do sistema Central Network Manager.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Total Usuários</CardTitle>
                        <Users className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.users}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Grupos</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.groups}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Links Ativos</CardTitle>
                        <Link2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.links}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Eventos de Log</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.logs}</div>
                    </CardContent>
                </Card>
                {isAdmin && (
                    <Card className="bg-slate-900 border-slate-800 md:col-span-2 lg:col-span-4 mt-6">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-blue-400" />
                                Aparência e Personalização
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                <div className="p-4 bg-slate-950 rounded border border-slate-800 flex items-center justify-center w-32 h-32 shrink-0">
                                    <img src={`/logo.png?v=${Date.now()}`} alt="Logo" className="max-w-full max-h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-medium mb-1">Logotipo do Portal</h3>
                                    <p className="text-sm text-slate-400 mb-4 max-w-xl">
                                        Faça o upload de uma imagem personalizada para assumir o lugar do ícone padrão do sistema no seu painel lateral.
                                        (Recomendado: PNG com fundo transparente).
                                    </p>
                                    <input type="file" id="logo-upload" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={async (e) => {
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
                                    }} />
                                    <Button onClick={() => document.getElementById("logo-upload")?.click()} variant="outline" className="text-slate-200 border-slate-700 bg-slate-950 hover:bg-slate-800">
                                        Escolher Nova Imagem...
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
