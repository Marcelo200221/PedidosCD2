import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTitle, IonContent, IonButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.spec'; // Mantén tu import actual

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonInput, IonButton, CommonModule, FormsModule]
})

export class LoginPage implements OnInit {
  constructor(private router: Router, private api: ApiService) { }
  
  //Definicion de variables
  rut: string = '';
  password: string = '';

  //Definicion de variables de error
  rutError: string = '';
  passwordError: string = '';

  //Definicion de variables de color
  underlineColor: string = '#cccccc';
  underlineColorcontrasenia: string = '#cccccc';

  //Variable para manejar el estado de carga
  isLoading: boolean = false;

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

  //Funcion de validacion de contraseña
  actualizarPassword(event: any) {
    this.password = event.target.value;

    if (this.password.length === 0) {
      this.underlineColorcontrasenia = '#cccccc';
      this.passwordError = '';
    } else if (this.password.length < 8) {
      this.underlineColorcontrasenia = '#ff4d4d';
      this.passwordError = 'La contraseña debe tener al menos 8 caracteres';
    } else {
      this.underlineColorcontrasenia = '#28a745';
      this.passwordError = '';
    }
  }

  //Validación para inicio
  async handleClick() {
    // Validaciones previas
    if (!this.rut || !this.password) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    
    if (this.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (this.rutError || this.passwordError) {
      alert('Por favor corrige los errores antes de continuar.');
      return;
    }
   
    // Activar indicador de carga
    this.isLoading = true;
    
    try {
      console.log('Intentando login con RUT:', this.rut);
      
      // Tu servicio ya maneja la navegación y el alert interno
      await this.api.login(this.rut, this.password);
      
      // Si llegamos aquí, el login fue exitoso
      console.log('Login completado exitosamente');
      
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Manejo de errores específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          alert('El RUT ingresado no está registrado en el sistema.');
        } else if (status === 401) {
          alert('Contraseña incorrecta. Por favor, verifica tus credenciales.');
        } else if (status === 400) {
          // Errores de validación del backend
          if (data.non_field_errors) {
            alert(data.non_field_errors.join('\n'));
          } else if (data.detail) {
            alert(data.detail);
          } else {
            alert('Datos incorrectos. Verifica el RUT y contraseña.');
          }
        } else {
          alert('Error al iniciar sesión. Por favor, intenta nuevamente.');
        }
      } else if (error.request) {
        // Error de red
        alert('No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        alert('Error inesperado. Por favor, intenta nuevamente.');
      }
    } finally {
      // Desactivar indicador de carga
      this.isLoading = false;
    }
  }

  olvidar() {
    this.router.navigate(['/olvido']);
  }

  ngOnInit() {
  }
}