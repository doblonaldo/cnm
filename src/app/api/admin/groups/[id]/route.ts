import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Atualizar Grupo
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name } = await req.json();

        if (!id || !name) {
            return NextResponse.json({ error: "ID and Name are required." }, { status: 400 });
        }

        const updatedGroup = await prisma.group.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(updatedGroup);
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
            return NextResponse.json({ error: "Group name already exists" }, { status: 400 });
        }
        console.error("Update Group Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Excluir Grupo
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID is required." }, { status: 400 });
        }

        // Recupera o grupo pra ver se é o Administrador
        const group = await prisma.group.findUnique({ where: { id } });
        if (!group) {
            return NextResponse.json({ error: "Group not found." }, { status: 404 });
        }
        if (group.name === "Administrador") {
            return NextResponse.json({ error: "Cannot delete the Administrator group." }, { status: 403 });
        }

        // Opcional: remover relações primeiro ou cascade cuidará? 
        // No schema, cascade está ativo para GroupLink. Para Users, vamos mover para nulo ou proibir?
        // Como User.groupId é obrigatório (String), não tem cascade. Temos que checar se há usuários.
        const usersInGroup = await prisma.user.count({ where: { groupId: id } });
        if (usersInGroup > 0) {
            return NextResponse.json({ error: "Cannot delete group because there are users associated with it." }, { status: 400 });
        }

        await prisma.group.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Delete Group Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
