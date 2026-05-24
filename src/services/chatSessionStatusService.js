import { apiRequest } from './api'

export const chatSessionStatusService = {
  crear: async (statusData) => {
    const response = await apiRequest('/chatbotsql/chat-session-statuses', {
      method: 'POST',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/chat-session-statuses', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/chat-session-statuses/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  obtenerPorCodigo: async (code) => {
    const response = await apiRequest(`/chatbotsql/chat-session-statuses/code/${code}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, statusData) => {
    const response = await apiRequest(`/chatbotsql/chat-session-statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/chat-session-statuses/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
