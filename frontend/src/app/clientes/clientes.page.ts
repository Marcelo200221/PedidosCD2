import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from "@angular/common/http";
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.spec';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonInput, IonButton]
})
export class ClientesPage implements OnInit {

  constructor( private api: ApiService) { }
  
    //Definicion de variables
    id: string = '';
    rut: string = '';
    nombre: string = '';
    direccion: string = '';
    razonSocial: string = '';
  
    //Definicion de variables de error
    rutError: string = '';
    nombreError: string = '';
    direccionError: string = '';
    razonSocialError: string = '';
  
    //Definicion de variables de color
    underlineNombre = '#cccccc';
    underlineColor = '#cccccc';
    underlineDireccion = '#cccccc';
    underlineRazonSocial = '#cccccc';
  
    //Funcion de limites de input de nombre
    onKeyPressNombre(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
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

    onKeyPressDireccion(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    actualizarDireccion(event: any) {
      this.direccion = event.target.value
      if (this.direccion.length === 0){
         this.underlineNombre = '#cccccc';
        this.direccionError = '';
      } else if (this.direccion.trim().length < 2) {
        this.underlineDireccion = '#ff4d4d';
        this.direccionError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineDireccion = '#28a745';
        this.direccionError = '';
      }
    }

    onKeyPressRazonSocial(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    actualizarRazonSocial(event: any) {
      this.razonSocial = event.target.value
      if (this.razonSocial.length === 0){
         this.underlineRazonSocial = '#cccccc';
        this.razonSocialError = '';
      } else if (this.razonSocial.trim().length < 2) {
        this.underlineRazonSocial = '#ff4d4d';
        this.razonSocialError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineRazonSocial = '#28a745';
        this.razonSocialError = '';
      }
    }

  
    handleClick() {
    //Verificar que todos los campos tengan valor
    if (!this.nombre || !this.rut  || !this.direccion || !this.razonSocial) {
      alert('Por favor, completa todos los campos.');
      return;
    }
  
  
    //Verificar errores individuales
    if (this.nombreError || this.rutError || this.direccionError || this.razonSocialError) {
      alert('Por favor corrige los errores antes de continuar.');
      return;
    }

    this.id = (
      this.nombre.substring(0, 3) +
      this.rut.replace(/\D/g, '').substring(0, 4) +
      this.direccion.substring(0, 3)
    ).toUpperCase()
  
    this.api.agregarCliente(
      this.id,
      this.rut,
      this.nombre,
      this.direccion,
      this.razonSocial
    )
    
  
    //Si todo esta bien
    console.log('Cliente ingresado con exito:', {
      nombre: this.nombre,
      rut: this.rut,
      direccion: this.direccion,
      razonSocial: this.razonSocial
    });
    alert('Cliente ingresado con éxito');
  }
  
  
  
    ngOnInit() {
    }

}
