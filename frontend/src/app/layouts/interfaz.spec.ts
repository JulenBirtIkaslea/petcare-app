import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { ServicioApi } from '../core/services/servicio-api';
import { apiPrueba } from '../testing/datos-prueba';

describe('Navegación y búsqueda accesibles', () => {
  beforeEach(() => {
    localStorage.removeItem('petcare.idioma');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: ServicioApi, useValue: apiPrueba() }] });
  });
  it('abre y cierra el menú y recupera el foco al pulsar Escape', async () => {
    const n = await RouterTestingHarness.create('/mascotas');
    await n.fixture.whenStable(); n.detectChanges();
    const raiz = n.routeNativeElement!;
    const boton = raiz.querySelector<HTMLButtonElement>('.menu-movil')!;
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    boton.click(); n.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(raiz.querySelector('.barra')?.classList.contains('menu-abierto')).toBe(true);
    boton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); n.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('false');
  });
  it('distingue búsqueda sin resultados y permite recuperar las mascotas', async () => {
    const n = await RouterTestingHarness.create('/mascotas');
    await n.fixture.whenStable(); n.detectChanges();
    const raiz = n.routeNativeElement!;
    const busqueda = raiz.querySelector<HTMLInputElement>('input[type=search]')!;
    busqueda.value = 'Sin coincidencias'; busqueda.dispatchEvent(new Event('input')); await n.fixture.whenStable(); n.detectChanges();
    expect(raiz.textContent).toContain('No hay coincidencias');
    expect(raiz.textContent).not.toContain('Todavía no hay mascotas');
    raiz.querySelector<HTMLButtonElement>('.estado-vacio button')!.click(); await n.fixture.whenStable(); n.detectChanges();
    expect(busqueda.value).toBe('');
    expect(raiz.querySelectorAll('.tarjeta-mascota')).toHaveLength(1);
  });
});
