"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogIn, LogOut, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/admin/logs");
                setLogs(await res.json());
            } catch (err) {
                toast.error("Erro ao carregar logs.");
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const getEventIcon = (type: string) => {
        switch (type) {
            case "LOGIN_SUCCESS": return <LogIn className="text-emerald-500 w-4 h-4" />;
            case "LOGIN_FAILED": return <XCircle className="text-red-500 w-4 h-4" />;
            case "LOGOUT": return <LogOut className="text-slate-400 w-4 h-4" />;
            default: return <ShieldCheck className="text-blue-500 w-4 h-4" />;
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case "LOGIN_SUCCESS": return "Login com Sucesso";
            case "LOGIN_FAILED": return "Falha de Autenticação";
            case "LOGOUT": return "Desconexão";
            default: return type;
        }
    };

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        Auditoria Reversa
                    </h1>
                    <p className="text-slate-400 mt-1 max-w-2xl text-sm">
                        Registro restrito de eventos de entrada e saída. Em conformidade absoluta com requisitos de privacidade,
                        <strong className="text-red-400 font-semibold mx-1">não coletamos telemetria</strong>
                        de navegação interna ou visualização de iframes.
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Últimas 100 Tentativas
                    </CardTitle>
                    <CardDescription className="text-slate-400">Estes dados são críticos. Monitore IPs suspeitos tentando acessar e-mails chave.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
                        <Table>
                            <TableHeader className="bg-black/40">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400 font-medium">Data e Hora</TableHead>
                                    <TableHead className="text-slate-400 font-medium">Tipo do Evento</TableHead>
                                    <TableHead className="text-slate-400 font-medium">E-mail (Tentativa)</TableHead>
                                    <TableHead className="text-slate-400 text-right font-medium">Endereço IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">Buscando rastros...</TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">O sistema está limpo. Nenhum login ocorreu ainda.</TableCell>
                                    </TableRow>
                                ) : logs.map((log) => (
                                    <TableRow key={log.id} className={`border-slate-800/60 ${log.eventType === 'LOGIN_FAILED' ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-800/50'}`}>
                                        <TableCell className="text-slate-300 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString("pt-BR")}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-200">
                                            <span className="flex items-center gap-2">
                                                {getEventIcon(log.eventType)}
                                                {getEventLabel(log.eventType)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-400">{log.emailAttempt || "--"}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-slate-400 tracking-wider">
                                            {log.ipAddress || "Unknown"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
