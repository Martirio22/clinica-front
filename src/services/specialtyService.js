import { apiRequest } from './api'

export const specialtyService = {
  crear: async (specialtyData) => {
    const response = await apiRequest('/clinic/specialties', {
      method: 'POST',
      body: JSON.stringify(specialtyData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/specialties', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/specialties/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, specialtyData) => {
    const response = await apiRequest(`/clinic/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(specialtyData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/specialties/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
