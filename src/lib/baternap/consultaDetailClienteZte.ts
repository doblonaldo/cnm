import { Client } from 'ssh2';

export async function consultaDetailClienteZte(host: string, slot: number, port: number, onuId: number): Promise<string> {
    return new Promise((resolve, reject) => {
        let comando = `show gpon onu detail-info gpon_onu-1/1/1:127`; // Note: Hardcoded in original script
        const conn = new Client();
        let stdout = '';
        let stderr = '';

        conn.on('ready', () => {
            conn.exec(comando, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream
                    .on('close', (code: any, signal: any) => {
                        conn.end();
                        if (code === 0) {
                            resolve(stdout);
                        } else {
                            reject(new Error(`Comando falhou com código ${code} e sinal ${signal}:\n${stderr}`));
                        }
                    })
                    .on('data', (data: any) => {
                        stdout += data;
                    })
                    .stderr.on('data', (data: any) => {
                        stderr += data;
                    });
            });
        }).on('error', (err) => {
            reject(err);
        }).connect({
            host: host,
            username: process.env.SSH_ZTE_USER || 'consultorcgr',
            password: process.env.SSH_ZTE_PASSWORD || 'aqDMt30I.',
        });
    });
}
