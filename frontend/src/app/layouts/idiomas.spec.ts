import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { ServicioApi } from '../core/services/servicio-api';
import { apiPrueba } from '../testing/datos-prueba';

describe('Interfaz bilingüe con API',()=>{
  beforeEach(()=>{localStorage.removeItem('petcare.idioma');TestBed.configureTestingModule({providers:[provideRouter(routes),{provide:ServicioApi,useValue:apiPrueba()}]});});
  afterEach(()=>{localStorage.removeItem('petcare.idioma');document.documentElement.lang='es';});
  it('cambia de idioma sin perder la navegación',async()=>{
    const n=await RouterTestingHarness.create('/calendario');await n.fixture.whenStable();const selector=n.routeNativeElement!.querySelector<HTMLSelectElement>('#idioma')!;
    selector.value='eu';selector.dispatchEvent(new Event('change'));await n.fixture.whenStable();n.detectChanges();
    expect(n.routeNativeElement?.textContent).toContain('Zaintzen egutegia');expect(document.documentElement.lang).toBe('eu');expect(TestBed.inject(Title).getTitle()).toBe('Egutegia · PetCare');expect(localStorage.getItem('petcare.idioma')).toBe('eu');
  });
  it('restaura el euskera guardado y traduce las especies',async()=>{
    localStorage.setItem('petcare.idioma','eu');const n=await RouterTestingHarness.create('/mascotas');await n.fixture.whenStable();n.detectChanges();
    expect(n.routeNativeElement?.textContent).toContain('Nire maskotak');expect(n.routeNativeElement?.textContent).toContain('Txakurra');
  });
  it('usa castellano ante una preferencia inválida',async()=>{
    localStorage.setItem('petcare.idioma','fr');const n=await RouterTestingHarness.create('/mascotas/nueva');await n.fixture.whenStable();n.detectChanges();expect(n.routeNativeElement?.textContent).toContain('Presenta a tu mascota');expect(localStorage.getItem('petcare.idioma')).toBe('es');
  });
});
