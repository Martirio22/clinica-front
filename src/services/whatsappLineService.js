import { apiRequest } from './api'

export const whatsappLineService = {
  crear: async (lineData) => {
    const response = await apiRequest('/chatbotsql/whatsapp-lines', {
      method: 'POST',
      body: JSON.stringify(lineData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/whatsapp-lines', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/whatsapp-lines/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, lineData) => {
    const response = await apiRequest(`/chatbotsql/whatsapp-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lineData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/whatsapp-lines/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
