import { Injectable, Injector } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, onErrorResumeNext } from "rxjs";
import { Router } from '@angular/router';
import axios from "axios";
import { environment } from "src/environments/environment.prod";
import { getItem as ssGetItem, setItem as ssSetItem, removeItem as ssRemoveItem } from './token-storage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { NotificacionService } from './notificacion.service';

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
  private _notificacion?: NotificacionService; 

  constructor(
    private router: Router,
    private injector: Injector 
  ){ }

  private get notificacion(): NotificacionService {
    if (!this._notificacion) {
      this._notificacion = this.injector.get(NotificacionService);
    }
    return this._notificacion;
  }

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
    
    const response = await api.post("registration/", {
      rut: rut,
      first_name: nombre,
      last_name: apellido,
      email: email,
      password1: password,
      password2: password
    });
    
    console.log("Respuesta del registro:", response.data);
    
    const access = response.data.token.access || response.data.access;
    
    if (access) {
      await this.notificacion.showSuccess("Registro exitoso");
      await ssSetItem('auth_token', access);
      this.router.navigate(['/hub']);
    } else {
      console.log("Estructura de respuesta:", response.data);
      await this.notificacion.showWarning("Registro exitoso pero verifica el token en consola");
    }
    
  } catch (error: any) {
    console.error("Error completo:", error);
    console.error("Respuesta del servidor:", error.response?.data);
    console.error("Status:", error.response?.status);
    
    if (error.response?.data) {
      const errores = error.response.data;
      
      if (typeof errores === 'string' && errores.includes('<!DOCTYPE')) {
        await this.notificacion.showError("Error: Endpoint no encontrado");
        return;
      }
      
      let mensajeError = "Errores en el registro:\n";
      for (const [campo, mensajes] of Object.entries(errores)) {
        if (Array.isArray(mensajes)) {
          mensajeError += `${campo}: ${mensajes.join(', ')}\n`;
        } else {
          mensajeError += `${campo}: ${mensajes}\n`;
        }
      }
      await this.notificacion.showError(mensajeError);
    } else {
      await this.notificacion.showError("Error al registrar usuario");
    }
    
    throw error;
  }
}

  async login(rut: string, password: string){
    return await api.post("auth/login/", {
      username: rut,
      password: password
    }).then(async response => {
      const access = response.data.token.access;
      const user = response.data.user;
      console.log(response.data)
      
      if(access){
        await this.notificacion.showSuccess("Inicio de sesión exitoso");
        ssSetItem('auth_token', access)
        ssSetItem('user', JSON.stringify(user))
        this.router.navigate(['/hub']);
      }
    })
  }

  async darPermisos(id: string){
    try{
      await api.put(`dar/permisos/${id}`)
      console.log("Permisos de administrador asignados ")
      await this.notificacion.showSuccess("Permisos de administrador asignados");

    } catch(error){
      console.error(error)
    }
  }

  async saveToken(token: string){
    await ssSetItem('auth_token', token);
  }

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

  async actualizarPerfil(payload: { first_name?: string; last_name?: string; email?: string; nombre?: string; apellido?: string; correo?: string }): Promise<any> {
    try {
      const res = await api.patch('usuarios/perfil', payload);
      return res.data;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  async logout(){
    await ssRemoveItem('auth_token');
    await ssRemoveItem('user');
    this.router.navigate(['/home']);
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
        await this.notificacion.showError(mensaje);
      }else{
        await this.notificacion.showError("Error desconocido al crear el pedido");
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
    } catch(error){
      console.error("Se produjo un error al eliminar");
      await this.notificacion.showError("Se produjo un error al eliminar");
    }
  };

  async eliminarPedido(id: number){
    try{
      await api.delete(`pedidos/${id}/`);
      console.log("Pedido eliminado");
    } catch(error){
      console.error("Se produjo un error al eliminar");
      await this.notificacion.showError("Se produjo un error al eliminar");
    }
  };

  async editarPedido(id: number, pedido: object){
    try{
      await api.put(`pedidos/${id}/`, pedido)
      console.log('Pedido editado con exito');
    } catch(error){
      console.error('Error al editar pedido');
    }
  };

  async guardarPesosPedido(id: number, pedidoCompleto: any, productosConPesos: any[]) {
    try {
      const payload = {
        direccion: pedidoCompleto.direccion,
        fecha_entrega: new Date().toISOString().split('T')[0],
        estado: 'listo_facturar', 
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
      const fileName = `factura-pedido-${pedidoId}.pdf`;

      if (Capacitor.isNativePlatform()) {
        await this.guardarArchivoNativo(fileName, blob);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error al generar factura:', error);
      throw error;
    }
  }

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
      const fileName = `factura-pedido-${pedidoId}-preview.pdf`;

      if (Capacitor.isNativePlatform()) {
        await this.guardarArchivoNativo(fileName, blob, Directory.Cache);
      } else {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
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

  async infoCliente(id: String){
    try{
      const res = await api.get(`datos/cliente/${id}`);
      const data = res.data || {};
      const normalizado = {
        id: data.id_cliente ?? data.id ?? String(id),
        rut: data.rut ?? '',
        nombre: data.nombre ?? '',
        direccion: data.direccion ?? '',
        razonSocial: data.razon_social ?? data.razonSocial ?? ''
      };
      console.log('Cliente (normalizado):', normalizado);
      return normalizado;
    } catch(error){
      console.error(error);
      throw error;
    }
  }

  async editarCliente(id: string, rut: string, nombre: string, direccion: string, razonSocial: string){
    try{
      await api.put(`editar/cliente/${id}`, {
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

  async actualizarEstadoPedido(id: number, estado: string) {
    try {
      console.log(`Actualizando estado del pedido ${id} a: ${estado}`);

      const payload = { estado } as any;

      const updateResponse = await api.patch(`pedidos/${id}/`, payload);
      console.log('Estado actualizado exitosamente');
      return updateResponse;

    } catch (error: any) {
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

  async actualizarStock(stock: number, id: number){
    try{
      await api.put("editar/stock", {
        stock: stock,
        pk: id
      })
    }catch(error){
      console.error(error)
    }
  }

  async getAvisos(): Promise<any[]> {
    try {
      const res = await api.get("avisos/");
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error('Error obteniendo avisos:', error);
      return [];
    }
  }

  async listarProductosMasVendidos(): Promise<any[]> {
    try {
      console.log('Obteniendo productos mas vendidos');
      const res = await api.get("productos/mas-vendidos/");
      console.log('Productos mas vendidos:', res.data);
      return res.data;
    } catch (error) {
      console.error('Error al obtener productos mas vendidos:', error);
      return [];
    }
  }

  async listarClientesConMasPedidos(): Promise<any[]> {
    try {
      console.log('Obteniendo clientes con mas pedidos');
      const res = await api.get("clientes-mas-pedidos/");
      console.log('Clientes con mas pedidos:', res.data);
      return res.data;
    } catch (error) {
      console.error('Error al obtener clientes con mas pedidos:', error);
      return [];
    }
  }

  private async guardarArchivoNativo(fileName: string, blob: Blob, directory: Directory = Directory.Documents) {
    const folder = directory === Directory.Documents ? 'facturas' : 'facturas/tmp';
    const pathFile = `${folder}/${fileName}`;
    const base64Data = await this.blobToBase64(blob);

    try {
      await Filesystem.mkdir({ path: folder, directory, recursive: true });
    } catch (err: any) {
      const message = String(err?.message || '').toLowerCase();
      if (!message.includes('exist')) {
        throw err;
      }
    }

    await Filesystem.writeFile({
      path: pathFile,
      data: base64Data,
      directory
    });
    console.log(`Archivo guardado en ${directory}/${pathFile}`);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const data = reader.result;
        if (typeof data === 'string') {
          const commaIndex = data.indexOf(',');
          resolve(commaIndex >= 0 ? data.slice(commaIndex + 1) : data);
        } else {
          reject(new Error('No se pudo convertir el archivo a base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}