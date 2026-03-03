import { NextResponse } from 'next/server';
import { buscarOltPorNome } from '@/lib/baternap/buscarOltPorNome';
import { consultaClientesZte } from '@/lib/baternap/consultaClienteZte';
import { obterDadosClientesftth } from '@/lib/baternap/database';

// Import JSON directly without `fs` which is safer in Next.js Server Components / API
import arqOlt from '@/lib/baternap/assets/olts.json';
import arqOidPonZte from '@/lib/baternap/assets/oidsPonZte.json';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const oltSelect = searchParams.get('opcao1');
        const slotSelect = searchParams.get('opcao2');
        const portSelect = searchParams.get('opcao3');

        if (!oltSelect || !slotSelect || !portSelect) {
            return NextResponse.json({ error: "Parâmetros incompletos." }, { status: 400 });
        }

        let oltEscolhida = buscarOltPorNome(arqOlt, oltSelect);

        if (!oltEscolhida) {
            return NextResponse.json({ error: "OLT não encontrada." }, { status: 404 });
        }

        if (oltEscolhida.vendor === "ZTE") {
            const resultado = await consultaClientesZte(
                oltEscolhida.ip,
                arqOidPonZte,
                Number(slotSelect),
                Number(portSelect)
            );
            return NextResponse.json(resultado);
        } else if (oltEscolhida.vendor === "FTTH") {
            if (!process.env.UNM2000_DB_HOST || !process.env.UNM2000_DB_USER || !process.env.UNM2000_DB_PASSWORD) {
                return NextResponse.json(
                    { error: "Credenciais do banco de dados FiberHome (UNM2000) não configuradas no servidor (.env)." },
                    { status: 500 }
                );
            }

            const indices = Array.from({ length: 128 }, (_, i) => i + 1);

            // Execute parallel requests drastically improving FTTH SNMP response time
            const promessas = indices.map(async (id) => {
                const cliente = await obterDadosClientesftth(
                    Number(slotSelect),
                    Number(portSelect),
                    id,
                    oltEscolhida.id,
                    oltEscolhida.ip
                );
                return cliente;
            });

            const resultados = await Promise.all(promessas);

            const resultadoConsultaBanco: any[] = [];
            resultados.forEach((clienteList: any) => {
                if (clienteList && Array.isArray(clienteList)) {
                    resultadoConsultaBanco.push(...clienteList);
                }
            });

            return NextResponse.json(resultadoConsultaBanco);
        } else {
            return NextResponse.json({ error: "Vendor de OLT não suportado." }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Erro na rota de dados BaterNap:", error);
        return NextResponse.json({ error: "Erro interno do servidor: " + error.message }, { status: 500 });
    }
}
