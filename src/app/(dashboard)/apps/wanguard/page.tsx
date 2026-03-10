"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Search, RefreshCw, Network } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Using Recharts for Sankey Graph (since Recharts has a Sankey Component)
import { Sankey, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type FlowDetail = {
    id: number;
    interface: string;
    asn: string;
    mbps: number;
    status: string;
};

type SankeyData = {
    nodes: { name: string }[];
    links: { source: number; target: number; value: number }[];
};

export default function WanguardFlowPage() {
    const [asn, setAsn] = useState<string>("");
    const [loading, setLoading] = useState(false);
    
    const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
    const [flowDetails, setFlowDetails] = useState<FlowDetail[]>([]);

    const handleConsultar = async () => {
        if (!asn || isNaN(Number(asn))) {
            toast.error("Por favor, informe um Número de AS válido (ex: 15169).");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/apps/wanguard/flow?asn=${asn}`);
            if (!res.ok) {
                const errorData = await res.json();
                toast.error(`${errorData.error || "Tente novamente."}`);
                setLoading(false);
                return;
            }

            const data = await res.json();
            
            if (data.details.length === 0) {
                toast.warning("Nenhum tráfego detectado para este AS no momento.");
            } else {
                setSankeyData(data.sankey);
                setFlowDetails(data.details);
                toast.success("Fluxo de Tráfego Mapeado!");
            }
        } catch (error) {
            toast.error("Erro ao conectar à API do Wanguard interno.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleConsultar();
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar bg-slate-950 text-slate-200 min-h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex gap-3 items-center">
                        <Network className="w-8 h-8 text-green-500" />
                        Wanguard Flow AS
                    </h1>
                    <p className="text-muted-foreground mt-1">Investigue o tráfego dos Autonomus Systems mapeando de onde o conteúdo está sendo originado (Peering/Transit).</p>
                </div>
            </div>

            <Alert variant="default" className="bg-green-950/20 border-green-900/50 shrink-0">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-400">Análise Visual de Rotas</AlertTitle>
                <AlertDescription className="text-green-200/70 text-sm mt-2">
                    Digite o ASN (ex: Google AS15169) para desenhar o diagrama de transferência Sankey, demonstrando instantaneamente quais interfaces e roteadores estão sugando a maior taxa desse bloco e a medição em tempo real.
                </AlertDescription>
            </Alert>

            <Card className="bg-slate-900 border-slate-800 shrink-0">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-200">Pesquisa de AS</CardTitle>
                    <CardDescription className="text-slate-400">Defina o Autonomous System a investigar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2 w-64">
                            <label className="text-sm font-medium text-slate-300">ASN (Apenas Números)</label>
                            <Input 
                                placeholder="Ex: 15169" 
                                value={asn}
                                onChange={(e) => setAsn(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                className="bg-slate-950 border-slate-700 text-white focus:border-green-500"
                            />
                        </div>

                        <Button 
                            onClick={handleConsultar} 
                            disabled={loading} 
                            className="bg-green-600 hover:bg-green-700 text-white gap-2 w-32"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Consultar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {sankeyData && flowDetails.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[500px]">
                    
                    {/* Gráfico Sankey Visual */}
                    <Card className="bg-slate-900 border-slate-800 flex flex-col h-full xl:col-span-2">
                        <CardHeader className="py-2 px-4 border-b border-slate-800">
                            <CardTitle className="text-base text-slate-200">
                                Grafo de Escoamento (Sankey Flow Chart)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 relative">
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
                                    <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height={400}>
                                <Sankey
                                    data={sankeyData}
                                    nodePadding={50}
                                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                                    link={{ stroke: '#22c55e', strokeOpacity: 0.3 }}
                                >
                                    <RechartsTooltip 
                                        wrapperClassName="!bg-slate-950 !border-slate-800 !text-white !rounded-lg !shadow-xl"
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </Sankey>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Tabela de Detalhes Analítica */}
                    <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
                        <CardHeader className="py-2 px-4 border-b border-slate-800 bg-slate-950/20">
                            <CardTitle className="text-base flex justify-between items-center text-green-400">
                                <span>Detalhamento por Interface</span>
                                <span className="text-sm font-normal text-slate-400">
                                    {flowDetails.length} rotas
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1 custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-950/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow className="border-slate-800 hover:bg-transparent text-slate-300">
                                        <TableHead className="text-slate-300">Destino</TableHead>
                                        <TableHead className="w-20 text-right text-slate-300">Mbps</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flowDetails.sort((a,b) => b.mbps - a.mbps).map((item) => (
                                        <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-slate-200">
                                                {item.interface}
                                                {item.status === "High" && (
                                                    <span className="ml-2 text-[10px] bg-amber-900/30 text-amber-500 px-1 py-0.5 rounded border border-amber-900/50">
                                                        Alto Tráfego
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-green-400 font-mono font-semibold">
                                                {item.mbps}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            )}
        </div>
    );
}
