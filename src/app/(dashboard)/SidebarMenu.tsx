"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, LogOut, LayoutDashboard, Link2, Users, Settings, PlusCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AccessProps = {
    isAdmin: boolean;
    links: { id: string; name: string; url: string; openInNewTab: boolean }[];
};

export default function SidebarMenu({ access, email }: { access: AccessProps, email: string }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <aside
            className={`relative flex flex-col transition-all duration-300 ease-in-out bg-slate-950 border-r border-slate-800 ${collapsed ? "w-20" : "w-64"
                }`}
        >
            <div className="flex h-16 items-center px-4 border-b border-slate-800 shrink-0 justify-between">
                <Link href="/" className={`flex items-center gap-3 overflow-hidden ${collapsed ? "justify-center w-full" : ""}`}>
                    <div className="h-8 w-8 bg-blue-600/20 rounded border border-blue-500/30 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </div>
                    {!collapsed && <span className="font-bold text-sm tracking-tight text-white truncate">CN Manager</span>}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-5 bg-slate-800 border-slate-700 border rounded-full p-1 text-slate-400 hover:text-white"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">

                {/* User Specific Links */}
                <div>
                    {!collapsed && <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aplicações</div>}
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

                {/* Admin Links */}
                {access.isAdmin && (
                    <div>
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

            <div className="p-4 border-t border-slate-800">
                {!collapsed && <div className="text-xs text-slate-500 truncate mb-3 px-1">{email}</div>}
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
