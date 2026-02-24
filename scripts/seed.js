const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando o Seed do Banco de Dados...');

    // 1. Criar ou Obter o Grupo "Administrador"
    let adminGroup = await prisma.group.findUnique({
        where: { name: 'Administrador' },
    });

    if (!adminGroup) {
        adminGroup = await prisma.group.create({
            data: {
                name: 'Administrador',
            },
        });
        console.log('Grupo Administrador criado com sucesso!');
    } else {
        console.log('Grupo Administrador já existe.');
    }

    // 2. Criar ou Atualizar o Usuário Administrador Principal
    const adminEmail = 'admin@cnm.local';
    const adminRawPassword = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(adminRawPassword, 12);

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: hashedPassword,
                groupId: adminGroup.id,
                isActive: true,
                inviteStatus: 'COMPLETED',
            },
        });
        console.log(`Usuário Admin criado!
    Email: ${adminEmail}
    Senha: ${adminRawPassword}
    [!] IMPORTANTE: O usuário master já nasce ativo e logará usando essa senha.`);
    } else {
        console.log('Usuário Admin já existe na base de dados.');
    }

    console.log('Seed concluído com sucesso.');
}

main()
    .catch((e) => {
        console.error('Erro durante o Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
