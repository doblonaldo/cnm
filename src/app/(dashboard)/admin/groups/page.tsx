"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Shield, Link2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Criar/Editar Grupo
    const [newGroupName, setNewGroupName] = useState("");
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

    // Gerenciar Links
    const [newLinkName, setNewLinkName] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [newLinkOpenInNewTab, setNewLinkOpenInNewTab] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [creatingLink, setCreatingLink] = useState(false);
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

    // Gerenciar Acessos
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [groupLinks, setGroupLinks] = useState<string[]>([]);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [gRes, lRes] = await Promise.all([
                fetch("/api/admin/groups").then(r => r.json()),
                fetch("/api/admin/links").then(r => r.json())
            ]);
            setGroups(gRes);
            setLinks(lRes);
        } catch (err) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveGroup(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);

        const url = editingGroupId ? `/api/admin/groups/${editingGroupId}` : "/api/admin/groups";
        const method = editingGroupId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName }),
            });

            if (!res.ok) throw new Error(editingGroupId ? "Erro ao atualizar grupo" : "Erro ao criar grupo");

            toast.success(editingGroupId ? "Grupo atualizado!" : "Grupo criado!");
            setDialogOpen(false);
            setNewGroupName("");
            setEditingGroupId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleteGroup(id: string, name: string) {
        if (name === "Administrador") {
            toast.error("O grupo Administrador não pode ser excluído.");
            return;
        }
        if (!confirm(`Tem certeza que deseja excluir o grupo ${name}?`)) return;

        try {
            const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao excluir grupo");
            }
            toast.success("Grupo excluído com sucesso!");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    async function handleSaveLink(e: React.FormEvent) {
        e.preventDefault();
        setCreatingLink(true);

        const url = editingLinkId ? `/api/admin/links/${editingLinkId}` : "/api/admin/links";
        const method = editingLinkId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newLinkName, url: newLinkUrl, openInNewTab: newLinkOpenInNewTab }),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Erro ao salvar Link");
            }

            toast.success(editingLinkId ? "Link atualizado com sucesso!" : "Link Seguro criado!");
            setLinkDialogOpen(false);
            setNewLinkName("");
            setNewLinkUrl("");
            setNewLinkOpenInNewTab(false);
            setEditingLinkId(null);
            fetchData();
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreatingLink(false);
        }
    }

    async function handleDeleteLink(id: string, name: string) {
        if (!confirm(`Tem certeza que deseja excluir o link ${name}? Isso removerá o acesso de todos os grupos.`)) return;
        try {
            const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Erro ao excluir Link");
            }
            toast.success("Link excluído com sucesso!");
            fetchData();
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    function openPermissionsDialog(group: any) {
        // Array com IDs dos links q o grupo já tem
        const activeLinkIds = group.groupLinks ? group.groupLinks.map((gl: any) => gl.linkId) : [];
        setSelectedGroup(group);
        setGroupLinks(activeLinkIds);
        setPermissionsDialogOpen(true);
    }

    async function handleSavePermissions() {
        if (!selectedGroup) return;

        try {
            const res = await fetch("/api/admin/group-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: selectedGroup.id, linkIds: groupLinks }),
            });

            if (!res.ok) throw new Error("Erro ao salvar permissões");

            toast.success("Permissões atualizadas com sucesso!");
            setPermissionsDialogOpen(false);
            fetchData();
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-full">

            {/* SEÇÃO GRUPOS */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-500" />
                            Grupos (RBAC)
                        </h2>
                        <p className="text-slate-400">Gerencie roles e atribuição de visibilidade.</p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                            setEditingGroupId(null);
                            setNewGroupName("");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Novo Grupo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>{editingGroupId ? "Editar Grupo" : "Criar Grupo"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveGroup} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Nome do Grupo</Label>
                                    <Input
                                        required
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="bg-slate-950 border-slate-800"
                                        placeholder="Ex: Financeiro, Marketing..."
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={creating}>
                                    {creating ? "Salvando..." : (editingGroupId ? "Salvar Alterações" : "Criar Grupo")}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900 mb-8">
                    <Table>
                        <TableHeader className="bg-slate-950">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-400">Nome do Grupo</TableHead>
                                <TableHead className="text-slate-400 text-center">Membros</TableHead>
                                <TableHead className="text-slate-400 text-center">Links Atribuídos</TableHead>
                                <TableHead className="text-slate-400 text-right">Acesso / Permissões</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : groups.map((g) => (
                                <TableRow key={g.id} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-200">{g.name} {g.name === "Administrador" && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full ml-2 uppercase font-bold tracking-wider">SuperAdmin</span>}</TableCell>
                                    <TableCell className="text-center text-slate-400">{g._count?.users || 0}</TableCell>
                                    <TableCell className="text-center text-slate-400">{g._count?.groupLinks || 0} acessos</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {g.name !== "Administrador" ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => openPermissionsDialog(g)} className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800">
                                                        Acessos
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-800" onClick={() => {
                                                        setEditingGroupId(g.id);
                                                        setNewGroupName(g.name);
                                                        setDialogOpen(true);
                                                    }}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800" onClick={() => handleDeleteGroup(g.id, g.name)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-slate-500 text-sm italic mr-2">Bypass Integrado</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* SEÇÃO LINKS */}
            <div>
                <div className="flex justify-between items-center mb-6 pt-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Link2 className="w-6 h-6 text-purple-500" />
                            Aplicações (Links)
                        </h2>
                        <p className="text-slate-400">Cadastre as URLs que rodarão em Sandbox no Portal.</p>
                    </div>

                    <Dialog open={linkDialogOpen} onOpenChange={(open) => {
                        setLinkDialogOpen(open);
                        if (!open) {
                            setEditingLinkId(null);
                            setNewLinkName("");
                            setNewLinkUrl("");
                            setNewLinkOpenInNewTab(false);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Novo Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>{editingLinkId ? "Editar Link Seguro" : "Cadastrar uma Nova URL Protegida"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveLink} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Nome de Exibição</Label>
                                    <Input
                                        required
                                        value={newLinkName}
                                        onChange={(e) => setNewLinkName(e.target.value)}
                                        className="bg-slate-950 border-slate-800"
                                        placeholder="Ex: Grafana Dashboards"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL de Destino</Label>
                                    <Input
                                        type="url"
                                        required
                                        value={newLinkUrl}
                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                        className="bg-slate-950 border-slate-800 text-blue-400"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="flex items-center justify-between border border-slate-800 p-3 rounded-lg bg-slate-950/50">
                                    <div className="space-y-0.5">
                                        <Label>Abrir em Nova Guia</Label>
                                        <p className="text-xs text-slate-500">Ao invés de carregar no Portal (Iframe)</p>
                                    </div>
                                    <Switch
                                        checked={newLinkOpenInNewTab}
                                        onCheckedChange={setNewLinkOpenInNewTab}
                                        className="data-[state=checked]:bg-purple-600"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={creatingLink}>
                                    {creatingLink ? "Salvando..." : (editingLinkId ? "Atualizar Link" : "Salvar Link Padrão")}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map(link => (
                        <div key={link.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900 group">
                            <div className="flex items-start justify-between mb-2 gap-2">
                                <h3 className="font-semibold text-white truncate h-6">{link.name}</h3>
                                <div className="flex items-center space-x-1 shrink-0">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-blue-400" onClick={() => {
                                        setEditingLinkId(link.id);
                                        setNewLinkName(link.name);
                                        setNewLinkUrl(link.url);
                                        setNewLinkOpenInNewTab(link.openInNewTab);
                                        setLinkDialogOpen(true);
                                    }}>
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-red-400" onClick={() => handleDeleteLink(link.id, link.name)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                    {link.openInNewTab && <span className="text-[10px] bg-slate-800 text-slate-400 px-1 hover:text-white rounded w-fit ml-2 uppercase" title="Abre em nova guia">Ext</span>}
                                    <Link2 className="w-4 h-4 text-slate-500 ml-1" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 truncate w-full" title={link.url}>{link.url}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL DE PERMISSÕES DO GRUPO */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl">
                            Gerenciar acessos do Grupo: <span className="text-blue-400">{selectedGroup?.name}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {links.length === 0 ? (
                            <p className="text-slate-500 py-4 col-span-full">Não há links cadastrados no sistema.</p>
                        ) : (
                            links.map(link => {
                                const isChecked = groupLinks.includes(link.id);
                                return (
                                    <div key={link.id} className={`flex flex-col p-4 rounded-xl border transition-colors ${isChecked ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'}`}>
                                        <div className="flex items-center mb-3 gap-2">
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                <Link2 className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold text-white truncate" title={link.name}>{link.name}</p>
                                            </div>
                                            <Switch
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setGroupLinks([...groupLinks, link.id]);
                                                    else setGroupLinks(groupLinks.filter(id => id !== link.id));
                                                }}
                                                className="data-[state=checked]:bg-emerald-500 shrink-0"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 truncate w-full" title={link.url}>{link.url}</p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setPermissionsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePermissions} className="bg-emerald-600 hover:bg-emerald-700 text-white">Aplicar Permissões</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
