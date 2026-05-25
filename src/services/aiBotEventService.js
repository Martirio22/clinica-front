import { apiRequest } from './api'

export const aiBotEventService = {
  crear: async (eventData) => {
    const response = await apiRequest('/chatbotsql/ai-bot-events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/ai-bot-events', {
      method: 'GET',
    })

    return response.data
  },

  listarConFiltros: async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.chatSessionId) params.append('chatSessionId', filters.chatSessionId)
    if (filters.botIntentId) params.append('botIntentId', filters.botIntentId)

    if (filters.requiresHuman !== undefined && filters.requiresHuman !== null) {
      params.append('requiresHuman', filters.requiresHuman)
    }

    const queryString = params.toString()
    const url = queryString
      ? `/chatbotsql/ai-bot-events?${queryString}`
      : '/chatbotsql/ai-bot-events'

    const response = await apiRequest(url, {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/ai-bot-events/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, eventData) => {
    const response = await apiRequest(`/chatbotsql/ai-bot-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/ai-bot-events/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
