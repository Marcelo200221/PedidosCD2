import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, onErrorResumeNext } from "rxjs";
import { Router } from '@angular/router';
import axios from "axios";
import { environment } from "src/environments/environment";
import { getItem as ssGetItem, setItem as ssSetItem, removeItem as ssRemoveItem } from './token-storage';

const api = axios.create({
    baseURL: environment.apiUrl,
    headers: {
      "Content-Type": "application/json",
    },
})

api.interceptors.request.use(
  async (config) => {
    const token = await ssGetItem('auth_token');
    if(token){
      config.headers = config.headers || {} as any;
      (config.headers as any).Authorization = `Bearer ${token}`;
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
      ssRemoveItem('auth_token');
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
      await ssSetItem('auth_token', access);
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


  async login(rut: string, password: string){
    return await api.post("auth/login/", {
      username: rut,
      password: password
    }).then(response => {
      const access = response.data.token.access;
      const user = response.data.user;
      console.log(response.data)
      
      if(access){
        alert("Inicio de sesion exitoso")
        ssSetItem('auth_token', access)
        ssSetItem('user', JSON.stringify(user))
        this.router.navigate(['/hub']);
      }
    })
  }

  async saveToken(token: string){
    await ssSetItem('auth_token', token);
  }
  // Agregar estos métodos nuevos
  async getUsuarioActual(): Promise<any | null> {
    const userStr = await ssGetItem('user');
    if (!userStr) return null;
    try {
      const u = JSON.parse(userStr);
      const nombre = u.nombre ?? u.first_name ?? u.firstName ?? (typeof u.name === 'string' ? u.name.split(' ')[0] : undefined) ?? '';
      const apellido = u.apellido ?? u.last_name ?? u.lastName ?? (typeof u.name === 'string' ? (u.name.split(' ').slice(1).join(' ') || '') : undefined) ?? '';
      return { ...u, nombre, apellido };
    } catch (_) {
      return null;
    }
  }

  async getNombreCompleto(): Promise<string> {
    const usuario = await this.getUsuarioActual();
    return usuario ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() : '';
  }

  async getToken(): Promise<string | null> {
    return await ssGetItem('auth_token');
  }

  async logout(){
    await ssRemoveItem('auth_token');
    await ssRemoveItem('user');
    this.router.navigate(['/login']);
  }

  getHello(){
    return api.get("hello/");
  }

  getUsuarios(){
    console.log("Obteniendo Usuarios")
    return api.get("lista/usuarios")
  }

  async recuperarPassword(email: string): Promise<any>{
    return await api.post('password-reset-request/', {
      email: email
    }).then(response => {
      return response.data
    }).catch(error => {
      throw error.response?.data || error;
    });
  }

  async confirmarRecuperacion(codigo: string): Promise<any>{
    return await api.post("password-reset-confirm/", {
      code: codigo,
    }).then(response => {
      return response.data;
    }).catch(error => {
      throw error.response?.data || error;
    })
  }

  async cambiarPassword(codigo: string, nuevaPassword: string, confirmarPassword: string): Promise<any>{
  console.log("Enviando cambio de contraseña:", {
    code: codigo,
    new_password: '***',
    confirm_password: '***'
  });
  
  return await api.post("password-reset-change/", {
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
  async crearPedido(cliente: String,direccion: String, fechaEntrega: String, lineas: {
    producto_id: Number, cajas: {peso: Number, etiqueta?: String}[]
  }[]){
    try{
      console.log("Creando pedido con: ", {direccion, fechaEntrega, lineas})

      const res = await api.post("pedidos/", {
        cliente: cliente,
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

  // Facturación: generar PDF por pedido (descargar)
  async generarFacturaPorPedido(pedidoId: number, opciones?: {
    factura_numero?: string;
    descuento?: number;
    impuesto_porcentaje?: number;
    moneda?: string;
    notas?: string;
  }): Promise<void> {
    try {
      const res = await api.post(`facturas/generar-por-pedido/${pedidoId}`, opciones || {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-pedido-${pedidoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar factura:', error);
      throw error;
    }
  }

  // Facturación: previsualizar PDF por pedido (abre en nueva pestaña)
  async previsualizarFacturaPorPedido(pedidoId: number, opciones?: {
    factura_numero?: string;
    descuento?: number;
    impuesto_porcentaje?: number;
    moneda?: string;
    notas?: string;
  }): Promise<void> {
    try {
      const res = await api.post(`facturas/generar-por-pedido/${pedidoId}`, opciones || {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al previsualizar factura:', error);
      throw error;
    }
  }

  async agregarCliente(id: string, rut: string, nombre: string, direccion: string, razonSocial: string){
    try{
      await api.post("agregar-cliente/", {
        id_cliente: id,
        rut: rut,
        nombre: nombre,
        direccion: direccion, 
        razon_social: razonSocial
      })
      this.router.navigate(['/lista-clientes'])
    } catch(error){
      console.error(error);
    }
  }

  async eliminarCliente(id: string){
    try{
      await api.delete(`eliminar/cliente/${id}`)
    } catch(error){
      console.error(error)
    }
  }

  async listarClientes(){
    let clientes;
    try{
      const res = await api.get("lista/clientes");
      clientes = res.data
      console.log(clientes)
      return clientes;
    } catch(error) {
      console.error(error);
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

  async actualizarPrecios(precio: number, id: number){
    try{
      await api.put("asignar/precio", {
        precio: precio,
        pk: id
      })
    }catch(error){
      console.error(error)
    }
  }

}
