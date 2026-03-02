import mysql from 'mysql2/promise';
import { consultarSNMPFtth } from './leituraSnmpFtth';
import { converterDataHora } from './converterDataHora';

const pool = mysql.createPool({
    host: process.env.UNM2000_DB_HOST as string,
    user: process.env.UNM2000_DB_USER as string,
    password: process.env.UNM2000_DB_PASSWORD as string,
    database: process.env.UNM2000_DB_NAME as string,
    waitForConnections: true,
    connectionLimit: 128,
    queueLimit: 10
});

const poolAlarme = mysql.createPool({
    host: process.env.UNM2000_DB_HOST as string,
    user: process.env.UNM2000_DB_USER as string,
    password: process.env.UNM2000_DB_PASSWORD as string,
    database: process.env.UNM2000_ALARM_DB_NAME as string,
    waitForConnections: true,
    connectionLimit: 128,
    queueLimit: 10
});

export async function obterDadosClientesftth(cslotno: number, cponno: number, cauthno: number, cneid: number, host: string) {
    try {
        const query = 'SELECT cobjectname, contmac FROM t_ontdevice WHERE cslotno = ? AND cponno = ? AND cauthno = ? AND cneid = ?';
        const [rows]: any = await pool.query(query, [cslotno, cponno, cauthno, cneid]);

        let leituraSnmp: string | number = 0;
        try {
            const snmpRes = await consultarSNMPFtth(host, 'adsl', cslotno, cponno, cauthno);
            leituraSnmp = Number(snmpRes);
        } catch (e) {
            leituraSnmp = 0.00;
        }

        let status = 'Offline';
        let horarioQueda = "00:00:00";

        if (leituraSnmp === 0.00 && rows && rows.length > 0) {
            const contmac = rows[0].contmac;
            const queryAlarme = 'SELECT coccurutctime, corialarmcode FROM t_alarmlogcur WHERE contmac = ? AND cneid = ?';
            const [rowsAlarm]: any = await poolAlarme.query(queryAlarme, [contmac, cneid]);

            if (rowsAlarm && rowsAlarm.length > 0) {
                status = String(rowsAlarm[0].corialarmcode);
                if (status === '734') {
                    status = "Loss"
                }
                if (status === '613') {
                    status = "DyingGasp"
                }
                if (status === '787') {
                    status = "MGC - Disconect"
                }
                let rawHorario = rowsAlarm[0].coccurutctime;
                horarioQueda = converterDataHora(rawHorario)
            }
        }

        if (!rows || rows.length === 0) return null;

        const clientes = rows.map((row: any) => ({
            id: cauthno,
            nome: row.cobjectname,
            serial: row.contmac,
            sinal: leituraSnmp,
            status: status,
            horarioQueda: horarioQueda
        }));

        return clientes;
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        return null; // Next.js prefers ignoring these or throwing
    }
}
