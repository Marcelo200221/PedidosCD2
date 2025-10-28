import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, onErrorResumeNext } from "rxjs";
import { Router } from '@angular/router';
import axios from "axios";
import { environment } from "src/environments/environment";

const api = axios.create({
    baseURL: environment.apiUrl,
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

  async registro(
    rut: string, 
    nombre: string, 
    apellido: string, 
    email: string, 
    password: string
  ) {
  try {
    console.log("Enviando datos de registro:", { 
      rut, 
      first_name: nombre, 
      last_name: apellido, 
      email,
      password1: '***',
      password2: '***'
    });
    
    // dj-rest-auth espera password1 y password2
    const response = await api.post("registration/", {
      rut: rut,
      first_name: nombre,
      last_name: apellido,
      email: email,
      password1: password,  // IMPORTANTE: dj-rest-auth usa password1 y password2
      password2: password
    });
    
    console.log("Respuesta del registro:", response.data);
    
    // dj-rest-auth con JWT retorna el token directamente
    const access = response.data.token.access || response.data.access;
    
    if (access) {
      alert("Registro exitoso");
      localStorage.setItem('auth_token', access);
      this.router.navigate(['/hub']);
    } else {
      console.log("Estructura de respuesta:", response.data);
      alert("Registro exitoso pero verifica el token en consola");
    }
    
  } catch (error: any) {
    console.error("Error completo:", error);
    console.error("Respuesta del servidor:", error.response?.data);
    console.error("Status:", error.response?.status);
    
    if (error.response?.data) {
      const errores = error.response.data;
      
      // Si es HTML (error 404)
      if (typeof errores === 'string' && errores.includes('<!DOCTYPE')) {
        alert("Error: Endpoint no encontrado");
        return;
      }
      
      // Mostrar errores específicos
      let mensajeError = "Errores en el registro:\n";
      for (const [campo, mensajes] of Object.entries(errores)) {
        if (Array.isArray(mensajes)) {
          mensajeError += `${campo}: ${mensajes.join(', ')}\n`;
        } else {
          mensajeError += `${campo}: ${mensajes}\n`;
        }
      }
      alert(mensajeError);
    } else {
      alert("Error al registrar usuario");
    }
    
    throw error;
  }
}


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
    return api.get("lista/usuarios")
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
  console.log("Enviando cambio de contraseña:", {
    code: codigo,
    new_password: '***',
    confirm_password: '***'
  });
  
  return api.post("password-reset-change/", {
    code: codigo,
    new_password: nuevaPassword,
    confirm_password: confirmarPassword
  }).then(response => {
    console.log("Respuesta del cambio:", response.data);
    return response.data;
  }).catch(error => {
    console.error("Error en cambio de contraseña:", error);
    console.error("Detalles del error:", error.response?.data);
    throw error.response?.data || error;
  });
}
  async crearPedido(direccion: String, fechaEntrega: String, lineas: {
    producto_id: Number, cajas: {peso: Number, etiqueta?: String}[]
  }[]){
    try{
      console.log("Creando pedido con: ", {direccion, fechaEntrega, lineas})

      const res = await api.post("pedidos/", {
        direccion: direccion,
        fecha_entrega: fechaEntrega,
        lineas: lineas
      });

      console.log("Pedido creado correctamente: ", res.data)

      alert("Pedido creado con éxito");

      return res.data
    }catch(error: any){
      console.error("Error al crear pedido: ", error);
      console.error("Detalle del servidor: ", error.res?.data)

      if (error.res?.data){
        const errores = error.res.data;
        let mensaje = "Error al crear el pedido\n";
        for(const [campo, mensajes] of Object.entries(errores)){
          if(Array.isArray(mensajes)){
            mensaje += `${campo}: ${mensajes.join(", ")}\n`;
          }else{
            mensaje += `${campo}: ${mensajes}\n`;
          }
        }
        alert(mensaje);
      }else{
        alert("Error desconocido al crear el pedido");
      }

      throw error;
    }
  } 

  async productos(){
    let productos
    try{
      const res = await api.get("productos/")

      productos = res.data

      return productos
    } catch (error) {
      console.error(error)
    }
    

  }

  async listarPedidos(){
    let pedidos;
    try{
      console.log("Mostrando proyectos del día");
      const res = await api.get("pedidos/");

      pedidos = res.data;

      console.log(pedidos);
      return pedidos
    } catch(error){
      console.log(error);
    }
  }

  async eliminarPedidos(ids: object){
    try{
      await api.delete("pedidos/eliminar_multiples/",{
        data: {
          ids
        }
      });
      console.log("Pedido eliminado");
      alert("Pedido eliminado");
    } catch(error){
      console.error("Se produjo un error al eliminar");
      alert("Se produjo un erro al eliminar");
    }
  };

  async eliminarPedido(id: number){
    try{
      await api.delete(`pedidos/${id}/`);
      console.log("Pedido eliminado");
      alert("Pedido eliminado");
    } catch(error){
      console.error("Se produjo un error al eliminar");
      alert("Se produjo un erro al eliminar");
    }
  };

  async editarPedido(id: number, pedido: object){
    try{
      await api.put(`pedidos/${id}/`, pedido)
      console.log('Pedido editado con exito');
      alert('Pedido editado con exito');
    } catch(error){
      console.error('Error al editar pedido');
      alert('Error al editar pedido');
    }
  };

  async guardarPesosPedido(id: number, pedidoCompleto: any, productosConPesos: any[]) {
    try {
      const payload = {
        direccion: pedidoCompleto.direccion,
        fecha_entrega: new Date().toISOString().split('T')[0],
        estado: 'listo_facturar',  // ← AGREGAR ESTO
        lineas: productosConPesos.map((producto) => ({
          producto_id: producto.id,
          cajas: producto.pesos.map((peso: number, cajaIndex: number) => ({
            peso: peso,
            etiqueta: `Caja ${cajaIndex + 1}`
          }))
        }))
      };

      console.log('Payload para guardar pesos:', JSON.stringify(payload, null, 2));

      const response = await api.put(`pedidos/${id}/`, payload);
      console.log('Pesos guardados con éxito');
      return response;
    } catch(error) {
      console.error('Error al guardar pesos:', error);
      throw error;
    }
  }

  async actualizarEstadoPedido(id: number, estado: string) {
    try {
      console.log(`Actualizando estado del pedido ${id} a: ${estado}`);
      
      // Primero obtenemos el pedido completo
      const getResponse = await api.get(`pedidos/${id}/`);
      const pedidoActual = getResponse.data;
      
      console.log('Pedido actual:', pedidoActual);
      
      // Construimos el payload manteniendo TODA la estructura original
      const payload = {
        direccion: pedidoActual.direccion,
        fecha_entrega: pedidoActual.fecha_entrega,
        estado: estado,  // Solo cambiamos el estado
        lineas: pedidoActual.lineas.map((linea: any) => ({
          producto_id: linea.producto.id,
          cajas: linea.cajas && linea.cajas.length > 0 
            ? linea.cajas.map((caja: any) => ({
                peso: Number(caja.peso),
                etiqueta: caja.etiqueta || `Caja ${linea.cajas.indexOf(caja) + 1}`
              }))
            : []
        }))
      };
      
      console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
      
      const updateResponse = await api.put(`pedidos/${id}/`, payload);
      console.log('Estado actualizado exitosamente');
      return updateResponse;
      
    } catch(error: any) {
      console.error('Error completo:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      throw error;
    }
  }

}
