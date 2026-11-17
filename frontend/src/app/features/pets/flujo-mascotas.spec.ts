import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ServicioApi } from '../../core/services/servicio-api';
import { apiPrueba, mascotaPrueba } from '../../testing/datos-prueba';
import { FormularioMascotaComponent } from './formulario-mascota.component';
import { DetalleMascotaComponent } from './detalle-mascota.component';

describe('Flujo de mascotas con sesión',()=>{
  let api:ReturnType<typeof apiPrueba>;
  beforeEach(()=>{localStorage.removeItem('petcare.idioma');api=apiPrueba();TestBed.configureTestingModule({providers:[provideRouter(routes),{provide:ServicioApi,useValue:api}]});});
  it('añade una mascota y abre su ficha',async()=>{
    const navegador=await RouterTestingHarness.create();
    await navegador.navigateByUrl('/mascotas/nueva');
    const pagina=navegador.fixture.debugElement.query(By.directive(FormularioMascotaComponent)).componentInstance as FormularioMascotaComponent;
    const nueva=mascotaPrueba({id:2,nombre:'Nube'});api.enviar.mockImplementation(async()=>{api.mascotas.push(nueva);return nueva;});
    pagina.guardar({nombre:'Nube',especie_id:1,precision_nacimiento:'desconocida',esterilizacion:'desconocido',zona_horaria:'Europe/Madrid'});
    await navegador.fixture.whenStable();navegador.detectChanges();
    expect(api.enviar).toHaveBeenCalledWith('POST','mascotas',expect.objectContaining({nombre:'Nube'}));
    expect(navegador.routeNativeElement?.textContent).toContain('Nube');
  });
  it('muestra una mascota inexistente',async()=>{const n=await RouterTestingHarness.create('/mascotas/99999');await n.fixture.whenStable();n.detectChanges();expect(n.routeNativeElement?.textContent).toContain('Mascota no encontrada');});
  it('oculta la edición a los ayudantes',async()=>{
    api.mascotas[0]=mascotaPrueba({permiso:'ayudante'});const n=await RouterTestingHarness.create('/mascotas/1');await n.fixture.whenStable();n.detectChanges();
    expect(n.routeNativeElement?.textContent).not.toContain('Editar ficha');expect(n.routeNativeElement?.textContent).not.toContain('Eliminar mascota');
  });
  it('avisa de la eliminación definitiva y envía la contraseña',async()=>{
    const n=await RouterTestingHarness.create('/mascotas/1');await n.fixture.whenStable();const p=n.fixture.debugElement.query(By.directive(DetalleMascotaComponent)).componentInstance as DetalleMascotaComponent;
    p.confirmarBorrado.set(true);n.detectChanges();expect(n.routeNativeElement?.textContent).toContain('Eres el último propietario');
    p.eliminar({contrasena_actual:'Segura12345'});await n.fixture.whenStable();
    expect(api.enviar).toHaveBeenCalledWith('DELETE','mascotas/1',{contrasena_actual:'Segura12345'});
  });
  it('explica que los otros propietarios conservan la mascota',async()=>{
    api.mascotas[0]=mascotaPrueba({numero_propietarios:2});const n=await RouterTestingHarness.create('/mascotas/1');await n.fixture.whenStable();const p=n.fixture.debugElement.query(By.directive(DetalleMascotaComponent)).componentInstance as DetalleMascotaComponent;p.confirmarBorrado.set(true);n.detectChanges();
    expect(n.routeNativeElement?.textContent).toContain('Los demás propietarios y ayudantes conservarán');
  });
});
