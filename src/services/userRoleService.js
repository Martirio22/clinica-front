import { apiRequest } from './api'

export const userRoleService = {
  asignar: async (userRoleData) => {
    const response = await apiRequest('/security/user-roles', {
      method: 'POST',
      body: JSON.stringify(userRoleData),
    })

    return response.data
  },

  listar: async () => {
    const response = await apiRequest('/security/user-roles', {
      method: 'GET',
    })

    return response.data
  },

  listarRolesPorUser: async (userId) => {
    const response = await apiRequest(`/security/user-roles/users/${userId}/roles`, {
      method: 'GET',
    })

    return response.data
  },

  remover: async (userId, roleId) => {
    const response = await apiRequest(`/security/user-roles/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    })

    return response.data
  },
}
