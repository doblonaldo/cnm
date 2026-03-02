import snmp from 'net-snmp';

export async function consultaStatusClienteZte(oltIp: string, oidCli: number, index: number): Promise<number | 0> {
    return new Promise((resolve) => {
        let oidStatus = `1.3.6.1.4.1.3902.1082.500.10.2.3.8.1.4.${oidCli}.${index}`;
        const session = snmp.createSession(oltIp, 'brpRO');

        session.get([oidStatus], (error, varbinds) => {
            if (error) {
                resolve(0);
            } else {
                if (varbinds && varbinds.length > 0) {
                    let valor = varbinds[0].value;
                    if (valor != null) {
                        resolve(Number(valor));
                    } else {
                        resolve(0);
                    }
                } else {
                    resolve(0);
                }
            }
            session.close();
        });
    });
}
