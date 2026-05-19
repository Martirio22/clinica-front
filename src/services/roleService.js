import { apiRequest } from './api'

export const roleService = {
  crear: async (roleData) => {
    const response = await apiRequest('/security/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/security/roles', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/security/roles/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, roleData) => {
    const response = await apiRequest(`/security/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/security/roles/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
