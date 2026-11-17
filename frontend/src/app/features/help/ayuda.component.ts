import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicioAplicacion } from '../../core/services/servicio-aplicacion';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';

@Component({
  imports: [RouterLink, TraducirPipe],
  template: `
    <div class="titulo-pagina"><div><p class="sobrelinea">PETCARE</p><h1>{{ 'Ayuda' | traducir }}</h1>
      <p>{{ 'Empieza a organizar sus cuidados' | traducir }}</p></div></div>
    @if(app.demo){<section class="panel bloque"><h2>{{ 'Tu espacio de prueba' | traducir }}</h2>
      <p>{{ 'Los cambios se guardan en este navegador. Puedes cerrar sesión y volver a entrar sin perderlos.' | traducir }}</p>
      <p>{{ 'Los códigos de colaboración solo funcionan entre cuentas de este mismo navegador.' | traducir }}</p>
      <a routerLink="/cuenta">{{ 'Exportar o restablecer mis datos' | traducir }} ↗</a></section>}
    <section class="panel bloque"><h2>{{ 'Primeros pasos' | traducir }}</h2><ol>
      @for(paso of pasos; track paso.ruta){<li class="bloque"><a [routerLink]="paso.ruta"><strong>{{ paso.titulo | traducir }} ↗</strong></a><p>{{ paso.texto | traducir }}</p></li>}
    </ol></section>
    <section class="panel bloque"><h2>{{ 'Preguntas frecuentes' | traducir }}</h2>
      @for(pregunta of preguntas; track pregunta.titulo){<details class="bloque"><summary>{{ pregunta.titulo | traducir }}</summary><p>{{ pregunta.texto | traducir }}</p></details>}
    </section>
  `,
})
export class AyudaComponent {
  readonly app = inject(ServicioAplicacion);
  readonly pasos = [
    { ruta: '/mascotas', titulo: '1. Crea la ficha de tu mascota', texto: 'Añade su nombre, especie, foto y datos básicos. Puedes completar la ficha más adelante.' },
    { ruta: '/historial', titulo: '2. Organiza su historial', texto: 'Registra consultas, vacunas, desparasitaciones y alergias. Las próximas dosis aparecen en el calendario.' },
    { ruta: '/tratamientos', titulo: '3. Anota sus tratamientos', texto: 'Define la pauta y registra cada dosis como administrada u omitida. Los cambios de pauta conservan las versiones anteriores.' },
    { ruta: '/calendario', titulo: '4. Planifica citas y tareas', texto: 'Consulta la agenda o el mes, filtra por mascota y registra los cuidados realizados. Puedes exportar los eventos visibles.' },
    { ruta: '/colaboradores', titulo: '5. Comparte los cuidados', texto: 'Genera un código para otro propietario con acceso completo o para un ayudante de solo lectura.' },
  ];
  readonly preguntas = [
    { titulo: '¿Qué puede hacer cada persona?', texto: 'Los propietarios pueden editar y compartir. Los ayudantes pueden consultar. Cada cuenta puede tener un permiso distinto en cada mascota.' },
    { titulo: '¿Cómo cierro la sesión?', texto: 'Usa Cerrar sesión en el menú de tu perfil. Las páginas de cuidados requieren iniciar sesión de nuevo.' },
    { titulo: '¿Puedo cambiar el idioma?', texto: 'El selector del menú permite elegir castellano o euskera. Se conserva tu preferencia en este navegador.' },
    { titulo: '¿Cómo elimino una mascota?', texto: 'Abre su ficha y confirma con tu contraseña. Si hay otros propietarios, solo sales de la mascota; si eres el último, se eliminan sus datos definitivamente.' },
  ];
}
