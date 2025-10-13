import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Router } from '@angular/router';
import axios from "axios";

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: {
      "Content-Type": "application/json",
    },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if(token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
     return Promise.reject(error);
  }
)

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if(error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
)

@Injectable({
  providedIn: 'root'
})

export class ApiService{
  constructor(private router: Router){ }


  login(rut: string, password: string){


    return api.post("auth/login/", {
      username: rut,
      password: password
    }).then(response => {
      const access = response.data.token.access;
      console.log(response.data)
      if(access){
        alert("Inicio de sesion exitoso")
        localStorage.setItem('auth_token', access)
        this.router.navigate(['/hub']);
      }
    })
  }

  saveToken(token: string){
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(){
    localStorage.removeItem('auth_token');
  }

  getHello(){
    return api.get("hello/");
  }

  getUsuarios(){
    console.log("Obteniendo Usuarios")
    return api.get("usuarios/")
  }

  recuperarPassword(email: string): Promise<any>{
    return api.post('password-reset-request/', {
      email: email
    }).then(response => {
      return response.data
    }).catch(error => {
      throw error.response?.data || error;
    });
  }

  condfirmarRecuperacion(codigo: string): Promise<any>{
    return api.post("password-reset-confirm/", {
      code: codigo,
    }).then(response => {
      return response.data;
    }).catch(error => {
      throw error.response?.data || error;
    })
  }

  cambiarPassword(codigo: string, nuevaPassword: string, confirmarPassword: string): Promise<any>{
    return api.post("password-reset-change/", {
      code: codigo,
      new_password: nuevaPassword,
      confirm_password: confirmarPassword
    }).then(response => {
      return response.data;
    }).catch(error => {
      throw error.response?.data || error;
    })
  }

}