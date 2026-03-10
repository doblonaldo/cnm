const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.appSetting.findUnique({ where: { id: "singleton" } });
    console.log("Settings:", settings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
