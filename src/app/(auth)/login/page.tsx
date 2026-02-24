"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error("Credenciais inválidas ou conta inativa");
            }

            toast.success("Login realizado com sucesso!");
            router.push("/admin"); // Ou outra rota inicial do dashboard
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
                <CardHeader className="space-y-3 pb-6">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                            <ShieldCheck className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold tracking-tight">
                        Central Network Manager
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Acesso Restrito
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? "Autenticando..." : "Entrar no Portal"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-slate-500 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Esta conexão é segura e monitorada.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
