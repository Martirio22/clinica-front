import { apiRequest } from './api'

export const doctorScheduleService = {
  crear: async (scheduleData) => {
    const response = await apiRequest('/scheduling/doctor-schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/doctor-schedules', {
      method: 'GET',
    })

    return response.data
  },

  listarPorDoctor: async (doctorId) => {
    const response = await apiRequest(`/scheduling/doctor-schedules?doctorId=${doctorId}`, {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/doctor-schedules/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, scheduleData) => {
    const response = await apiRequest(`/scheduling/doctor-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/doctor-schedules/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
