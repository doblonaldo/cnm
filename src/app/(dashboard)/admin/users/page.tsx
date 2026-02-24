"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, CircleCheck, CircleDashed, MailWarning } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite form
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteGroup, setInviteGroup] = useState("");
    const [inviting, setInviting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [uRes, gRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/groups")
            ]);
            setUsers(await uRes.json());
            setGroups(await gRes.json());
        } catch (err) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setInviting(true);

        try {
            const res = await fetch("/api/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, groupId: inviteGroup }),
            });

            if (!res.ok) throw new Error("Erro ao enviar convite");

            const data = await res.json();
            toast.success("Convite gerado/enviado com sucesso!");
            console.log("Mock Link for Testing:", data.mockLink); // Apenas pro teste local

            setDialogOpen(false);
            setInviteEmail("");
            setInviteGroup("");
            fetchData(); // Atualiza a lista
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setInviting(false);
        }
    }

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Usuários</h1>
                    <p className="text-slate-400">Gerencie acessos e envie convites (Onboarding).</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Convidar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Novo Convite</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>E-mail Corporativo</Label>
                                <Input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-slate-950 border-slate-800"
                                    placeholder="usuario@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Grupo de Permissão</Label>
                                <Select required value={inviteGroup} onValueChange={setInviteGroup}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800">
                                        <SelectValue placeholder="Selecione um grupo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        {groups.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={inviting}>
                                {inviting ? "Enviando..." : "Gerar Link e Enviar Convite"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                <Table>
                    <TableHeader className="bg-slate-950">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400">Usuário</TableHead>
                            <TableHead className="text-slate-400">Grupo</TableHead>
                            <TableHead className="text-slate-400 text-center">Status Onboarding</TableHead>
                            <TableHead className="text-slate-400 text-center">Status Acesso</TableHead>
                            <TableHead className="text-slate-400 text-right">Cadastrado em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500 py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500 py-8">Nenhum usuário encontrado</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-200">{user.email}</TableCell>
                                    <TableCell className="text-slate-400">{user.group?.name || "Sem Grupo"}</TableCell>
                                    <TableCell className="text-center">
                                        {user.inviteStatus === "COMPLETED" ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                                                <CircleCheck className="w-3 h-3" /> Concluído
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                                                <MailWarning className="w-3 h-3" /> Pendente
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {user.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">
                                                <CircleCheck className="w-3 h-3" /> Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                                <CircleDashed className="w-3 h-3" /> Inativo
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
