export function converterDataHora(dataHoraISO: string | Date): string {
    const dataHoraUTC = new Date(dataHoraISO);
    const offsetBrasilia = -3 * 60 * 60 * 1000; // -3 horas em milissegundos
    const dataHoraBrasilia = new Date(dataHoraUTC.getTime() + offsetBrasilia);

    const dia = dataHoraBrasilia.getDate().toString().padStart(2, '0');
    const mes = (dataHoraBrasilia.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataHoraBrasilia.getFullYear();
    const horas = dataHoraBrasilia.getHours().toString().padStart(2, '0');
    const minutos = dataHoraBrasilia.getMinutes().toString().padStart(2, '0');
    const segundos = dataHoraBrasilia.getSeconds().toString().padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}
