"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, LogOut, LayoutDashboard, Link2, Users, Settings, PlusCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, KeyRound, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AccessProps = {
    isAdmin: boolean;
    links: { id: string; name: string; url: string; openInNewTab: boolean }[];
};

export default function SidebarMenu({ access, email }: { access: AccessProps, email: string }) {
    const [collapsed, setCollapsed] = useState(false);
    const [logoUrl, setLogoUrl] = useState("/logo.png");
    const pathname = usePathname();
    const router = useRouter();

    const [openAccordion, setOpenAccordion] = useState<"atalhos" | "aplicacoes" | null>(null);

    // Bypass cache após a montagem inicial no cliente (evita Hydration Error)
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        setLogoUrl(`/logo.png?v=${Date.now()}`);
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        try {
            const res = await fetch("/api/auth/me/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao alterar senha.");
                return;
            }

            toast.success("Senha alterada com sucesso!");
            setPasswordModalOpen(false);
            setCurrentPassword("");
            setNewPassword("");
        } catch (error) {
            toast.error("Ocorreu um erro interno. Tente novamente.");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <aside
            className={`relative flex flex-col transition-all duration-300 ease-in-out bg-slate-950 border-r border-slate-800 ${collapsed ? "w-20" : "w-64"
                }`}
        >
            <div className="flex h-40 items-center px-4 border-b border-slate-800 shrink-0 relative">
                <Link href="/" className="flex items-center gap-3 overflow-hidden justify-center w-full">
                    <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-32 w-32 object-contain shrink-0"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                        }}
                    />
                    <div className="h-32 w-32 bg-blue-600/20 rounded border border-blue-500/30 hidden items-center justify-center shrink-0 text-blue-500">
                        <ShieldCheck className="h-20 w-20" />
                    </div>
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-16 bg-slate-800 border-slate-700 border rounded-full p-1 text-slate-400 hover:text-white"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col py-4 px-3 gap-6">

                {/* Accordion Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">

                    {/* Accordion 1 - Atalhos de Links */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => setOpenAccordion(openAccordion === 'atalhos' ? null : 'atalhos')}
                            className={`flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${openAccordion === 'atalhos' ? "text-slate-300" : "text-slate-500 hover:text-slate-400"} ${collapsed ? "justify-center" : "justify-between"}`}
                            title="Atalhos de Links"
                        >
                            {!collapsed ? (
                                <>
                                    <span>Atalhos de Links</span>
                                    {openAccordion === 'atalhos' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </>
                            ) : (
                                <Link2 className="w-5 h-5" />
                            )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'atalhos' ? 'max-h-[1000px] mt-2' : 'max-h-0'}`}>
                            <nav className="space-y-1">
                                {access.links.length === 0 ? (
                                    <div className={`text-slate-500 text-sm px-3 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                                        <AlertCircle className="w-4 h-4" />
                                        {!collapsed && "Nenhum link ativo"}
                                    </div>
                                ) : (
                                    access.links.map((link) => {
                                        const href = link.openInNewTab ? link.url : `/portal/${link.id}`;
                                        const isActive = !link.openInNewTab && pathname.startsWith(`/portal/${link.id}`);
                                        return (
                                            <Link
                                                key={link.id}
                                                href={href}
                                                target={link.openInNewTab ? "_blank" : undefined}
                                                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                                                onClick={() => {
                                                    if (link.openInNewTab) {
                                                        router.push(`/portal/${link.id}`);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                                    ? "bg-blue-600/10 text-blue-400 font-medium"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                                                    } ${collapsed ? "justify-center" : ""}`}
                                            >
                                                <Link2 className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-500" : "text-slate-500"}`} />
                                                {!collapsed && <span className="truncate">{link.name}</span>}
                                            </Link>
                                        );
                                    })
                                )}
                            </nav>
                        </div>
                    </div>

                    {/* Accordion 2 - Aplicações Internas */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => setOpenAccordion(openAccordion === 'aplicacoes' ? null : 'aplicacoes')}
                            className={`flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${openAccordion === 'aplicacoes' ? "text-slate-300" : "text-slate-500 hover:text-slate-400"} ${collapsed ? "justify-center" : "justify-between"}`}
                            title="Aplicações"
                        >
                            {!collapsed ? (
                                <>
                                    <span>Aplicações</span>
                                    {openAccordion === 'aplicacoes' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </>
                            ) : (
                                <Blocks className="w-5 h-5" />
                            )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'aplicacoes' ? 'max-h-[1000px] mt-2' : 'max-h-0'}`}>
                            <nav className="space-y-1">
                                <div className={`text-slate-500 text-sm px-3 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                                    <AlertCircle className="w-4 h-4" />
                                    {!collapsed && "Nenhuma aplicação instalada"}
                                </div>
                            </nav>
                        </div>
                    </div>

                </div>

                {/* Admin Links */}
                {access.isAdmin && (
                    <div className="shrink-0 mt-auto">
                        {!collapsed && <div className="px-3 mb-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administração</div>}
                        <nav className="space-y-1">
                            {[
                                { name: "Painel Geral", href: "/admin", icon: LayoutDashboard },
                                { name: "Usuários", href: "/admin/users", icon: Users },
                                { name: "Grupos e Links", href: "/admin/groups", icon: Settings },
                                { name: "Auditoria", href: "/admin/logs", icon: ShieldCheck },
                            ].map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                            ? "bg-emerald-500/10 text-emerald-400 font-medium"
                                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                                            } ${collapsed ? "justify-center" : ""}`}
                                    >
                                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-500" : "text-slate-500"}`} />
                                        {!collapsed && <span className="truncate">{item.name}</span>}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )}

            </div>

            <div className={`p-4 border-t border-slate-800 flex flex-col gap-2`}>
                {!collapsed && <div className="text-xs text-slate-500 truncate mb-1 px-1">{email}</div>}

                {/* Alterar Senha Modal */}
                <Dialog open={isPasswordModalOpen} onOpenChange={setPasswordModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className={`w-full bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white ${collapsed ? "px-0 justify-center" : "justify-start"}`}
                        >
                            <KeyRound className={`w-4 h-4 ${!collapsed ? "mr-2" : ""}`} />
                            {!collapsed && <span>Alterar Senha</span>}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 text-white border-slate-800 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Alterar Senha</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Digite sua senha atual e a nova senha que deseja utilizar para o acesso.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleChangePassword}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Senha Atual</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-slate-950 border-slate-800 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nova Senha</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-slate-950 border-slate-800 text-white"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={changingPassword} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                    {changingPassword ? "Alterando..." : "Confirmar Alteração"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sair */}
                <Button
                    variant="outline"
                    className={`w-full bg-transparent border-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 ${collapsed ? "px-0 justify-center" : "justify-start"}`}
                    onClick={handleLogout}
                >
                    <LogOut className={`w-4 h-4 ${!collapsed ? "mr-2" : ""}`} />
                    {!collapsed && <span>Sair do CNM</span>}
                </Button>
            </div>
        </aside>
    );
}
