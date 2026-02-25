"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Mail, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

export default function SmtpSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        smtpHost: "",
        smtpPort: "",
        smtpUser: "",
        smtpPass: "",
        smtpSecure: true,
        smtpFrom: ""
    });

    useEffect(() => {
        fetch("/api/admin/settings/smtp")
            .then(res => res.json())
            .then(data => {
                if (data && Object.keys(data).length > 0) {
                    setSettings(s => ({ ...s, ...data, smtpPass: "" })); // Nunca popular senha
                }
            })
            .catch(() => { });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings/smtp", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error("Falha ao salvar SMTP");
            toast.success("Configurações de E-mail (SMTP) atualizadas com sucesso!");
        } catch (error) {
            toast.error("Erro ao configurar E-mail.");
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">E-mail e Comunicação</h1>
                </div>
                <p className="text-slate-400 ml-14">Configure o servidor de envio para notificações e convites do sistema.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800 max-w-4xl ml-14 mt-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        Provedor de E-mail (SMTP)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Configure os dados do Google Workspace, SendGrid ou outro servidor SMTP para os disparos de e-mail do CNM.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Servidor SMTP (Host)</Label>
                            <Input
                                value={settings.smtpHost || ''}
                                onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                                placeholder="ex: smtp.gmail.com"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Porta</Label>
                            <Input
                                type="number"
                                value={settings.smtpPort || ''}
                                onChange={e => setSettings({ ...settings, smtpPort: e.target.value })}
                                placeholder="ex: 587 ou 465"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Usuário / E-mail Autenticador</Label>
                            <Input
                                value={settings.smtpUser || ''}
                                onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                                placeholder="email@suaempresa.com"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha (App Password)</Label>
                            <Input
                                type="password"
                                value={settings.smtpPass || ''}
                                onChange={e => setSettings({ ...settings, smtpPass: e.target.value })}
                                placeholder="Deixe em branco para não alterar"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nome/E-mail de Remetente (From)</Label>
                            <Input
                                value={settings.smtpFrom || ''}
                                onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
                                placeholder='ex: "CNM Support" <no-reply@suaempresa.com>'
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>
                        <div className="flex items-center gap-3 md:col-span-2 pt-4 border-t border-slate-800 mt-2">
                            <Switch
                                checked={settings.smtpSecure}
                                onCheckedChange={c => setSettings({ ...settings, smtpSecure: c })}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                            <div className="space-y-0.5">
                                <Label className="text-white text-base">Conexão Segura (SSL/TLS)</Label>
                                <p className="text-sm text-slate-500">Mantenha ativo para conexões SSL (Porta 465) ou STARTTLS seguras na porta 587.</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-4">
                            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                                {loading ? "Testando e Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Configuração</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
