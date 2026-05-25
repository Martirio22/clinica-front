import { apiRequest } from './api'

export const botMenuOptionService = {
  crear: async (optionData) => {
    const response = await apiRequest('/chatbotsql/bot-menu-options', {
      method: 'POST',
      body: JSON.stringify(optionData),
    })

    return response.data
  },

  listarPorMenu: async (menuBotId) => {
    const response = await apiRequest(`/chatbotsql/bot-menu-options/menu/${menuBotId}`, {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-menu-options/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, optionData) => {
    const response = await apiRequest(`/chatbotsql/bot-menu-options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(optionData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-menu-options/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
