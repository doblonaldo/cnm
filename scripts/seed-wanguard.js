const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Wanguard seed script...");

    try {
        // Step 1: Create the Link (if not exists)
        let wanguardLink = await prisma.link.findFirst({
            where: { url: '/apps/wanguard' }
        });

        if (!wanguardLink) {
            console.log("Creating Wanguard link...");
            wanguardLink = await prisma.link.create({
                data: {
                    name: 'Wanguard',
                    url: '/apps/wanguard',
                    type: 'LOCAL',
                    openInNewTab: false
                }
            });
            console.log("Wanguard link created with ID:", wanguardLink.id);
        } else {
            console.log("Wanguard link already exists, updating type to LOCAL...");
            wanguardLink = await prisma.link.update({
                where: { id: wanguardLink.id },
                data: { type: 'LOCAL' }
            });
            console.log("Wanguard link updated.");
        }

        // Step 2: Assign to default 'Admin' group if it exists
        const adminGroup = await prisma.group.findFirst({
            where: { name: { in: ['Admin', 'Administradores'] } } // Try to find a standard admin group
        });

        if (adminGroup) {
            // Check if it's already linked
            const existingRelation = await prisma.groupLink.findFirst({
                where: {
                    groupId: adminGroup.id,
                    linkId: wanguardLink.id
                }
            });

            if (!existingRelation) {
                console.log(`Linking Wanguard to group ${adminGroup.name}...`);
                await prisma.groupLink.create({
                    data: {
                        groupId: adminGroup.id,
                        linkId: wanguardLink.id
                    }
                });
                console.log("Successfully linked.");
            } else {
                console.log("Wanguard already linked to Admin group.");
            }
        } else {
            console.log("Admin group not found. Skipping auto-assign. Please configure manually via the Groups panel.");
        }

        // Step 3: Seed Wanguard AppSettings from .env
        const wanguardHost = process.env.WANGUARD_API_HOST;
        const wanguardUser = process.env.WANGUARD_API_USER;
        const wanguardPassword = process.env.WANGUARD_API_PASSWORD;

        if (wanguardHost || wanguardUser || wanguardPassword) {
            console.log("Seeding Wanguard Settings from Environment Variables...");
            let settings = await prisma.appSetting.findUnique({
                where: { id: "singleton" }
            });

            if (!settings) {
                await prisma.appSetting.create({
                    data: {
                        id: "singleton",
                        wanguardHost: wanguardHost || null,
                        wanguardUser: wanguardUser || null,
                        wanguardPassword: wanguardPassword || null,
                    }
                });
            } else {
                await prisma.appSetting.update({
                    where: { id: "singleton" },
                    data: {
                        wanguardHost: wanguardHost || settings.wanguardHost,
                        wanguardUser: wanguardUser || settings.wanguardUser,
                        wanguardPassword: wanguardPassword || settings.wanguardPassword,
                    }
                });
            }
            console.log("Wanguard AppSettings seeded successfully.");
        }

    } catch (e) {
        console.error("Error during Wanguard seed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
