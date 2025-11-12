import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.spec';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-olvido',
  templateUrl: './olvido.page.html',
  styleUrls: ['./olvido.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonInput, CommonModule, FormsModule]
})
export class OlvidoPage implements OnInit {

  constructor(private router: Router, private api: ApiService) { }

  //Definicion de Variables
  correo: string = '';
  codigo: string = '';
  password: string = '';
  confirmPassword: string = '';

  //Definicion de Variables de Error
  correoError: string = '';
  errorCodigo: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  //Definicion de Variables de Color
  underlineCorreo: string = '#cccccc';
  underlineCodigo: string = '#cccccc';
  underlineColorcontrasenia: string = '#cccccc';
  underlineConfirmPassword: string = '#cccccc';

  //Definicion de variable para mostrar submenus
  mostrarCodigo: boolean = false;
  mostrarNuevaContrasenia: boolean = false;

  //Funcion de Validacion de correo
  actualizarCorreo(event: any) {
   this.correo = event.target.value;
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo);

  if (this.correo.length === 0) {
    this.underlineCorreo = '#cccccc';
    this.correoError = '';
  } else if (!isValid) {
    this.underlineCorreo = '#ff4d4d';
    this.correoError = 'Correo invalido: debe de ser un correo que contena @ y .';
  } else {
    this.underlineCorreo = '#28a745';
    this.correoError = '';
  }
}

  //Funcion de envio de codigo
  enviarCodigo() {
     if (!this.correo) {
      this.underlineCorreo = '#ff4d4d';
      alert('Por favor, completa todos los campos.');
      return;
      }

      //Si el correo es válido
      this.api.recuperarPassword(this.correo);
      console.log('Código enviado a: ' + this.correo);
      alert('Codigo enviado a: ' + this.correo);
      this.mostrarCodigo = true; 
}

//Funcion de Validacion de Codigo
validarCodigo() {
  if (this.codigo.length === 0) {
    this.underlineCodigo = '#ff4d4d';
    this.errorCodigo = 'Debe ingresar un código.';
    return;
  }

  if (this.codigo.length < 4) {
    this.underlineCodigo = '#ff4d4d';
    this.errorCodigo = 'El código debe tener al menos 4 dígitos.';
    return;
  }

  if (this.codigo.length === 6) {
    this.underlineCodigo = '#28a745';
    this.errorCodigo = '';
    this.api.confirmarRecuperacion(this.codigo)
    alert('Codigo válido');
    this.mostrarNuevaContrasenia = true;
    this.mostrarCodigo = false;
  } else {
    this.underlineCodigo = '#ff4d4d';
    this.errorCodigo = 'Código incorrecto, intente de nuevo.';
  }
}

  //Funcion para la verificar contraseñas
  actualizarConfirmPassword(event: any) {
    this.confirmPassword = event.target.value;

    if (this.confirmPassword.length === 0) {
      this.underlineConfirmPassword = '#cccccc';
      this.confirmPasswordError = '';
    } else if (this.confirmPassword !== this.password) {
      this.underlineConfirmPassword = '#ff4d4d';
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    } else {
      this.underlineConfirmPassword = '#28a745';
      this.confirmPasswordError = '';
    }
  }

  //Funcion para validación de la contraseña
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

    if (this.confirmPassword.length > 0) {
      this.actualizarConfirmPassword({ target: { value: this.confirmPassword } });
    }
  }
  
  //Funcion para cambiar la contraseña
  async cambiarContrasenia() {
    if (!this.password || !this.confirmPassword) {
    alert('Por favor, completa todos los campos.'); 
    return;
  }

  if (this.password.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres.');
    return;
  }

  if (this.password !== this.confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  if (this.passwordError || this.confirmPasswordError) {
    alert('Por favor, corrige los errores antes de continuar.'); 
    return;
  }
  
  try {
    const response = await this.api.cambiarPassword(
      this.codigo, 
      this.password, 
      this.confirmPassword
    );
    
    console.log("Contraseña cambiada:", response);
    alert('Contraseña cambiada exitosamente.');
    this.mostrarNuevaContrasenia = false;
    this.router.navigate(['/login']);
  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error);
    
    if (error.code) {
      alert(`Error: ${error.code.join(', ')}`);
    } else if (error.new_password) {
      alert(`Error en contraseña: ${error.new_password.join(', ')}`);
    } else if (error.confirm_password) {
      alert(`Error: ${error.confirm_password.join(', ')}`);
    } else if (error.error) {
      alert(`Error: ${error.error}`);
    } else {
      alert('Error al cambiar la contraseña. Intenta nuevamente.');
    }
  }
}

  ngOnInit() {
  }

}
