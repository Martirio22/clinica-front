import { apiRequest } from './api'

export const medicalPrescriptionService = {
  crear: async (prescriptionData) => {
    const response = await apiRequest('/medicalcare/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/medicalcare/prescriptions', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/medicalcare/prescriptions/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, prescriptionData) => {
    const response = await apiRequest(`/medicalcare/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prescriptionData),
    })

    return response.data
  },

  enviarWhatsapp: async (id) => {
    const response = await apiRequest(`/medicalcare/prescriptions/${id}/send-whatsapp`, {
      method: 'POST',
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/medicalcare/prescriptions/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
