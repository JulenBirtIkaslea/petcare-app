import { agendaCsv } from './exportar-agenda';
import { Evento } from '../models/api';

describe('Exportación de agenda', () => {
  const evento = { mascota_nombre: 'Luna', titulo: 'Consulta; "revisión"', tipo: 'cita', fecha: '2026-11-17', instante: '2026-11-17T10:00:00Z', estado: 'programada' } as Evento;
  it('conserva caracteres, separadores, comillas e instantes', () => {
    const csv = agendaCsv([evento]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Consulta; ""revisión"""');
    expect(csv).toContain('2026-11-17T10:00:00Z');
  });
  it('neutraliza nombres y títulos interpretables como fórmulas', () => {
    expect(agendaCsv([{ ...evento, titulo: '=1+1', mascota_nombre: '  @SUM(1)' }])).toContain('"\'  @SUM(1)";"\'=1+1"');
  });
  it('permite exportar un conjunto vacío con cabecera', () => {
    expect(agendaCsv([]).split('\r\n')).toHaveLength(1);
  });
});
