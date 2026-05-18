import { apiRequest, setToken, removeToken } from './api'

export const authService = {
  register: async (userData) => {
    const response = await apiRequest('/security/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    return response.data
  },

  login: async (credentials) => {
    const response = await apiRequest('/security/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    const data = response.data

    if (data?.accessToken) {
      setToken(data.accessToken)
    }

    if (data?.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }

    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    return data
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken')

    const response = await apiRequest('/security/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    const data = response.data

    if (data?.accessToken) {
      setToken(data.accessToken)
    }

    if (data?.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }

    return data
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')

    try {
      await apiRequest('/security/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },

  me: async () => {
    const response = await apiRequest('/security/auth/me', {
      method: 'GET',
    })

    return response.data
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken')
  },
}
