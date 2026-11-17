import { formatDate, registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import eu from '@angular/common/locales/eu';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { ServicioIdioma } from '../../core/services/servicio-idioma';

registerLocaleData(es);
registerLocaleData(eu);

@Pipe({ name: 'fechaLocalizada', pure: false })
export class FechaLocalizadaPipe implements PipeTransform {
  private readonly idioma = inject(ServicioIdioma);
  transform(fecha: Date | string, formato: string): string {
    return formatDate(fecha, formato, this.idioma.idioma());
  }
}
