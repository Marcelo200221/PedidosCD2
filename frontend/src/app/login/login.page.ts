import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTitle, IonContent, IonButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonTitle, IonInput, IonButton, CommonModule, FormsModule]
})

export class LoginPage implements OnInit {
  constructor(private router: Router) { }

  //Definicion de variables
  rut: string = '';
  password: string = '';

  //Definicion de variables de error
  rutError: string = '';
  passwordError: string = '';

  //Definicion de variables de color
  underlineColor: string = '#cccccc';
  underlineColorcontrasenia: string = '#cccccc';

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
  handleClick() {
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

    //Si todo esta bien
    console.log('Login válido:', this.rut, this.password);
    alert('Inicio de sesión correcto ✅');
  }

  olvidar() {
    this.router.navigate(['/olvido']);
  }

  ngOnInit() {}
}