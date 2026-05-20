import { apiRequest } from './api'

export const appointmentStatusService = {
  crear: async (statusData) => {
    const response = await apiRequest('/scheduling/appointment-status', {
      method: 'POST',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/appointment-status', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/appointment-status/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, statusData) => {
    const response = await apiRequest(`/scheduling/appointment-status/${id}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/appointment-status/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
