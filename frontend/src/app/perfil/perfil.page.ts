import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { getItem as ssGetItem, setItem as ssSetItem } from '../services/token-storage';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonButton, IonInput]
})
export class PerfilPage implements OnInit {
    constructor( private api: ApiService) { }


    async ngOnInit() {
      await this.cargarUsuario();
    }
  
    //Definicion de variables
    id: string = '';
    rut: string = '';
    nombre: string = '';
    apellido: string = '';
    correo: string = '';
    private original: any = null;
  
    //Definicion de variables de error
    rutError: string = '';
    nombreError: string = '';
    apellidoError: string = '';
    correoError: string = '';
  
    //Definicion de variables de color
    underlineNombre = '#444444';
    underlineApellido = '#444444';
    underlineColor = '#444444';
    underlineDireccion = '#444444';
    underlineCorreo = '#444444';

    enableEdit = false;
    // Campos para cambio de contraseña por código
    codigoPass: string = '';
    nuevaPass: string = '';
    confirmarPass: string = '';

    async cargarUsuario() {
      try {
        const uStr = await ssGetItem('user');
        const u = uStr ? JSON.parse(uStr) : null;
        if (!u) return;
        this.original = u;
        this.rut = u.rut ?? '';
        this.nombre = u.nombre ?? u.first_name ?? '';
        this.apellido = u.apellido ?? u.last_name ?? '';
        this.correo = u.email ?? '';
        this.id = String(u.id ?? '');
      } catch (e) {
        console.error('No se pudo cargar usuario actual', e);
      }
    }
  
    //Funcion de limites de input de nombre
    onKeyPressNombre(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    editar(){
      this.enableEdit = true
    }

    cancelar(){
      this.enableEdit = false
      if (this.original) {
        this.rut = this.original.rut ?? '';
        this.nombre = this.original.nombre ?? this.original.first_name ?? '';
        this.apellido = this.original.apellido ?? this.original.last_name ?? '';
        this.correo = this.original.email ?? '';
      }
    }
  
    //Funcion de Validacion de nombre
    actualizarNombre(event: any) {
      this.nombre = event.target.value;
      if (this.nombre.length === 0) {
        this.underlineNombre = '#cccccc';
        this.nombreError = '';
      } else if (this.nombre.trim().length < 2) {
        this.underlineNombre = '#ff4d4d';
        this.nombreError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineNombre = '#28a745';
        this.nombreError = '';
      }
    }

    actualizarApellido(event: any) {
      this.apellido = event.target.value;
      if (this.apellido.length === 0) {
        this.underlineNombre = '#cccccc';
        this.apellidoError = '';
      } else if (this.apellido.trim().length < 2) {
        this.underlineNombre = '#ff4d4d';
        this.apellidoError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineNombre = '#28a745';
        this.apellidoError = '';
      }
    }
  
    //Funcion de limites de input de rut
    onKeyPress(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return;
      const current = this.rut || '';
      const hasDash = current.indexOf('-') !== -1;
      const parts = current.split('-');
      const before = parts[0] || '';
      const after = parts[1] || '';
  
      if (key === '-') {
        if (hasDash || before.length !== 8) {
          event.preventDefault();
        }
        return;
      }
  
      if (!hasDash) {
        if (!/^[0-9]$/.test(key) || before.length >= 8) {
          event.preventDefault();
        }
        return;
      }
      if (hasDash) {
        if (!/^[0-9kK]$/.test(key) || after.length >= 1) {
          event.preventDefault();
        }
        return;
      }
    }
  
    //Funcion de Validacion de rut
    actualizarRut(event: any) {
      this.rut = event.target.value;
      const isValid = /^\d{8}-[0-9kK]$/.test(this.rut);
  
      this.underlineColor = this.rut.length === 0 ? '#cccccc' : isValid ? '#28a745' : '#ff4d4d';
      this.rutError = !isValid && this.rut.length > 0
        ? 'Formato inválido: debe ser 8 números antes del guion y un dígito o K después'
        : '';
    }


    onKeyPressCorreo(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    actualizarCorreo(event: any) {
      this.correo = event.target.value
      if (this.correo.length === 0){
         this.underlineCorreo = '#cccccc';
        this.correoError = '';
      } else if (this.correo.trim().length < 2) {
        this.underlineCorreo = '#ff4d4d';
        this.correoError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineCorreo = '#28a745';
        this.correoError = '';
      }
    }

    async guardarPerfil() {
      if (!this.enableEdit) return;
      if (!this.nombre || !this.apellido || !this.correo) {
        alert('Por favor, completa nombre, apellido y correo.');
        return;
      }
      if (this.nombreError || this.apellidoError || this.correoError) {
        alert('Por favor corrige los errores antes de continuar.');
        return;
      }
      try {
        // Actualiza en backend primero
        const data = await this.api.actualizarPerfil({
          first_name: this.nombre,
          last_name: this.apellido,
          email: this.correo,
        });

        // Refleja cambios en IndexedDB
        const uStr = await ssGetItem('user');
        const u = uStr ? JSON.parse(uStr) : {};
        const actualizado = {
          ...u,
          first_name: data.first_name ?? this.nombre,
          last_name: data.last_name ?? this.apellido,
          email: data.email ?? this.correo,
          rut: data.rut ?? this.rut,
          nombre: data.first_name ?? this.nombre,
          apellido: data.last_name ?? this.apellido,
          id: data.id ?? u.id,
          username: data.username ?? u.username,
        };
        await ssSetItem('user', JSON.stringify(actualizado));
        this.original = actualizado;
        this.enableEdit = false;
        alert('Perfil actualizado');
      } catch (e: any) {
        console.error('Error guardando perfil', e);
        const msg = e?.response?.data?.email || 'No se pudo guardar el perfil';
        alert(typeof msg === 'string' ? msg : 'No se pudo guardar el perfil');
      }
    }

    async enviarCodigoPassword() {
      try {
        if (!this.correo) { alert('Primero completa tu correo'); return; }
        await this.api.recuperarPassword(this.correo);
        alert('Se envió un código a tu correo');
      } catch (e) {
        alert('No se pudo enviar el código');
      }
    }

    async cambiarPassword() {
      if (!this.codigoPass || !this.nuevaPass || !this.confirmarPass) {
        alert('Completa código y contraseñas');
        return;
      }
      if (this.nuevaPass !== this.confirmarPass) {
        alert('Las contraseñas no coinciden');
        return;
      }
      try {
        await this.api.cambiarPassword(this.codigoPass, this.nuevaPass, this.confirmarPass);
        alert('Contraseña actualizada');
        this.codigoPass = this.nuevaPass = this.confirmarPass = '';
      } catch (e) {
        console.error(e);
        alert('No se pudo actualizar la contraseña');
      }
    }
  
    handleClick() {
    //Verificar que todos los campos tengan valor
    if (!this.nombre || !this.rut  || !this.correo) {
      alert('Por favor, completa todos los campos.');
      return;
    }
  
  
    //Verificar errores individuales
    if (this.nombreError || this.rutError || this.correoError) {
      alert('Por favor corrige los errores antes de continuar.');
      return;
    }

    this.id = (
      this.nombre.substring(0, 3) +
      this.rut.replace(/\D/g, '').substring(0, 4) +
      this.correo
    ).toUpperCase()
  
  
    //Si todo esta bien
    console.log('Cliente ingresado con exito:', {
      nombre: this.nombre,
      rut: this.rut
    });
    alert('Cliente ingresado con éxito');
  }


}
