import snmp from 'net-snmp';

export async function consultaSerialClienteZte(oltIp: string, oidCli: number, index: number): Promise<string | 0> {
    return new Promise((resolve) => {
        let oidSinal = `1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.18.${oidCli}.${index}`;

        const session = snmp.createSession(oltIp, 'brpRO');

        session.get([oidSinal], (error, varbinds) => {
            if (error) {
                resolve(0);
            } else {
                if (varbinds && varbinds.length > 0) {
                    let valor = varbinds[0].value;
                    if (valor != null) {
                        resolve(valor.toString().slice(2));
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
