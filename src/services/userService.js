import { apiRequest } from './api'

export const userService = {
  crear: async (userData) => {
    const response = await apiRequest('/security/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/security/users', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/security/users/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, userData) => {
    const response = await apiRequest(`/security/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/security/users/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },

  listarMedicosDisponibles: async () => {
    const response = await apiRequest('/security/users/role/medicos', {
      method: 'GET',
    })

    return response.data
  },

  listarAsistentesDisponibles: async () => {
    const response = await apiRequest('/security/users/role/asistentes', {
      method: 'GET',
    })

    return response.data
  },
}
