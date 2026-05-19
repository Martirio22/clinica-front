import { apiRequest } from './api'

export const officeService = {
  crear: async (officeData) => {
    const response = await apiRequest('/clinic/offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/offices', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/offices/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  listarPorBranch: async (branchId) => {
    const response = await apiRequest(`/clinic/offices/branch/${branchId}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, officeData) => {
    const response = await apiRequest(`/clinic/offices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(officeData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/offices/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
