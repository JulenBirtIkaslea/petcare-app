import { Routes } from '@angular/router';
import { EstructuraComponent } from './layouts/estructura.component';
import { sesionGuard } from './core/guards/sesion.guard';
export const routes: Routes = [{path:'',component:EstructuraComponent,children:[
  {path:'acceso',title:'Acceso · PetCare',loadComponent:()=>import('./features/auth/acceso.component').then(m=>m.AccesoComponent)},
  {path:'',canActivateChild:[sesionGuard],children:[
    {path:'',pathMatch:'full',redirectTo:'inicio'},
    {path:'inicio',title:'Inicio · PetCare',loadComponent:()=>import('./features/dashboard/inicio.component').then(m=>m.InicioComponent)},
    {path:'mascotas',title:'Mis mascotas · PetCare',loadComponent:()=>import('./features/pets/lista-mascotas.component').then(m=>m.ListaMascotasComponent)},
    {path:'mascotas/nueva',title:'Añadir mascota · PetCare',loadComponent:()=>import('./features/pets/formulario-mascota.component').then(m=>m.FormularioMascotaComponent)},
    {path:'mascotas/:id',title:'Ficha de mascota · PetCare',loadComponent:()=>import('./features/pets/detalle-mascota.component').then(m=>m.DetalleMascotaComponent)},
    {path:'historial',title:'Historial · PetCare',loadComponent:()=>import('./features/veterinary-history/historial.component').then(m=>m.HistorialComponent)},
    {path:'tratamientos',title:'Tratamientos · PetCare',loadComponent:()=>import('./features/treatments/tratamientos.component').then(m=>m.TratamientosComponent)},
    {path:'calendario',title:'Calendario · PetCare',loadComponent:()=>import('./features/calendar/calendario.component').then(m=>m.CalendarioComponent)},
    {path:'colaboradores',title:'Colaboradores · PetCare',loadComponent:()=>import('./features/collaboration/colaboradores.component').then(m=>m.ColaboradoresComponent)},
    {path:'cuenta',title:'Mi cuenta · PetCare',loadComponent:()=>import('./features/auth/cuenta.component').then(m=>m.CuentaComponent)},
    {path:'ayuda',title:'Ayuda · PetCare',loadComponent:()=>import('./features/help/ayuda.component').then(m=>m.AyudaComponent)},
    {path:'**',title:'Página no encontrada · PetCare',loadComponent:()=>import('./shared/components/no-encontrado.component').then(m=>m.NoEncontradoComponent)},
  ]},
]}];
