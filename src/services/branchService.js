import { apiRequest } from './api'

export const branchService = {
  crear: async (branchData) => {
    const response = await apiRequest('/clinic/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/branches', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/branches/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, branchData) => {
    const response = await apiRequest(`/clinic/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/branches/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
