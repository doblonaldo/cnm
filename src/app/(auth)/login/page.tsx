"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState("/logo.png");

    useEffect(() => {
        setLogoUrl(`/logo.png?v=${Date.now()}`);

        // Handle OAuth error messages from the URL
        const error = searchParams?.get("error");
        if (error) {
            let errorMsg = "Ocorreu um erro na autenticação.";
            if (error === "DOMAIN_NOT_ALLOWED") errorMsg = "O e-mail utilizado não pertence a esta organização.";
            if (error === "SSO_NOT_CONFIGURED") errorMsg = "O Login com Google não está configurado no servidor.";
            if (error === "INACTIVE_ACCOUNT") errorMsg = "Sua conta foi desativada pelo administrador.";
            if (error === "OAUTH_NO_CODE" || error === "OAUTH_TOKEN_FAILED" || error === "OAUTH_PROFILE_FAILED") errorMsg = "Falha ao se comunicar com os servidores do Google.";

            // Clean up URL without reloading
            router.replace("/login");
            setTimeout(() => toast.error(errorMsg), 100);
        }
    }, [searchParams, router]);

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
            router.push("/"); // Dashboard Raíz (Trata isAdmin internamente)
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="space-y-3 pb-6 border-b border-slate-800/50 bg-slate-900/50">
                <div className="flex justify-center mb-2">
                    <img
                        src={logoUrl}
                        alt="Logo CNM"
                        className="h-32 w-32 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                        }}
                    />
                    <div className="h-32 w-32 bg-blue-600/20 rounded-full hidden items-center justify-center border border-blue-500/30">
                        <ShieldCheck className="h-16 w-16 text-blue-500" />
                    </div>
                </div>
                <CardTitle className="text-2xl text-center font-bold tracking-tight">
                    Central Network Manager
                </CardTitle>
                <CardDescription className="text-center text-slate-400">
                    Insira suas credenciais abaixo ou use o login corporativo.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nome@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 text-slate-100"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 text-slate-100"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        disabled={loading}
                    >
                        {loading ? "Autenticando..." : "Entrar com Senha Local"}
                    </Button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-3 text-slate-500 font-medium">Ou continuar com SSO</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 border-0 font-medium h-11"
                    onClick={() => {
                        setLoading(true);
                        window.location.href = "/api/auth/google";
                    }}
                    disabled={loading}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google Workspace
                </Button>
            </CardContent>
            <CardFooter className="flex justify-center text-xs text-slate-500 py-4 bg-slate-900/50">
                <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-500/80" />
                    <span>Conexão corporativa criptografada.</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-slate-400">Carregando painel de acesso...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
