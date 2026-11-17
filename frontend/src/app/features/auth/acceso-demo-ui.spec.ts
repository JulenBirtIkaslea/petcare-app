import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { ServicioAplicacion } from '../../core/services/servicio-aplicacion';
import { usuarioPrueba } from '../../testing/datos-prueba';
import { AccesoComponent } from './acceso.component';

describe('Formulario de acceso local', () => {
  const ruta = { snapshot: { queryParamMap: convertToParamMap({}) } };
  let app: { demo: boolean; api: { enviar: ReturnType<typeof vi.fn> }; sesion: ReturnType<typeof vi.fn>; usuario: ReturnType<typeof signal<null>> };

  beforeEach(() => {
    localStorage.removeItem('petcare.idioma');
    ruta.snapshot.queryParamMap = convertToParamMap({});
    app = { demo: true, api: { enviar: vi.fn().mockResolvedValue(usuarioPrueba) }, sesion: vi.fn().mockResolvedValue(undefined), usuario: signal(null) };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ActivatedRoute, useValue: ruta }, { provide: ServicioAplicacion, useValue: app }] });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('acepta el alias sin exigir formato de correo y conserva la opción de recordar', async () => {
    const fixture = TestBed.createComponent(AccesoComponent);
    fixture.componentInstance.rellenarPrueba();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const correo = fixture.nativeElement.querySelector('input[name="correo"]') as HTMLInputElement;
    const recordar = fixture.nativeElement.querySelector('input[name="recordar"]') as HTMLInputElement;
    expect(correo.type).toBe('text'); expect(correo.value).toBe('prueba');
    recordar.click(); fixture.detectChanges(); await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(app.api.enviar).toHaveBeenCalledWith('POST', 'inicio-sesion', { correo: 'prueba', contrasena: 'Birtlh123.', recordar: true });
    expect(app.sesion).toHaveBeenCalledWith(usuarioPrueba);
  });

  it('permite mostrar y volver a ocultar la contraseña sin enviar el formulario', async () => {
    const fixture = TestBed.createComponent(AccesoComponent); fixture.detectChanges(); await fixture.whenStable();
    const control = fixture.nativeElement.querySelector('.entrada-contrasena button') as HTMLButtonElement;
    const clave = fixture.nativeElement.querySelector('input[name="contrasena"]') as HTMLInputElement;
    expect(clave.autocomplete).toBe('current-password');
    control.click(); fixture.detectChanges(); expect(clave.type).toBe('text');
    control.click(); fixture.detectChanges(); expect(clave.type).toBe('password');
    expect(app.api.enviar).not.toHaveBeenCalled();
  });

  it('mantiene el correo con validación email al registrar otra cuenta', async () => {
    const fixture = TestBed.createComponent(AccesoComponent); fixture.componentInstance.cambiar('registro');
    fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input[name="correo"]').type).toBe('email');
    expect(fixture.nativeElement.querySelector('input[name="contrasena"]').autocomplete).toBe('new-password');
    expect(fixture.nativeElement.querySelector('input[name="recordar"]')).toBeNull();
  });

  it('muestra el rechazo de credenciales y no abre sesión', async () => {
    app.api.enviar.mockRejectedValue(new HttpErrorResponse({ status: 422, error: { errors: { correo: ['Las credenciales no son correctas.'] } } }));
    const fixture = TestBed.createComponent(AccesoComponent);
    fixture.componentInstance.guardar({ correo: 'prueba', contrasena: 'incorrecta' });
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('Las credenciales no son correctas.');
    expect(app.sesion).not.toHaveBeenCalled();
  });

  it.each(['/calendario?tipo=tarea', '//externo.test', '/\\externo.test', '/acceso'])('valida el destino después del acceso: %s', async (destino) => {
    ruta.snapshot.queryParamMap = convertToParamMap({ volver: destino });
    const fixture = TestBed.createComponent(AccesoComponent);
    fixture.componentInstance.guardar({ correo: 'prueba', contrasena: 'Birtlh123.' });
    await fixture.whenStable();
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(destino === '/calendario?tipo=tarea' ? destino : '/inicio');
  });
});
