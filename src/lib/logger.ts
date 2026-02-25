import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// Caminho do log da auditoria - Padrão do sistema linux
const LOG_FILE_PATH = process.env.AUDIT_LOG_PATH || "/var/log/cnm/audit.log";

type AuditEvent = "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT";

interface AuditLogOptions {
    eventType: AuditEvent;
    ipAddress: string;
    emailAttempt?: string | null;
}

export async function logSystemAudit({ eventType, ipAddress, emailAttempt }: AuditLogOptions) {
    // 1. Salvar no Banco de Dados (Para a UI do Dashboard funcionar)
    try {
        await prisma.auditLog.create({
            data: {
                eventType,
                ipAddress,
                emailAttempt,
            },
        });
    } catch (dbError) {
        console.error("[Audit Logger - DB Failed] ", dbError);
    }

    // 2. Tentar Salvar no Sistema Operacional (Append para /var/log/)
    try {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${eventType}] IP: ${ipAddress} | EMAIL: ${emailAttempt || "N/A"}\n`;

        // Tenta escrever (append) anexando ao final do arquivo, criando-o se não existir.
        // Importante: Requer que a pasta de destino (e.g. /var/log/cnm) exista e o usuário que executa a aplicação tenha permissão de escrita.
        await fs.appendFile(LOG_FILE_PATH, logLine, { encoding: "utf-8" });
    } catch (fsError: any) {
        // Nós silenciamos (ou apenas geramos log de console) o erro de escrita para NÃO impedir o login/logout do usuário.
        // Um erro comum aqui será EACCES ou ENOENT.
        // Em produção limparemos o console, mas para debugar é bom ver no stdout.
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[Audit Logger - OS Write Failed] Não foi possível escrever no arquivo ${LOG_FILE_PATH}. Verifique as permissões. Erro: ${fsError.message}`);
        }
    }
}
