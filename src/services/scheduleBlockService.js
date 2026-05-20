import { apiRequest } from './api'

export const scheduleBlockService = {
  crear: async (blockData) => {
    const response = await apiRequest('/scheduling/block', {
      method: 'POST',
      body: JSON.stringify(blockData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/block', {
      method: 'GET',
    })

    return response.data
  },

  listarPorDoctor: async (doctorId) => {
    const response = await apiRequest(`/scheduling/block?doctorId=${doctorId}`, {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/block/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, blockData) => {
    const response = await apiRequest(`/scheduling/block/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blockData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/block/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
