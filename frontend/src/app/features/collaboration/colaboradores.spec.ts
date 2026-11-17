import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ServicioApi } from '../../core/services/servicio-api';
import { apiPrueba, mascotaPrueba } from '../../testing/datos-prueba';
import { ColaboradoresComponent } from './colaboradores.component';

describe('Invitaciones y permisos',()=>{
  let api:ReturnType<typeof apiPrueba>;
  beforeEach(()=>{localStorage.removeItem('petcare.idioma');api=apiPrueba();TestBed.configureTestingModule({providers:[provideRouter(routes),{provide:ServicioApi,useValue:api}]});});
  it('genera un código con el rol elegido y confirmación de contraseña',async()=>{
    api.enviar.mockResolvedValue({codigo:'ABCD-EFGH-JKLM-NPQR'});const n=await RouterTestingHarness.create('/colaboradores');await n.fixture.whenStable();const p=n.fixture.debugElement.query(By.directive(ColaboradoresComponent)).componentInstance as ColaboradoresComponent;
    p.generar({permiso:'propietario',contrasena_actual:'Segura12345'});await n.fixture.whenStable();n.detectChanges();
    expect(api.enviar).toHaveBeenCalledWith('POST','mascotas/1/codigos',{permiso:'propietario',contrasena_actual:'Segura12345'});expect(p.valoresCompartir['contrasena_actual']).toBeUndefined();expect(n.routeNativeElement?.textContent).toContain('20 minutos');
  });
  it('consulta antes de consumir la invitación',async()=>{
    api.enviar.mockImplementation(async(_metodo,ruta)=>ruta==='compartir/consultar'?{nombre:'Luna',permiso:'ayudante',caduca_en:'2099-01-01T12:00:00Z'}:{mascota_id:1});
    const n=await RouterTestingHarness.create('/colaboradores');await n.fixture.whenStable();const p=n.fixture.debugElement.query(By.directive(ColaboradoresComponent)).componentInstance as ColaboradoresComponent;
    p.consultar({codigo:'ABCD-EFGH-JKLM-NPQR'});await n.fixture.whenStable();expect(api.enviar).toHaveBeenCalledTimes(1);expect(p.invitacion()?.permiso).toBe('ayudante');
    p.aceptar();await n.fixture.whenStable();expect(api.enviar).toHaveBeenLastCalledWith('POST','compartir/aceptar',{codigo:'ABCD-EFGH-JKLM-NPQR'});expect(p.invitacion()).toBeNull();
  });
  it('el ayudante no puede generar invitaciones',async()=>{
    api.mascotas[0]=mascotaPrueba({permiso:'ayudante'});const n=await RouterTestingHarness.create('/colaboradores');await n.fixture.whenStable();n.detectChanges();expect(n.routeNativeElement?.textContent).not.toContain('Generar código');expect(n.routeNativeElement?.textContent).toContain('Introducir código');
  });
  it('los códigos caducan también en el instante exacto de vencimiento',()=>{
    const p=TestBed.runInInjectionContext(()=>new ColaboradoresComponent());expect(p.estadoCodigo({id:1,permiso:'ayudante',caduca_en:new Date(Date.now()-1).toISOString(),usado_en:null,cancelado_en:null})).toBe('Caducado');
  });
});
