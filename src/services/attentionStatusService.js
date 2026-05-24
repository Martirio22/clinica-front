import { apiRequest } from './api'

export const attentionStatusService = {
  crear: async (statusData) => {
    const response = await apiRequest('/medicalcare/attention-status', {
      method: 'POST',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/medicalcare/attention-status', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/medicalcare/attention-status/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, statusData) => {
    const response = await apiRequest(`/medicalcare/attention-status/${id}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/medicalcare/attention-status/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
