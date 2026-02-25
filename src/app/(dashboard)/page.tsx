import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default async function GeneralDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get("cnm_token")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await verifyToken(token);
    if (!payload) {
        redirect("/login");
    }

    // Se for administrador, é mais útil pular direto pro painel principal
    if (payload.isAdmin) {
        redirect("/admin");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 mb-6">
                <ShieldCheck className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                Ambiente Seguro
            </h1>
            <p className="text-slate-400 max-w-md mx-auto text-lg">
                Sua credencial foi autenticada. Utilize o menu lateral para acessar os portais e sistemas liberados para o seu grupo.
            </p>
        </div>
    );
}
