import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ServicioApi } from '../../core/services/servicio-api';
import { ServicioAplicacion } from '../../core/services/servicio-aplicacion';
import { apiPrueba, usuarioPrueba } from '../../testing/datos-prueba';
import { AccesoComponent } from './acceso.component';

describe('Acceso sin recuperación de contraseña',()=>{
  let api:ReturnType<typeof apiPrueba>;
  beforeEach(()=>{localStorage.removeItem('petcare.idioma');api=apiPrueba();TestBed.configureTestingModule({providers:[provideRouter(routes),{provide:ServicioApi,useValue:api}]});});
  it('solo ofrece inicio de sesión y registro',async()=>{
    const n=await RouterTestingHarness.create('/acceso');await n.fixture.whenStable();n.detectChanges();
    const texto=n.routeNativeElement?.textContent;expect(texto).toContain('Crear cuenta');expect(texto).not.toContain('Recuperar cuenta');
  });
  it('registra y abre la sesión sin código de recuperación',async()=>{
    api.enviar.mockResolvedValue({usuario:usuarioPrueba});const n=await RouterTestingHarness.create('/acceso');await n.fixture.whenStable();
    const p=n.fixture.debugElement.query(By.directive(AccesoComponent)).componentInstance as AccesoComponent;
    p.cambiar('registro');p.guardar({nombre:'Julen',correo:usuarioPrueba.correo,contrasena:'Segura12345',contrasena_confirmation:'Segura12345'});await n.fixture.whenStable();
    expect(api.enviar).toHaveBeenCalledWith('POST','registro',expect.objectContaining({contrasena_confirmation:'Segura12345'}));expect(TestBed.inject(ServicioAplicacion).usuario()).toEqual(usuarioPrueba);
  });
  it('inicia sesión con las credenciales',async()=>{
    api.enviar.mockResolvedValue(usuarioPrueba);const n=await RouterTestingHarness.create('/acceso');await n.fixture.whenStable();
    const p=n.fixture.debugElement.query(By.directive(AccesoComponent)).componentInstance as AccesoComponent;
    p.guardar({correo:usuarioPrueba.correo,contrasena:'Segura12345'});await n.fixture.whenStable();expect(api.enviar).toHaveBeenCalledWith('POST','inicio-sesion',{correo:usuarioPrueba.correo,contrasena:'Segura12345'});
  });
  it('al cerrar sesión elimina usuario y mascotas del estado local',async()=>{
    const n=await RouterTestingHarness.create('/mascotas');await n.fixture.whenStable();const app=TestBed.inject(ServicioAplicacion);await app.salir();await n.fixture.whenStable();
    expect(api.enviar).toHaveBeenCalledWith('POST','cierre-sesion');expect(app.usuario()).toBeNull();expect(app.mascotas()).toEqual([]);
  });
});
