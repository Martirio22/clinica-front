import { apiRequest } from './api'

export const botMenuService = {
  crear: async (menuData) => {
    const response = await apiRequest('/chatbotsql/bot-menus', {
      method: 'POST',
      body: JSON.stringify(menuData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/chatbotsql/bot-menus', {
      method: 'GET',
    })

    return response.data
  },

  obtenerPrincipal: async () => {
    const response = await apiRequest('/chatbotsql/bot-menus/main', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-menus/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, menuData) => {
    const response = await apiRequest(`/chatbotsql/bot-menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/chatbotsql/bot-menus/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
