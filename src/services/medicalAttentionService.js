import { apiRequest } from './api'

export const medicalAttentionService = {
  iniciar: async (attentionData) => {
    const response = await apiRequest('/medicalcare/medical-attention', {
      method: 'POST',
      body: JSON.stringify(attentionData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/medicalcare/medical-attention', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/medicalcare/medical-attention/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  finalizar: async (id, attentionData) => {
    const response = await apiRequest(`/medicalcare/medical-attention/${id}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify(attentionData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/medicalcare/medical-attention/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
