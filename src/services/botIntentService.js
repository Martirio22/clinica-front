import { apiRequest } from './api'

export const botIntentService = {
  crear: async (intentData) => {
    const response = await apiRequest('/chatbotsql/bot-intents', {
      method: 'POST',
      body: JSON.stringify(intentData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/bot-intents', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-intents/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  obtenerPorCodigo: async (code) => {
    const response = await apiRequest(`/chatbotsql/bot-intents/code/${code}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, intentData) => {
    const response = await apiRequest(`/chatbotsql/bot-intents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(intentData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-intents/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
