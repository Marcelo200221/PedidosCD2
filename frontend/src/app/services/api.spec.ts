import { Injectable } from "@angular/core";
import { Router } from '@angular/router';
import axios from "axios";
import { environment } from "src/environments/environment.prod";
import { getItem as ssGetItem, setItem as ssSetItem, removeItem as ssRemoveItem } from './token-storage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';

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

  // Solicitar permisos de almacenamiento y notificaciones
  async solicitarPermisos(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // En web no se necesitan permisos especiales
    }

    try {
      const notifPermission = await LocalNotifications.requestPermissions();
      
      if (notifPermission.display !== 'granted') {
        console.warn('Permiso de notificaciones denegado');
      }
      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  private async notificarPedidoCreado(id: number, cliente: string) {
  if (!Capacitor.isNativePlatform()) return; // Solo móvil

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: "Pedido creado",
          body: `Se creó el pedido #${id} para ${cliente}`,
          smallIcon: "ic_stat_icon",
          sound: "default",
          extra: { pedidoId: id }
        }
      ]
    });
  } catch (error) {
    console.error("Error mostrando notificación de creación:", error);
  }
}

private async notificarPedidoEliminado(id: number) {
  if (!Capacitor.isNativePlatform()) return; // Solo móvil

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: "Pedido eliminado",
          body: `El pedido #${id} fue eliminado`,
          smallIcon: "ic_stat_icon",
          sound: "default",
          extra: { pedidoId: id }
        }
      ]
    });
  } catch (error) {
    console.error("Error mostrando notificación de eliminación:", error);
  }
}

private async notificarPedidosEliminados(ids: number[]) {
  if (!Capacitor.isNativePlatform()) return; // Solo móvil

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: "Pedidos eliminados",
          body: `Se eliminaron ${ids.length} pedidos`,
          smallIcon: "ic_stat_icon",
          sound: "default",
          extra: { ids }
        }
      ]
    });
  } catch (error) {
    console.error("Error mostrando notificación múltiple:", error);
  }
}

  // Generar factura con notificación y apertura
  async generarFacturaPorPedido(pedidoId: number, opciones?: {
    factura_numero?: string;
    descuento?: number;
    impuesto_porcentaje?: number;
    moneda?: string;
    notas?: string;
  }): Promise<void> {
    try {
      //Solicitar permisos antes de descargar
      await this.solicitarPermisos();

      //Generar el PDF
      const payload = {
        ...opciones,
        fecha: new Date().toISOString().split("T")[0] 
      };

      const res = await api.post(
        `facturas/generar-por-pedido/${pedidoId}`,
        payload,
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fileName = `factura-pedido-${pedidoId}.pdf`;

      if (Capacitor.isNativePlatform()) {
        // Guardar en móvil
        const filePath = await this.guardarArchivoNativo(fileName, blob);
        
        // Mostrar notificación con capacidad de abrir el archivo
        await this.mostrarNotificacionDescarga(pedidoId, filePath, fileName);
      } else {
        // Descargar en navegador web
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

  // Previsualizar factura
  async previsualizarFacturaPorPedido(pedidoId: number, opciones?: {
    factura_numero?: string;
    descuento?: number;
    impuesto_porcentaje?: number;
    moneda?: string;
    notas?: string;
  }): Promise<void> {
    try {
      const res = await api.post(`facturas/generar-por-pedido/${pedidoId}`, opciones || {}, { 
        responseType: 'blob' 
      });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fileName = `factura-pedido-${pedidoId}-preview.pdf`;

      if (Capacitor.isNativePlatform()) {
        // Guardar temporalmente y abrir
        const filePath = await this.guardarArchivoNativo(fileName, blob, Directory.Cache);
        await this.abrirArchivoPDF(filePath);
      } else {
        // Abrir en nueva pestaña en web
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error al previsualizar factura:', error);
      throw error;
    }
  }

  // Mostrar notificación de descarga completada
  private async mostrarNotificacionDescarga(pedidoId: number, filePath: string, fileName: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Factura Generada',
            body: `El PDF de la orden #${pedidoId} se generó correctamente`,
            id: pedidoId,
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              filePath: filePath,
              fileName: fileName
            }
          }
        ]
      });

      // Escuchar cuando el usuario toque la notificación
      await LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
        if (notification.notification.id === pedidoId) {
          const path = notification.notification.extra?.filePath;
          if (path) {
            await this.abrirArchivoPDF(path);
          }
        }
      });

    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  }

  // Abrir archivo PDF en el visor nativo
  private async abrirArchivoPDF(filePath: string): Promise<void> {
    try {
      // Usar FileOpener para abrir el PDF
      await FileOpener.open({
        filePath: filePath,
        contentType: 'application/pdf',
        openWithDefault: true
      });
    } catch (error: any) {
      console.error('Error abriendo PDF:', error);
      
      // Si falla, intentar compartir el archivo
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: 'Factura PDF',
          text: 'Abrir factura',
          url: filePath,
          dialogTitle: 'Abrir con...'
        });
      } catch (shareError) {
        console.error('Error compartiendo archivo:', shareError);
      }
    }
  }

  // Guardar archivo en el dispositivo nativo
  private async guardarArchivoNativo(
    fileName: string, 
    blob: Blob, 
    directory: Directory = Directory.Documents
  ): Promise<string> {
    const folder = directory === Directory.Documents ? 'facturas' : 'facturas/tmp';
    const pathFile = `${folder}/${fileName}`;
    const base64Data = await this.blobToBase64(blob);

    try {
      // Crear carpeta si no existe
      await Filesystem.mkdir({ 
        path: folder, 
        directory, 
        recursive: true 
      });
    } catch (err: any) {
      const message = String(err?.message || '').toLowerCase();
      if (!message.includes('exist')) {
        console.warn('Error creando directorio:', err);
      }
    }

    // Guardar el archivo
    const result = await Filesystem.writeFile({
      path: pathFile,
      data: base64Data,
      directory,
      recursive: true
    });
    
    // Retornar la URI del archivo para abrirlo después
    return result.uri;
  }

  // Convertir Blob a Base64
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

  // ... resto de tus métodos existentes ...

  async registro(
    rut: string, 
    nombre: string, 
    apellido: string, 
    email: string, 
    password: string
  ) {
    try {
      
      const response = await api.post("registration/", {
        rut: rut,
        first_name: nombre,
        last_name: apellido,
        email: email,
        password1: password,
        password2: password
      });
      
      
      const access = response.data.token.access || response.data.access;
      
      if (access) {
        await ssSetItem('auth_token', access);
        this.router.navigate(['/hub']);
      } else {
        alert("Por favor inicia sesión")
      }
      
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Respuesta del servidor:", error.response?.data);
      console.error("Status:", error.response?.status);
      
      if (error.response?.data) {
        const errores = error.response.data;
        
        if (typeof errores === 'string' && errores.includes('<!DOCTYPE')) {
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
        alert(mensajeError);
      } else {
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
      
      if(access){
        ssSetItem('auth_token', access)
        ssSetItem('user', JSON.stringify(user))
        this.router.navigate(['/hub']);
      }
    })
  }

  async darPermisos(id: string){
    try{
      await api.put(`dar/permisos/${id}`)
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

  getUsuarios(){
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
    
    return await api.post("password-reset-change/", {
      code: codigo,
      new_password: nuevaPassword,
      confirm_password: confirmarPassword
    }).then(response => {
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

      const res = await api.post("pedidos/", {
        cliente: cliente,
        direccion: direccion,
        fecha_entrega: fechaEntrega,
        lineas: lineas
      });

      await this.notificarPedidoCreado(res.data.id, String(cliente));
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
      }else{
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
      const res = await api.get("pedidos/");
      pedidos = res.data;
      return pedidos
    } catch(error){
      console.error(error);
    }
  }

  async eliminarPedidos(ids: number[]) {
    try {
      await api.delete("pedidos/eliminar_multiples/", {
        data: { ids }
      });
      await this.notificarPedidosEliminados(ids);

    } catch (error) {
      console.error("Error al eliminar múltiples pedidos:", error);
    }
  }

  async editarPedido(id: number, pedido: object){
    try{
      await api.put(`pedidos/${id}/`, pedido)
    } catch(error){
      console.error('Error al editar pedido');
    }
  }

  async guardarPesosPedido(id: number, productosConPesos: any[]) {
    try {
      // Primero obtener el pedido completo del backend para tener todos los datos
      const pedidosBackend = await api.get("pedidos/");
      const pedidoOriginal = pedidosBackend.data.find((p: any) => p.id === id);
      
      if (!pedidoOriginal) {
        throw new Error('Pedido no encontrado');
      }


      const payload = {
        direccion: pedidoOriginal.direccion,
        fecha_entrega: pedidoOriginal.fecha_entrega,
        estado: 'listo_facturar', 
        lineas: productosConPesos.map((producto) => ({
          producto_id: producto.id,
          cajas: producto.pesos.map((peso: number, cajaIndex: number) => ({
            peso: peso,
            etiqueta: `Caja ${cajaIndex + 1}`
          }))
        }))
      };

      const response = await api.put(`pedidos/${id}/`, payload);
      return response;
    } catch(error) {
      console.error('Error al guardar pesos:', error);
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
      const payload = { estado } as any;
      const updateResponse = await api.patch(`pedidos/${id}/`, payload);
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


}