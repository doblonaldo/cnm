"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleCompleteInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (password.length < 8) {
            toast.error("Sua senha deve ter no mínimo 8 caracteres");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/invites/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Token inválido ou expirado");
            }

            setSuccess(true);
            toast.success("Conta ativada com sucesso!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-slate-800 bg-slate-900 justify-center flex flex-col items-center py-12 px-4 shadow-2xl">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-6" />
                    <CardTitle className="text-2xl font-bold text-white mb-2">Conta Pronta!</CardTitle>
                    <CardDescription className="text-slate-400 text-center mb-8">
                        Sua senha foi configurada e sua conta CNM já está ativa.
                    </CardDescription>
                    <Button onClick={() => router.push("/login")} className="bg-emerald-600 hover:bg-emerald-700 w-full text-white">
                        Fazer Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                <CardHeader className="space-y-3 pb-6 border-b border-slate-800 mb-6">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                            <KeyRound className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold tracking-tight">
                        Finalize seu Cadastro
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400 px-4">
                        Você foi convidado para o Central Network Manager. Defina sua senha de acesso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCompleteInvite} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-slate-300">Confirme a Senha</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                            disabled={loading}
                        >
                            {loading ? "Ativando conta..." : "Definir Senha e Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
