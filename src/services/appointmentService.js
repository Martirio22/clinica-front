import { apiRequest } from './api'

export const appointmentService = {
  crear: async (appointmentData) => {
    const response = await apiRequest('/scheduling/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    })

    return response.data
  },

  crearDesdeBot: async (appointmentData) => {
    const response = await apiRequest('/scheduling/appointments/external/bot', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/appointments', {
      method: 'GET',
    })

    return response.data
  },

  listarConFiltros: async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.doctorId) params.append('doctorId', filters.doctorId)
    if (filters.patientId) params.append('patientId', filters.patientId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const queryString = params.toString()
    const url = queryString
      ? `/scheduling/appointments?${queryString}`
      : '/scheduling/appointments'

    const response = await apiRequest(url, {
      method: 'GET',
    })

    return response.data
  },

  consultarDisponibilidad: async (doctorId, fecha) => {
    const response = await apiRequest(
      `/scheduling/appointments/disponibilidad?doctorId=${doctorId}&fecha=${fecha}`,
      {
        method: 'GET',
      },
    )

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/appointments/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, appointmentData) => {
    const response = await apiRequest(`/scheduling/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/appointments/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
