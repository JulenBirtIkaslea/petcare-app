import { inject, Pipe, PipeTransform } from '@angular/core';
import { ServicioIdioma } from '../../core/services/servicio-idioma';

@Pipe({ name: 'traducir', pure: false })
export class TraducirPipe implements PipeTransform {
  private readonly idioma = inject(ServicioIdioma);
  transform(texto: string): string {
    return this.idioma.traducir(texto);
  }
}
