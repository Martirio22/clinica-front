import { apiRequest } from './api'

export const doctorService = {
  crear: async (doctorData) => {
    const response = await apiRequest('/clinic/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/doctors', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/doctors/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  listarPorSpecialty: async (specialtyId) => {
    const response = await apiRequest(`/clinic/doctors/specialty/${specialtyId}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, doctorData) => {
    const response = await apiRequest(`/clinic/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/doctors/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
