import { Component, input, output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosFormulario, ValorCampo } from '../models/api';
import { TraducirPipe } from '../pipes/traducir.pipe';

export interface Campo {
  clave: string; etiqueta: string; tipo?: 'text' | 'email' | 'password' | 'checkbox' | 'number' | 'date' | 'datetime-local' | 'time' | 'textarea' | 'select' | 'dias' | 'horarios';
  opciones?: { valor: string | number; etiqueta: string }[];
  requerido?: boolean; min?: number | string; max?: number | string; paso?: number; ayuda?: string;
  visible?: (datos: DatosFormulario) => boolean;
  autocomplete?: string;
}
@Component({
  selector: 'app-formulario', imports: [FormsModule, TraducirPipe],
  template: `<form class="formulario-datos" #form="ngForm" (ngSubmit)="!ocupado() && form.valid && guardar.emit(datos)" [attr.aria-busy]="ocupado()">
    @for (c of campos(); track c.clave) { @if (!c.visible || c.visible(datos)) {
      <div class="campo" [class.ancho]="c.tipo === 'textarea' || c.tipo === 'dias' || c.tipo === 'horarios'">
        @if(c.tipo !== 'checkbox'){<label [for]="prefijo() + c.clave">{{ c.etiqueta | traducir }} @if (c.requerido) { <span aria-hidden="true">*</span> }</label>}
        @switch (c.tipo) {
          @case ('checkbox') { <label class="opcion-check"><input type="checkbox" [id]="prefijo()+c.clave" [name]="c.clave" [attr.name]="c.clave" [(ngModel)]="datos[c.clave]" [disabled]="ocupado()">{{ c.etiqueta | traducir }}</label> }
          @case ('password') { <div class="entrada-contrasena"><input [id]="prefijo()+c.clave" [name]="c.clave" [attr.name]="c.clave" [type]="visibles.has(c.clave)?'text':'password'" [(ngModel)]="datos[c.clave]" [required]="c.requerido ?? false" [attr.maxlength]="c.max ?? null" [autocomplete]="c.autocomplete ?? (c.clave==='contrasena_actual'?'current-password':'new-password')" [attr.aria-describedby]="c.ayuda?prefijo()+c.clave+'-ayuda':null" [disabled]="ocupado()"><button type="button" class="enlace-boton" [attr.aria-controls]="prefijo()+c.clave" [attr.aria-pressed]="visibles.has(c.clave)" [attr.aria-label]="(visibles.has(c.clave)?'Ocultar contraseña':'Mostrar contraseña') | traducir" (click)="alternarVisibilidad(c.clave)">{{ (visibles.has(c.clave)?'Ocultar':'Mostrar') | traducir }}</button></div> }
          @case ('select') { <select [id]="prefijo()+c.clave" [name]="c.clave" [attr.name]="c.clave" [(ngModel)]="datos[c.clave]" [required]="c.requerido ?? false"><option [ngValue]="null">{{ 'Seleccionar' | traducir }}</option>@for (o of c.opciones ?? []; track o.valor) { <option [ngValue]="o.valor">{{ o.etiqueta | traducir }}</option> }</select> }
          @case ('textarea') { <textarea [id]="prefijo()+c.clave" [name]="c.clave" [attr.name]="c.clave" [(ngModel)]="datos[c.clave]" [required]="c.requerido ?? false" [attr.maxlength]="c.max ?? 5000" rows="3"></textarea> }
          @case ('dias') { <div class="dias-semana">@for (dia of dias; track dia.valor) { <label><input type="checkbox" [checked]="incluye(c.clave, dia.valor)" (change)="alternar(c.clave, dia.valor)">{{ dia.etiqueta | traducir }}</label> }</div> }
          @case ('horarios') { <div class="horarios">@for (hora of horas(c.clave); track $index; let i = $index) { <div class="fila-horario"><input type="time" [attr.aria-label]="'Hora' | traducir" [value]="hora" (change)="cambiarHora(c.clave, i, $any($event.target).value)" required><button type="button" class="boton pequeno" (click)="quitarHora(c.clave, i)">{{ 'Quitar' | traducir }}</button></div> }<button type="button" class="boton pequeno" (click)="anadirHora(c.clave)">{{ 'Añadir horario' | traducir }}</button></div> }
          @default { <input [id]="prefijo()+c.clave" [name]="c.clave" [attr.name]="c.clave" [type]="c.tipo ?? 'text'" [(ngModel)]="datos[c.clave]" [required]="c.requerido ?? false" [attr.min]="c.min ?? null" [attr.max]="c.tipo === 'number' ? (c.max ?? null) : null" [attr.maxlength]="c.tipo !== 'number' ? (c.max ?? null) : null" [attr.step]="c.paso ?? (c.tipo === 'number' ? 1 : null)" [autocomplete]="c.autocomplete ?? 'off'" [attr.aria-describedby]="c.ayuda?prefijo()+c.clave+'-ayuda':null" [disabled]="ocupado()"> }
        }
        @if (c.ayuda) { <small [id]="prefijo()+c.clave+'-ayuda'">{{ c.ayuda | traducir }}</small> }
      </div>
    } }
    <div class="acciones-formulario ancho">@if(mostrarCancelar()){<button type="button" class="boton" [disabled]="ocupado()" (click)="cancelar.emit()">{{ 'Cancelar' | traducir }}</button>}<button class="boton primario" type="submit" [disabled]="ocupado() || form.invalid">{{ (ocupado() ? 'Guardando…' : etiquetaGuardar()) | traducir }}</button></div>
  </form>`,
})
export class FormularioCamposComponent implements OnChanges {
  readonly campos = input.required<Campo[]>(); readonly valores = input<DatosFormulario>({}); readonly ocupado = input(false);
  readonly mostrarCancelar = input(true);
  readonly visibles = new Set<string>();
  private static secuencia = 0;
  readonly etiquetaGuardar = input('Guardar'); readonly prefijo = input('form-'+(++FormularioCamposComponent.secuencia)+'-');
  readonly guardar = output<DatosFormulario>(); readonly cancelar = output(); datos: DatosFormulario = {};
  readonly dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((etiqueta,i) => ({ etiqueta, valor:i+1 }));
  ngOnChanges(cambios: import('@angular/core').SimpleChanges) { if (cambios['valores']) { this.datos = structuredClone(this.valores()); this.visibles.clear(); } }
  alternarVisibilidad(clave: string) { if(this.visibles.has(clave))this.visibles.delete(clave);else this.visibles.add(clave); }
  incluye(clave: string, valor: number) { return Array.isArray(this.datos[clave]) && this.datos[clave].includes(valor); }
  alternar(clave: string, valor: number) { const lista = (this.datos[clave] ?? []) as number[]; this.datos[clave] = lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]; }
  horas(clave: string): string[] { return (this.datos[clave] ?? []) as string[]; }
  cambiarHora(clave: string, i: number, valor: string) { const horas = [...this.horas(clave)]; horas[i] = valor; this.datos[clave] = horas; }
  anadirHora(clave: string) { if (this.horas(clave).length < 24) this.datos[clave] = [...this.horas(clave), '09:00']; }
  quitarHora(clave: string, i: number) { this.datos[clave] = this.horas(clave).filter((_,indice) => indice !== i); }
}
