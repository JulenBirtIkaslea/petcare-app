import { Component, input } from '@angular/core';
import { TraducirPipe } from '../pipes/traducir.pipe';
@Component({ selector:'app-estado', imports:[TraducirPipe], template:`
  @if (error()) { <div class="error aviso-error" role="alert">{{ error() | traducir }}</div> }
  @if (aviso()) { <div class="aviso-exito" role="status">{{ aviso() | traducir }}</div> }
  @if (ocupado()) { <p role="status" class="cargando">{{ 'Procesando…' | traducir }}</p> }
` })
export class EstadoPaginaComponent { readonly error=input(''); readonly aviso=input(''); readonly ocupado=input(false); }
