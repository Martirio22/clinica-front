import { apiRequest } from './api'

export const scheduleBlockTypeService = {
  crear: async (blockTypeData) => {
    const response = await apiRequest('/scheduling/block-types', {
      method: 'POST',
      body: JSON.stringify(blockTypeData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/scheduling/block-types', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/scheduling/block-types/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, blockTypeData) => {
    const response = await apiRequest(`/scheduling/block-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blockTypeData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/scheduling/block-types/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
