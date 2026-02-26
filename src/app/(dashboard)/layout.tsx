import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import SidebarMenu from "./SidebarMenu";
import { TermsPopup } from "@/components/TermsPopup";

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
    let forceTermsPopup = false;

    if (token) {
        const payload = await verifyToken(token);
        // userId must exist in a valid token now
        if (payload?.userId && payload?.email) {
            userEmail = payload.email;

            // Fetch the user to check terms acceptance status
            const user = await prisma.user.findUnique({
                where: { id: payload.userId as string },
                include: {
                    group: {
                        include: {
                            groupLinks: {
                                include: { link: true },
                            }
                        }
                    }
                }
            });

            if (user) {
                if (!user.hasAcceptedTerms) {
                    forceTermsPopup = true;
                }

                if (user.group) {
                    userAccess.isAdmin = user.group.name === "Administrador";
                    if (userAccess.isAdmin) {
                        userAccess.links = await prisma.link.findMany({
                            orderBy: { name: 'asc' }
                        });
                    } else {
                        userAccess.links = user.group.groupLinks.map((gl) => gl.link);
                    }
                }
            }
        }
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            <SidebarMenu access={userAccess} email={userEmail} />
            <main className="flex-1 overflow-hidden relative border-l border-slate-800 bg-black">
                {children}
            </main>

            {forceTermsPopup && <TermsPopup open={true} />}
        </div>
    );
}
