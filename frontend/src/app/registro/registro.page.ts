import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from "@angular/common/http";
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.spec';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, CommonModule, FormsModule]
})
export class RegistroPage implements OnInit {

  //Definicion de variables
  rut: string = '';
  password: string = '';
  nombre: string = '';
  apellido: string = '';
  correo: string = '';
  confirmPassword: string = '';

  //Definicion de variables de error
  rutError: string = '';
  passwordError: string = '';
  nombreError: string = '';
  apellidoError: string = '';
  correoError: string = '';
  confirmPasswordError: string = '';

  //Definicion de variables de color
  underlineNombre = '#cccccc';
  underlineApellido = '#cccccc';
  underlineColor = '#cccccc';
  underlineCorreo = '#cccccc';
  underlineColorcontrasenia = '#cccccc';
  underlineConfirmPassword = '#cccccc';

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

  //Funcion de limites de input de apellido
  onKeyPressApellido(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
      event.preventDefault(); 
    }
  }

  //Funcion de Validacion de apellido
  actualizarApellido(event: any) {
    this.apellido = event.target.value;
    if (this.apellido.length === 0) {
      this.underlineApellido = '#cccccc';
      this.apellidoError = '';
    } else if (this.apellido.trim().length < 2) {
      this.underlineApellido = '#ff4d4d';
      this.apellidoError = 'El apellido debe tener al menos 2 letras';
    } else {
      this.underlineApellido = '#28a745';
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

//Función para la confirmación y verificar contraseñas
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

  //Función para la validación de la contraseña
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

  handleClick() {
  //Verificar que todos los campos tengan valor
  if (!this.nombre || !this.apellido || !this.rut || !this.correo || !this.password || !this.confirmPassword) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  //Verificar longitud de contraseña
  if (this.password.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres.');
    return;
  }

  //Verificar coincidencia de contraseña
  if (this.password !== this.confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  //Verificar errores individuales
  if (this.nombreError || this.apellidoError || this.rutError || this.correoError || this.passwordError || this.confirmPasswordError) {
    alert('Por favor corrige los errores antes de continuar.');
    return;
  }

  //Si todo esta bien
  console.log('Registro válido:', {
    nombre: this.nombre,
    apellido: this.apellido,
    rut: this.rut,
    correo: this.correo,
    password: this.password
  });
  alert('Registro completado correctamente');
}

  constructor(private api: ApiService) { }


  ngOnInit() {
    this.api.getUsuarios()
  }

}
