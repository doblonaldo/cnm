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

    // Agora capturando a senha injetada pelo setup.sh via Váriavel de Ambiente no Node
    const adminRawPassword = process.env.ADMIN_PASSWORD;

    if (!adminRawPassword) {
        console.error('\n[ERRO CRÍTICO] A variável de ambiente ADMIN_PASSWORD não foi definida.');
        console.error('Por favor, utilize o script ./setup.sh para inicializar a plataforma de forma segura.\n');
        process.exit(1);
    }

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
        console.log(`\nUsuário Admin criado!
    Email: ${adminEmail}
    Senha: [Definida pelo Script Setup]
    [!] IMPORTANTE: O usuário master já nasce ativo e logará usando a senha escolhida.`);
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
