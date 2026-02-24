import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("logo") as File;

        if (!file) {
            return NextResponse.json({ error: "Nenhuma imagem foi enviada." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Caminho absoluto para a pasta public do Next.js
        const publicDir = path.join(process.cwd(), "public");
        const filePath = path.join(publicDir, "logo.png");

        await fs.writeFile(filePath, buffer);

        return NextResponse.json({ message: "Logo atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar a logo:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
