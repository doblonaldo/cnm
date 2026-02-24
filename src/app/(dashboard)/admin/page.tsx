"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Link2, Activity } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, groups: 0, links: 0, logs: 0 });

    useEffect(() => {
        async function loadStats() {
            try {
                const [uRes, gRes, lRes, logRes] = await Promise.all([
                    fetch("/api/admin/users").then(r => r.json()),
                    fetch("/api/admin/groups").then(r => r.json()),
                    fetch("/api/admin/links").then(r => r.json()),
                    fetch("/api/admin/logs").then(r => r.json())
                ]);

                setStats({
                    users: uRes.length || 0,
                    groups: gRes.length || 0,
                    links: lRes.length || 0,
                    logs: logRes.length || 0
                });
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
            </div>
        </div>
    );
}
