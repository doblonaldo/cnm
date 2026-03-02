export function buscarOltPorNome(dispositivos: any[], nome: string) {
    try {
        const dispositivoEncontrado = dispositivos.find(d => d.nome === nome);

        if (!dispositivoEncontrado) {
            throw new Error(`Dispositivo com nome ${nome} não encontrado.`);
        }

        return dispositivoEncontrado;
    } catch (erro) {
        throw erro;
    }
}
