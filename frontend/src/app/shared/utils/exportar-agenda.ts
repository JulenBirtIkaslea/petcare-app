import { Evento } from '../models/api';

/** CSV para hojas de cálculo: neutraliza fórmulas también en campos introducidos por usuarios. */
export function agendaCsv(eventos: Evento[]): string {
  const celda = (valor: string) => {
    const seguro = /^[\s]*[=+@-]/.test(valor) || /^[\t\r\n]/.test(valor) ? "'" + valor : valor;
    return '"' + seguro.replace(/"/g, '""') + '"';
  };
  const filas = [
    ['Mascota', 'Título', 'Tipo', 'Fecha', 'Instante (ISO)', 'Estado'],
    ...eventos.map(e => [e.mascota_nombre, e.titulo, e.tipo, e.fecha, e.instante ?? '', e.estado]),
  ];
  return '\uFEFF' + filas.map(f => f.map(celda).join(';')).join('\r\n');
}

export function descargarAgenda(eventos: Evento[]): void {
  const url = URL.createObjectURL(new Blob([agendaCsv(eventos)], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'petcare-agenda.csv';
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
