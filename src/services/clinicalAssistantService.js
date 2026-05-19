import { apiRequest } from './api'

export const clinicalAssistantService = {
  crear: async (clinicalAssistantData) => {
    const response = await apiRequest('/clinic/clinical-assistants', {
      method: 'POST',
      body: JSON.stringify(clinicalAssistantData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/clinic/clinical-assistants', {
      method: 'GET',
    })

    return response.data
  },

  obtener: async (id) => {
    const response = await apiRequest(`/clinic/clinical-assistants/${id}`, {
      method: 'GET',
    })

    return response.data
  },

  actualizar: async (id, clinicalAssistantData) => {
    const response = await apiRequest(`/clinic/clinical-assistants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clinicalAssistantData),
    })

    return response.data
  },

  eliminar: async (id) => {
    const response = await apiRequest(`/clinic/clinical-assistants/${id}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
