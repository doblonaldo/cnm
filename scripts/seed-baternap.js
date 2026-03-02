const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.link.findFirst({
        where: { url: '/apps/baternap' }
    });

    if (existing) {
        console.log("Link already exists, updating type to LOCAL...");
        await prisma.link.update({
            where: { id: existing.id },
            data: { type: 'LOCAL' }
        });
        console.log("Updated!");
    } else {
        console.log("Creating Baternap link...");
        await prisma.link.create({
            data: {
                name: 'Baternap',
                url: '/apps/baternap',
                type: 'LOCAL',
                openInNewTab: false
            }
        });
        console.log("Created!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
