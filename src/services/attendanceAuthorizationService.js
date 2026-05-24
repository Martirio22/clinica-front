import { apiRequest } from './api'

export const attendanceAuthorizationService = {
  crear: async (authorizationData) => {
    const response = await apiRequest('/scheduling/attendance', {
      method: 'POST',
      body: JSON.stringify(authorizationData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/attendance', {
      method: 'GET',
    })

    return response.data
  },

  listarConFiltros: async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.appointmentId) params.append('appointmentId', filters.appointmentId)
    if (filters.isAuthorized !== undefined && filters.isAuthorized !== null) {
      params.append('isAuthorized', filters.isAuthorized)
    }
    if (filters.authorizedByUserId) params.append('authorizedByUserId', filters.authorizedByUserId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const queryString = params.toString()
    const url = queryString
      ? `/scheduling/attendance?${queryString}`
      : '/scheduling/attendance'

    const response = await apiRequest(url, {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/attendance/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, authorizationData) => {
    const response = await apiRequest(`/scheduling/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(authorizationData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/attendance/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
