import { consultaNomeClienteZte } from './consultaNomeClienteZte';
import { consultaSinalClienteZte } from './consultaSinalClienteZte';
import { consultaStatusClienteZte } from './consultaStatusClienteZte';
import { consultaDetailClienteZte } from './consultaDetailClienteZte';
import { consultaSerialClienteZte } from './consultaSerialClienteZte';

export type ClienteZte = {
    id: number;
    nome: string;
    serial: string;
    sinal: number;
    status: string;
    horarioQueda: string;
};

export async function consultaClientesZte(ipOlt: string, dadosJson: any[], targetSlot: number, targetPon: number): Promise<ClienteZte[]> {
    try {
        let temp = 0;
        let oidCalculadoZte = 0;

        if (targetSlot > 1) {
            temp = 256;
        } else {
            temp = 0;
        }

        for (let i = 0; i < dadosJson.length; i++) {
            const item = dadosJson[i];
            if (item.pon == targetPon) {
                oidCalculadoZte = item.oid + (temp * (targetSlot - 1));
            }
        }

        const indices = Array.from({ length: 128 }, (_, i) => i + 1);

        // Processa em paralelo para otimizar 128 chamadas SNMP
        const promessas = indices.map(async (index) => {
            let nome: string | 0 = await consultaNomeClienteZte(ipOlt, oidCalculadoZte, index);

            if (nome === 0) {
                return null; // Cliente não existe nesse index
            }

            let nomeCliente = nome as string;
            let statusCliente = '';
            let sinalCliente = 0;
            let horarioQueda = "00:00:00";
            let serialCliente = "xxx";

            let sinal = await consultaSinalClienteZte(ipOlt, oidCalculadoZte, index);
            if (sinal !== 0) {
                sinalCliente = sinal as number;

                let status = await consultaStatusClienteZte(ipOlt, oidCalculadoZte, index);
                if (status !== 0) {
                    if (status === 4) {
                        statusCliente = 'Working';
                    } else if (status === 5) {
                        statusCliente = 'DyinGasp';
                    } else if (status === 7) {
                        statusCliente = 'Offline';
                    } else if (status === 2) {
                        statusCliente = 'Loss';
                    }

                    if (status !== 0) {
                        let serial = await consultaSerialClienteZte(ipOlt, oidCalculadoZte, index);
                        if (serial !== 0) {
                            serialCliente = serial as string;
                        }
                    }
                }
            }

            return {
                id: index,
                nome: nomeCliente,
                serial: serialCliente,
                sinal: sinalCliente,
                status: statusCliente,
                horarioQueda: horarioQueda
            };
        });

        const resultados = await Promise.all(promessas);
        return resultados.filter((res) => res !== null) as ClienteZte[];

    } catch (error) {
        throw error;
    }
}
