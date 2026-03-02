"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, RefreshCw, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ClienteDados = {
    id: number;
    nome: string;
    serial: string;
    sinal: number;
    status: string;
    horarioQueda?: string;
};

const OLTS = ["STC-01", "STC-02", "AGQ", "SRO-01", "SRO-02", "DMC-01", "SRO-BASE", "SRO-CRZ", "GRA", "HZA", "IDD", "TDU", "TMI", "TUD", "INRA"];
const SLOTS = Array.from({ length: 16 }, (_, i) => i + 1);
const PORTAS = Array.from({ length: 16 }, (_, i) => i + 1);

export default function BaterNapPage() {
    const [olt, setOlt] = useState<string>("");
    const [slot, setSlot] = useState<string>("");
    const [porta, setPorta] = useState<string>("");

    const [dadosOriginais, setDadosOriginais] = useState<ClienteDados[]>([]);
    const [dadosAtualizados, setDadosAtualizados] = useState<ClienteDados[]>([]);

    const [loading, setLoading] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [consultado, setConsultado] = useState(false);

    const [removerComSinal, setRemoverComSinal] = useState(false);

    const formatarSinalClass = (sinal: number, status: string) => {
        if (sinal === 0 || status === "Loss" || status === "Offline" || status === "DyingGasp") {
            return "text-red-500 font-bold";
        }
        if (sinal >= -1) return "text-red-500 font-bold";
        if (sinal > -14) return "text-orange-500 font-semibold";
        if (sinal > -24) return "text-green-500 font-bold";
        if (sinal < -24 && sinal > -30) return "text-yellow-500 font-semibold";
        if (sinal <= -30) return "text-red-500 font-bold";
        return "text-slate-200";
    };

    const handleConsultar = async () => {
        if (!olt || !slot || !porta) {
            toast.error("Preencha todos os campos (OLT, Slot e Porta) antes de consultar.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/apps/baternap/dados?opcao1=${olt}&opcao2=${slot}&opcao3=${porta}`);
            if (!res.ok) {
                const errorData = await res.json();
                toast.error(`Erro na consulta: ${errorData.error || "Tente novamente."}`);
                setLoading(false);
                return;
            }

            const data: ClienteDados[] = await res.json();
            if (data.length === 0) {
                toast.warning("Nenhum cliente encontrado para este Slot e Porta.");
            } else {
                setDadosOriginais(data);
                setConsultado(true);
                toast.success("Consulta finalizada com sucesso!");
            }
        } catch (error) {
            toast.error("Ocorreu um erro de rede ou o servidor demorou a responder.");
        } finally {
            setLoading(false);
        }
    };

    const handleAtualizar = async () => {
        setAtualizando(true);
        try {
            const res = await fetch(`/api/apps/baternap/dados?opcao1=${olt}&opcao2=${slot}&opcao3=${porta}`);
            if (!res.ok) {
                toast.error("Erro ao atualizar os dados.");
                setAtualizando(false);
                return;
            }

            const data: ClienteDados[] = await res.json();
            setDadosAtualizados(data);
            toast.success("Dados atualizados!");
        } catch (error) {
            toast.error("Falha ao buscar a atualização.");
        } finally {
            setAtualizando(false);
        }
    };

    const handleRecomecar = () => {
        setOlt("");
        setSlot("");
        setPorta("");
        setDadosOriginais([]);
        setDadosAtualizados([]);
        setConsultado(false);
        setRemoverComSinal(false);
    };

    const filtrarDados = (dados: ClienteDados[]) => {
        if (!removerComSinal) return dados;
        return dados.filter(item => item.sinal < -40 || item.sinal === 0 || item.status !== "Working");
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bater Nap</h1>
                    <p className="text-muted-foreground">Consulte sinais e status de clientes FTTH/ZTE em tempo real.</p>
                </div>
            </div>

            <Alert variant="default" className="bg-blue-950/20 border-blue-900/50">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-400">Fluxo de Trabalho Recomendado</AlertTitle>
                <AlertDescription className="text-blue-200/70 text-sm mt-2">
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Selecione OLT, Slot e Porta para buscar os dados originais.</li>
                        <li>Após consultar, os campos serão travados. Utilize o botão <strong className="text-blue-300">Atualizar</strong> para comparar o antes/depois da manutenção.</li>
                        <li>Use o filtro "Remover Clientes com Sinal" para listar apenas as quedas.</li>
                        <li>Para uma nova PON, clique em <strong className="text-blue-300">Recomeçar</strong>.</li>
                    </ul>
                </AlertDescription>
            </Alert>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">Parâmetros de Consulta</CardTitle>
                    <CardDescription>Selecione a PON que deseja investigar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2 w-48">
                            <label className="text-sm font-medium text-slate-300">OLT</label>
                            <Select value={olt} onValueChange={setOlt} disabled={consultado || loading}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {OLTS.map(o => (
                                        <SelectItem key={o} value={o}>{o}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 w-32">
                            <label className="text-sm font-medium text-slate-300">Slot</label>
                            <Select value={slot} onValueChange={setSlot} disabled={consultado || loading}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Nº" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {SLOTS.map(s => (
                                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 w-32">
                            <label className="text-sm font-medium text-slate-300">Porta</label>
                            <Select value={porta} onValueChange={setPorta} disabled={consultado || loading}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Nº" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {PORTAS.map(p => (
                                        <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!consultado ? (
                            <Button onClick={handleConsultar} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Consultar
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleAtualizar} disabled={atualizando} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                    <RefreshCw className={`w-4 h-4 ${atualizando ? "animate-spin" : ""}`} />
                                    Atualizar Dados
                                </Button>
                                <Button onClick={handleRecomecar} variant="destructive" className="gap-2 bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-900">
                                    <RotateCcw className="w-4 h-4" />
                                    Recomeçar
                                </Button>
                            </>
                        )}

                        <div className="flex items-center space-x-2 ml-auto p-2 bg-slate-950 rounded-md border border-slate-800 h-10 px-4">
                            <Checkbox id="removerSinal" checked={removerComSinal} onCheckedChange={(c) => setRemoverComSinal(c === true)} disabled={loading} className="border-slate-600" />
                            <label htmlFor="removerSinal" className="text-sm font-medium text-slate-300 cursor-pointer">
                                Remover clientes online
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {(dadosOriginais.length > 0 || loading) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tabela Original */}
                    <Card className="bg-slate-900 border-slate-800 flex flex-col h-[600px]">
                        <CardHeader className="py-4 border-b border-slate-800">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Dados Originais</span>
                                <span className="text-sm font-normal text-slate-500">
                                    {filtrarDados(dadosOriginais).length} clientes
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1 custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-950/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Serial</TableHead>
                                        <TableHead className="text-right">Sinal (Rx)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500/50" />
                                                Buscando dados via SNMP/MySQL...
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtrarDados(dadosOriginais).map((item) => (
                                            <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-400">{item.id}</TableCell>
                                                <TableCell className="truncate max-w-[150px]" title={item.nome}>
                                                    {item.nome}
                                                    {item.status && item.status !== "Working" && item.status !== "Offline" && (
                                                        <span className="ml-2 text-[10px] bg-red-900/30 text-red-400 px-1 py-0.5 rounded border border-red-900/50">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-400">{item.serial}</TableCell>
                                                <TableCell className={`text-right ${formatarSinalClass(item.sinal, item.status || "")}`} title={item.horarioQueda ? `Queda: ${item.horarioQueda}` : item.status}>
                                                    {item.sinal === 0 ? "LOS" : item.sinal}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Tabela Atualizada */}
                    <Card className="bg-slate-900 border-slate-800 flex flex-col h-[600px]">
                        <CardHeader className="py-4 border-b border-slate-800 bg-slate-950/20">
                            <CardTitle className="text-lg flex justify-between items-center text-blue-400">
                                <span>Dados Atualizados</span>
                                <span className="text-sm font-normal text-slate-500">
                                    {filtrarDados(dadosAtualizados).length} clientes
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1 custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-950/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Serial</TableHead>
                                        <TableHead className="text-right">Sinal (Rx)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {atualizando ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-500/50" />
                                                Atualizando leitura óptica...
                                            </TableCell>
                                        </TableRow>
                                    ) : dadosAtualizados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                Clique em "Atualizar Dados" para ver o comparativo.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtrarDados(dadosAtualizados).map((item) => (
                                            <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-400">{item.id}</TableCell>
                                                <TableCell className="truncate max-w-[150px]" title={item.nome}>
                                                    {item.nome}
                                                    {item.status && item.status !== "Working" && item.status !== "Offline" && (
                                                        <span className="ml-2 text-[10px] bg-red-900/30 text-red-400 px-1 py-0.5 rounded border border-red-900/50">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-400">{item.serial}</TableCell>
                                                <TableCell className={`text-right ${formatarSinalClass(item.sinal, item.status || "")}`} title={item.horarioQueda ? `Queda: ${item.horarioQueda}` : item.status}>
                                                    {item.sinal === 0 ? "LOS" : item.sinal}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
