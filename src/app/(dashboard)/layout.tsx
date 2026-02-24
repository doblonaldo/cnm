import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import SidebarMenu from "./SidebarMenu";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("cnm_token")?.value;
    let userAccess: { isAdmin: boolean; links: { id: string; name: string; url: string; openInNewTab: boolean }[] } = {
        isAdmin: false,
        links: [],
    };
    let userEmail = "";

    if (token) {
        const payload = await verifyToken(token);
        if (payload?.groupId && payload?.email) {
            userEmail = payload.email;

            const group = await prisma.group.findUnique({
                where: { id: payload.groupId },
                include: {
                    groupLinks: {
                        include: { link: true },
                    },
                },
            });

            if (group) {
                userAccess.isAdmin = group.name === "Administrador";
                userAccess.links = group.groupLinks.map((gl) => gl.link);
            }
        }
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            <SidebarMenu access={userAccess} email={userEmail} />
            <main className="flex-1 overflow-hidden relative border-l border-slate-800 bg-black">
                {children}
            </main>
        </div>
    );
}
