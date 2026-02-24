"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Shield, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Criar Grupo
    const [newGroupName, setNewGroupName] = useState("");
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Criar Link
    const [newLinkName, setNewLinkName] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [creatingLink, setCreatingLink] = useState(false);

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

    async function handleCreateGroup(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch("/api/admin/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName }),
            });

            if (!res.ok) throw new Error("Erro ao criar grupo");

            toast.success("Grupo criado!");
            setDialogOpen(false);
            setNewGroupName("");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreating(false);
        }
    }

    async function handleCreateLink(e: React.FormEvent) {
        e.preventDefault();
        setCreatingLink(true);

        try {
            const res = await fetch("/api/admin/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newLinkName, url: newLinkUrl }),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Erro ao criar Link");
            }

            toast.success("Link Seguro criado!");
            setLinkDialogOpen(false);
            setNewLinkName("");
            setNewLinkUrl("");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreatingLink(false);
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

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Novo Grupo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>Criar Grupo</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateGroup} className="space-y-4 pt-4">
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
                                    {creating ? "Criando..." : "Criar Grupo"}
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
                                        {g.name !== "Administrador" ? (
                                            <Button variant="outline" size="sm" onClick={() => openPermissionsDialog(g)} className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800">
                                                Gerenciar Acessos
                                            </Button>
                                        ) : (
                                            <span className="text-slate-500 text-sm italic mr-2">Acesso Irrestrito (Bypass)</span>
                                        )}
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

                    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Novo Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>Cadastrar uma Nova URL Protegida</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateLink} className="space-y-4 pt-4">
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
                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={creatingLink}>
                                    {creatingLink ? "Salvando..." : "Salvar Link Padrão"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map(link => (
                        <div key={link.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-white">{link.name}</h3>
                                <Link2 className="w-4 h-4 text-slate-500" />
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
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {links.length === 0 ? (
                            <p className="text-slate-500 py-4">Não há links cadastrados no sistema.</p>
                        ) : (
                            links.map(link => {
                                const isChecked = groupLinks.includes(link.id);
                                return (
                                    <div key={link.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                                        <div>
                                            <p className="font-medium text-slate-200">{link.name}</p>
                                            <p className="text-xs text-slate-500 truncate w-[300px]">{link.url}</p>
                                        </div>
                                        <Switch
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                if (checked) setGroupLinks([...groupLinks, link.id]);
                                                else setGroupLinks(groupLinks.filter(id => id !== link.id));
                                            }}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
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
