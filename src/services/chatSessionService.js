import { apiRequest } from './api'

export const chatSessionService = {
  crear: async (sessionData) => {
    const response = await apiRequest('/chatbotsql/chat-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/chat-sessions', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/chat-sessions/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  asignarAsistente: async (id, assistantId) => {
    const response = await apiRequest(`/chatbotsql/chat-sessions/${id}/assign-human`, {
      method: 'PUT',
      body: JSON.stringify({ assistantId }),
    })

    return response.data
  },

  cerrar: async (id, closeData) => {
    const response = await apiRequest(`/chatbotsql/chat-sessions/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify(closeData),
    })

    return response.data
  },
}
