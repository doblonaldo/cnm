import snmp from 'net-snmp';

export async function consultarSNMPFtth(host: string, community: string, cslotno: number, cpono: number, cauthno: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const oidOnu = (cslotno * 33554432) + (cpono * 524288) + (cauthno * 256);
        const oidFtth = `1.3.6.1.4.1.5875.800.3.9.3.3.1.6.${oidOnu}`;

        const session = snmp.createSession(host, community);

        session.get([oidFtth], (error, varbinds) => {
            if (error) {
                reject(error);
            } else {
                if (varbinds && varbinds.length > 0) {
                    let valor = varbinds[0].value;
                    if (valor != null) {
                        let valorNum = Number(valor) * 0.01;
                        resolve(valorNum.toFixed(2));
                    } else {
                        reject(new Error('Valor retornado pelo SNMP é nulo ou indefinido.'));
                    }
                } else {
                    reject(new Error('Nenhum valor retornado pelo SNMP.'));
                }
            }
            session.close();
        });
    });
}
