import { apiRequest } from './api'

export const medicalPrescriptionDetailService = {
  crear: async (detailData) => {
    const response = await apiRequest('/medicalcare/prescriptions-detail', {
      method: 'POST',
      body: JSON.stringify(detailData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/medicalcare/prescriptions-detail', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/medicalcare/prescriptions-detail/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, detailData) => {
    const response = await apiRequest(`/medicalcare/prescriptions-detail/${id}`, {
      method: 'PUT',
      body: JSON.stringify(detailData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/medicalcare/prescriptions-detail/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
