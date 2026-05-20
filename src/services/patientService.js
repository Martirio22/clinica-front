import { apiRequest } from './api'

export const patientService = {
  crear: async (patientData) => {
    const response = await apiRequest('/clinic/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/patients', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/patients/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, patientData) => {
    const response = await apiRequest(`/clinic/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/patients/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
