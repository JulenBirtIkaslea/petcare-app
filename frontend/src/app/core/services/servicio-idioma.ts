import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { traduccionesEuskera } from '../../shared/i18n/eu';

export type Idioma = 'es' | 'eu';
const CLAVE_IDIOMA = 'petcare.idioma';

@Injectable({ providedIn: 'root' })
export class ServicioIdioma {
  private readonly documento = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly titulo = inject(Title);
  private readonly navegacion = toSignal(
    this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd)),
  );
  private readonly idiomaActual = signal<Idioma>(this.recuperar());
  readonly idioma = this.idiomaActual.asReadonly();

  constructor() {
    effect(() => {
      const idioma = this.idioma();
      this.documento.documentElement.lang = idioma;
      try {
        this.documento.defaultView?.localStorage.setItem(CLAVE_IDIOMA, idioma);
      } catch {
        /* El selector funciona también sin almacenamiento. */
      }
      this.navegacion();
      let ruta = this.router.routerState.snapshot.root;
      while (ruta.firstChild) ruta = ruta.firstChild;
      const titulo = ruta.title?.replace(' · PetCare', '') ?? 'Inicio';
      this.titulo.setTitle(`${this.traducir(titulo)} · PetCare`);
    });
  }

  cambiar(idioma: string): void {
    if (idioma === 'es' || idioma === 'eu') this.idiomaActual.set(idioma);
  }

  traducir(texto: string): string {
    return this.idioma() === 'eu' ? (traduccionesEuskera[texto] ?? texto) : texto;
  }

  private recuperar(): Idioma {
    try {
      return this.documento.defaultView?.localStorage.getItem(CLAVE_IDIOMA) === 'eu' ? 'eu' : 'es';
    } catch {
      return 'es';
    }
  }
}
