import axios from 'axios'

const WHATSAPP_WORKER_URL =
  import.meta.env.VITE_WHATSAPP_WORKER_URL || 'http://localhost:3978'

const api = axios.create({
  baseURL: WHATSAPP_WORKER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const normalizarLineaWorker = (linea = {}) => {
  return {
    id: linea.id || linea.lineaId,
    name: linea.nombre || linea.name || linea.id || linea.lineaId,
    phone: linea.telefono || linea.phone || '',
    description: linea.descripcion || linea.description || '',
    status: linea.estado || linea.status || 'SIN_CONEXION',
    isConnected: Boolean(
      linea.conectado ||
      linea.inicializado ||
      linea.estado === 'CONECTADO' ||
      linea.status === 'CONECTADO',
    ),
    connected: Boolean(
      linea.conectado ||
      linea.inicializado ||
      linea.estado === 'CONECTADO' ||
      linea.status === 'CONECTADO',
    ),
    isActive: true,
    pushname: linea.pushname || null,
    platform: linea.plataforma || null,
    qrCode: linea.qr || null,
    tieneQr: Boolean(linea.tieneQr),
    createdAt: linea.fechaCreacion || linea.createdAt || null,
    updatedAt: linea.fechaActualizacion || linea.updatedAt || null,
    raw: linea,
  }
}

export const whatsappWorkerService = {
  async listar() {
    const response = await api.get('/api/whatsapp/lineas')
    const data = response.data?.data || []

    return Array.isArray(data) ? data.map(normalizarLineaWorker) : []
  },

  async crear(payload) {
    const response = await api.post('/api/whatsapp/lineas', {
      lineaId: payload.lineaId || payload.id,
      nombre: payload.nombre || payload.name,
    })

    return normalizarLineaWorker(response.data?.data)
  },

  async obtenerEstado(lineaId) {
    const response = await api.get(`/api/whatsapp/lineas/${lineaId}/estado`)
    return normalizarLineaWorker(response.data?.data)
  },

  async obtenerQr(lineaId) {
    const response = await api.get(`/api/whatsapp/lineas/${lineaId}/qr`)
    return response.data?.data
  },

  async desconectar(lineaId) {
    const response = await api.delete(`/api/whatsapp/lineas/${lineaId}`)
    return response.data
  },

  async enviarTexto(payload) {
    const response = await api.post('/api/whatsapp/mensajes/texto', {
      lineaId: payload.lineaId,
      telefono: payload.telefono || payload.to,
      mensaje: payload.mensaje || payload.message,
      to: payload.telefono || payload.to,
      message: payload.mensaje || payload.message,
    })

    return response.data
  },
}
