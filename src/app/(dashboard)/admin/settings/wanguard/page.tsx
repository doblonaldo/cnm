"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Save, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function WanguardSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        wanguardHost: "",
        wanguardUser: "",
        wanguardPassword: ""
    });

    useEffect(() => {
        fetch("/api/admin/settings/wanguard")
            .then(res => res.json())
            .then(data => {
                if (data && Object.keys(data).length > 0) {
                    setSettings(s => ({ ...s, ...data, wanguardPassword: "" })); // Nunca popular senha na UI
                }
            })
            .catch(() => { });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings/wanguard", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wanguardHost: settings.wanguardHost,
                    wanguardUser: settings.wanguardUser,
                    wanguardPassword: settings.wanguardPassword
                })
            });
            if (!res.ok) throw new Error("Falha ao salvar provedor de Wanguard");
            toast.success("Configurações do Wanguard atualizadas com sucesso!");
        } catch (error) {
            toast.error("Erro ao configurar API do Wanguard.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-full">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Integração Wanguard</h1>
                </div>
                <p className="text-slate-400 ml-14">Configure o servidor para visualização e análise de tráfego de Flow (AS).</p>
            </div>

            <Card className="bg-slate-900 border-slate-800 max-w-4xl ml-14 mt-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-400" />
                        Acesso à REST API
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Insira os dados de comunicação gerados através do Wanguard Console para permitir que a Plataforma conecte-se aos relatórios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Host / IP da API</Label>
                            <Input
                                value={settings.wanguardHost || ''}
                                onChange={e => setSettings({ ...settings, wanguardHost: e.target.value })}
                                placeholder="http://10.0.0.10"
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                            />
                            <p className="text-xs text-slate-500">Endereço HTTP(S) apontando para a interface do Wanguard.</p>
                        </div>
                        
                        <div className="space-y-2 md:col-span-1">
                            <Label>Usuário (API)</Label>
                            <Input
                                value={settings.wanguardUser || ''}
                                onChange={e => setSettings({ ...settings, wanguardUser: e.target.value })}
                                placeholder="ex: admin"
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                            />
                        </div>
                        
                        <div className="space-y-2 md:col-span-1">
                            <Label>Senha (API)</Label>
                            <Input
                                type="password"
                                value={settings.wanguardPassword || ''}
                                onChange={e => setSettings({ ...settings, wanguardPassword: e.target.value })}
                                placeholder="Deixe em branco para manter a atual"
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                            />
                            <p className="text-xs text-slate-500 md:col-span-2">Usuário com acesso habilitado à REST API no painel do Wanguard.</p>
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end mt-4">
                            <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-600 text-white px-8">
                                {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Integração</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
